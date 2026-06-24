import "server-only"

import Stripe from "stripe"
import {
  DonationCheckoutStatus,
  DonationFrequency,
  DonationRefundStatus,
  DonationSource,
  DonationStatus,
  RecurringDonationStatus,
  StripeWebhookProcessingStatus,
} from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import {
  createDonationFailureNotification,
  createDonationSuccessNotification,
} from "@/lib/finance/notifications"
import {
  getChargeReceiptUrl,
  getDisputeChargeId,
  getInvoiceChargeId,
  getInvoiceCustomerId,
  getInvoicePaymentIntentId,
  getInvoiceSubscriptionId,
  getRefundChargeId,
  getSessionCustomerId,
  getSessionPaymentIntentId,
  getSessionSubscriptionId,
  getStripeClient,
  getSubscriptionCustomerId,
  getSubscriptionPriceAndProductIds,
} from "@/lib/stripe/server"

type CheckoutLookup = {
  id: string
  userId: string | null
  memberIdSnapshot: string | null
  categoryId: string
  frequency: DonationFrequency
  amountCents: number
  currency: string
  donorNameSnapshot: string | null
  donorEmailSnapshot: string | null
}

type SubscriptionPeriodCompat = Stripe.Subscription & {
  current_period_start?: number | null
  current_period_end?: number | null
}

function dateFromUnix(value: number | null | undefined) {
  return typeof value === "number" ? new Date(value * 1000) : null
}

function toRecurringStatus(status: Stripe.Subscription.Status) {
  const normalized = status.toUpperCase()

  if (normalized === "INCOMPLETE_EXPIRED") {
    return RecurringDonationStatus.INCOMPLETE_EXPIRED
  }

  if (normalized === "PAST_DUE") return RecurringDonationStatus.PAST_DUE
  if (normalized === "CANCELED") return RecurringDonationStatus.CANCELED

  if (Object.values(RecurringDonationStatus).includes(normalized as RecurringDonationStatus)) {
    return normalized as RecurringDonationStatus
  }

  return RecurringDonationStatus.INCOMPLETE
}

function toRefundStatus(status: string | null) {
  if (status === "succeeded") return DonationRefundStatus.SUCCEEDED
  if (status === "failed") return DonationRefundStatus.FAILED
  if (status === "canceled") return DonationRefundStatus.CANCELED
  return DonationRefundStatus.PENDING
}

function getObjectId(event: Stripe.Event) {
  const dataObject = event.data.object as { id?: string }
  return typeof dataObject.id === "string" ? dataObject.id : null
}

function metadataValue(
  metadata: Stripe.Metadata | null | undefined,
  key: string,
) {
  const value = metadata?.[key]
  return value && value.length > 0 ? value : null
}

async function findCheckoutForSession(session: Stripe.Checkout.Session) {
  const checkoutId = metadataValue(session.metadata, "donationCheckoutId")

  if (checkoutId) {
    const checkout = await prisma.donationCheckout.findUnique({
      where: { id: checkoutId },
    })
    if (checkout) return checkout
  }

  return prisma.donationCheckout.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  })
}

async function getFallbackCategoryId() {
  const category = await prisma.donationCategory.findFirst({
    where: { slug: "autre" },
    select: { id: true },
  })

  if (category) return category.id

  const created = await prisma.donationCategory.create({
    data: {
      id: "doncat_autre",
      slug: "autre",
      label: "Autre",
      description: "Autre forme de soutien.",
      sortOrder: 50,
    },
    select: { id: true },
  })

  return created.id
}

async function findCheckoutForSubscription(subscriptionId: string) {
  return prisma.donationCheckout.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    orderBy: { createdAt: "desc" },
  })
}

async function findCheckoutForPaymentIntent(paymentIntentId: string) {
  return prisma.donationCheckout.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    orderBy: { createdAt: "desc" },
  })
}

async function resolveChargeForPaymentIntent(paymentIntentId: string | null) {
  if (!paymentIntentId) {
    return { chargeId: null, receiptUrl: null }
  }

  const paymentIntent = await getStripeClient().paymentIntents.retrieve(
    paymentIntentId,
    { expand: ["latest_charge"] },
  )
  const latestCharge = paymentIntent.latest_charge

  if (typeof latestCharge === "string") {
    return { chargeId: latestCharge, receiptUrl: null }
  }

  return {
    chargeId: latestCharge?.id ?? null,
    receiptUrl: latestCharge ? getChargeReceiptUrl(latestCharge) : null,
  }
}

async function updateCheckoutFromSession(
  session: Stripe.Checkout.Session,
  checkout: CheckoutLookup | null,
) {
  const subscriptionId = getSessionSubscriptionId(session)
  const paymentIntentId = getSessionPaymentIntentId(session)

  await prisma.donationCheckout.updateMany({
    where: {
      OR: [
        { stripeCheckoutSessionId: session.id },
        ...(checkout ? [{ id: checkout.id }] : []),
      ],
    },
    data: {
      status:
        session.status === "complete"
          ? DonationCheckoutStatus.COMPLETED
          : session.status === "expired"
            ? DonationCheckoutStatus.EXPIRED
            : DonationCheckoutStatus.OPEN,
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: getSessionCustomerId(session),
      stripeSubscriptionId: subscriptionId,
      stripePaymentIntentId: paymentIntentId,
      livemode: session.livemode,
      completedAt:
        session.status === "complete" ? new Date() : undefined,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
    },
  })
}

async function upsertDonationFromCheckoutSession(
  session: Stripe.Checkout.Session,
  checkout: CheckoutLookup,
  status: DonationStatus,
) {
  const paymentIntentId = getSessionPaymentIntentId(session)
  const customerId = getSessionCustomerId(session)
  const { chargeId, receiptUrl } = await resolveChargeForPaymentIntent(
    paymentIntentId,
  )
  const amountCents = session.amount_total ?? checkout.amountCents
  const currency = (session.currency ?? checkout.currency).toLowerCase()

  if (amountCents !== checkout.amountCents || currency !== checkout.currency) {
    throw new Error("STRIPE_AMOUNT_OR_CURRENCY_MISMATCH")
  }

  const existing = paymentIntentId
    ? await prisma.donation.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
      })
    : await prisma.donation.findFirst({
        where: { stripeCheckoutSessionId: session.id },
      })

  const data = {
    source: DonationSource.ONLINE,
    userId: checkout.userId,
    memberIdSnapshot: checkout.memberIdSnapshot,
    checkoutId: checkout.id,
    categoryId: checkout.categoryId,
    frequency: checkout.frequency,
    status,
    amountCents,
    currency,
    donorNameSnapshot: checkout.donorNameSnapshot,
    donorEmailSnapshot: checkout.donorEmailSnapshot,
    stripeCustomerId: customerId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    stripeChargeId: chargeId,
    stripeReceiptUrl: receiptUrl,
    livemode: session.livemode,
    donatedAt: status === DonationStatus.SUCCEEDED ? new Date() : null,
    failedAt: status === DonationStatus.FAILED ? new Date() : null,
  }

  const donation = existing
    ? await prisma.donation.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.donation.create({ data })

  if (status === DonationStatus.SUCCEEDED) {
    await createDonationSuccessNotification({
      userId: donation.userId,
      donationId: donation.id,
    })
  } else if (status === DonationStatus.FAILED) {
    await createDonationFailureNotification({
      userId: donation.userId,
      donationId: donation.id,
    })
  }

  return donation
}

async function upsertRecurringDonationFromSubscription(
  subscription: Stripe.Subscription,
) {
  const subscriptionId = subscription.id
  const checkout = await findCheckoutForSubscription(subscriptionId)
  const categoryId =
    checkout?.categoryId ??
    metadataValue(subscription.metadata, "categoryId") ??
    (await getFallbackCategoryId())
  const applicationUserId =
    checkout?.userId ?? metadataValue(subscription.metadata, "applicationUserId")

  if (!applicationUserId) return null

  const user = await prisma.appUser.findUnique({
    where: { id: applicationUserId },
    include: { profile: true },
  })

  if (!user) return null

  const { priceId, productId } = getSubscriptionPriceAndProductIds(subscription)
  const item = subscription.items.data[0]
  const amountCents = item?.price.unit_amount ?? checkout?.amountCents ?? 0
  const currency = (item?.price.currency ?? checkout?.currency ?? "eur").toLowerCase()
  const period = subscription as SubscriptionPeriodCompat

  return prisma.recurringDonation.upsert({
    where: { stripeSubscriptionId: subscriptionId },
    update: {
      status: toRecurringStatus(subscription.status),
      amountCents,
      currency,
      categoryId,
      memberIdSnapshot: user.profile?.memberId ?? checkout?.memberIdSnapshot ?? null,
      stripeCustomerId: getSubscriptionCustomerId(subscription) ?? user.stripeCustomerId ?? "",
      stripePriceId: priceId,
      stripeProductId: productId,
      currentPeriodStart: dateFromUnix(period.current_period_start),
      currentPeriodEnd: dateFromUnix(period.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: dateFromUnix(subscription.canceled_at),
      endedAt: dateFromUnix(subscription.ended_at),
      livemode: subscription.livemode,
    },
    create: {
      userId: user.id,
      memberIdSnapshot: user.profile?.memberId ?? checkout?.memberIdSnapshot ?? null,
      categoryId,
      amountCents,
      currency,
      status: toRecurringStatus(subscription.status),
      stripeCustomerId: getSubscriptionCustomerId(subscription) ?? user.stripeCustomerId ?? "",
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeProductId: productId,
      currentPeriodStart: dateFromUnix(period.current_period_start),
      currentPeriodEnd: dateFromUnix(period.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: dateFromUnix(subscription.canceled_at),
      endedAt: dateFromUnix(subscription.ended_at),
      livemode: subscription.livemode,
    },
  })
}

async function retrieveSubscription(subscriptionId: string) {
  return getStripeClient().subscriptions.retrieve(subscriptionId)
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const checkout = await findCheckoutForSession(session)
  await updateCheckoutFromSession(session, checkout)

  if (session.mode === "subscription") {
    const subscriptionId = getSessionSubscriptionId(session)
    if (subscriptionId) {
      const subscription = await retrieveSubscription(subscriptionId)
      await upsertRecurringDonationFromSubscription(subscription)
    }
    return
  }

  if (!checkout) throw new Error("CHECKOUT_NOT_FOUND")

  const status =
    session.payment_status === "paid"
      ? DonationStatus.SUCCEEDED
      : DonationStatus.PENDING

  await upsertDonationFromCheckoutSession(session, checkout, status)
}

async function handleCheckoutSessionAsyncSucceeded(
  session: Stripe.Checkout.Session,
) {
  const checkout = await findCheckoutForSession(session)
  await updateCheckoutFromSession(session, checkout)
  if (!checkout) return

  await upsertDonationFromCheckoutSession(
    session,
    checkout,
    DonationStatus.SUCCEEDED,
  )
}

async function handleCheckoutSessionAsyncFailed(session: Stripe.Checkout.Session) {
  const checkout = await findCheckoutForSession(session)
  await updateCheckoutFromSession(session, checkout)
  if (!checkout) return

  await upsertDonationFromCheckoutSession(session, checkout, DonationStatus.FAILED)
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  await prisma.donationCheckout.updateMany({
    where: { stripeCheckoutSessionId: session.id },
    data: { status: DonationCheckoutStatus.EXPIRED },
  })
}

async function resolveInvoiceContext(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice)
  const paymentIntentId = getInvoicePaymentIntentId(invoice)
  const checkout =
    (subscriptionId ? await findCheckoutForSubscription(subscriptionId) : null) ??
    (paymentIntentId ? await findCheckoutForPaymentIntent(paymentIntentId) : null)
  const recurring = subscriptionId
    ? await prisma.recurringDonation.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      })
    : null

  return { subscriptionId, paymentIntentId, checkout, recurring }
}

async function handleInvoicePayment(
  invoice: Stripe.Invoice,
  status: DonationStatus,
) {
  const { subscriptionId, paymentIntentId, checkout, recurring } =
    await resolveInvoiceContext(invoice)
  const subscription =
    subscriptionId && !recurring
      ? await retrieveSubscription(subscriptionId).catch(() => null)
      : null
  const resolvedRecurring = subscription
    ? await upsertRecurringDonationFromSubscription(subscription)
    : recurring
  const userId = resolvedRecurring?.userId ?? checkout?.userId ?? null
  const categoryId =
    resolvedRecurring?.categoryId ??
    checkout?.categoryId ??
    metadataValue(invoice.metadata, "categoryId") ??
    (await getFallbackCategoryId())
  const amountCents =
    status === DonationStatus.SUCCEEDED
      ? invoice.amount_paid
      : invoice.amount_due
  const currency = invoice.currency.toLowerCase()
  const customerId = getInvoiceCustomerId(invoice)
  const chargeId = getInvoiceChargeId(invoice)

  const donation = await prisma.donation.upsert({
    where: { stripeInvoiceId: invoice.id },
    update: {
      source: DonationSource.ONLINE,
      userId,
      memberIdSnapshot:
        resolvedRecurring?.memberIdSnapshot ?? checkout?.memberIdSnapshot ?? null,
      checkoutId: checkout?.id ?? null,
      recurringDonationId: resolvedRecurring?.id ?? null,
      categoryId,
      frequency: subscriptionId
        ? DonationFrequency.MONTHLY
        : (checkout?.frequency ?? DonationFrequency.ONE_TIME),
      status,
      amountCents,
      currency,
      donorNameSnapshot: checkout?.donorNameSnapshot ?? null,
      donorEmailSnapshot: checkout?.donorEmailSnapshot ?? null,
      stripeCustomerId: customerId,
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: chargeId,
      stripeHostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      stripeInvoicePdfUrl: invoice.invoice_pdf ?? null,
      failureCode:
        status === DonationStatus.FAILED
          ? invoice.last_finalization_error?.code ?? "invoice_payment_failed"
          : null,
      livemode: invoice.livemode,
      donatedAt: status === DonationStatus.SUCCEEDED ? new Date() : null,
      failedAt: status === DonationStatus.FAILED ? new Date() : null,
    },
    create: {
      source: DonationSource.ONLINE,
      userId,
      memberIdSnapshot:
        resolvedRecurring?.memberIdSnapshot ?? checkout?.memberIdSnapshot ?? null,
      checkoutId: checkout?.id ?? null,
      recurringDonationId: resolvedRecurring?.id ?? null,
      categoryId,
      frequency: subscriptionId
        ? DonationFrequency.MONTHLY
        : (checkout?.frequency ?? DonationFrequency.ONE_TIME),
      status,
      amountCents,
      currency,
      donorNameSnapshot: checkout?.donorNameSnapshot ?? null,
      donorEmailSnapshot: checkout?.donorEmailSnapshot ?? null,
      stripeCustomerId: customerId,
      stripePaymentIntentId: paymentIntentId,
      stripeInvoiceId: invoice.id,
      stripeChargeId: chargeId,
      stripeHostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      stripeInvoicePdfUrl: invoice.invoice_pdf ?? null,
      failureCode:
        status === DonationStatus.FAILED
          ? invoice.last_finalization_error?.code ?? "invoice_payment_failed"
          : null,
      livemode: invoice.livemode,
      donatedAt: status === DonationStatus.SUCCEEDED ? new Date() : null,
      failedAt: status === DonationStatus.FAILED ? new Date() : null,
    },
  })

  if (status === DonationStatus.SUCCEEDED) {
    await createDonationSuccessNotification({
      userId: donation.userId,
      donationId: donation.id,
    })
  } else {
    await createDonationFailureNotification({
      userId: donation.userId,
      donationId: donation.id,
    })
  }
}

async function handleSubscription(subscription: Stripe.Subscription) {
  await upsertRecurringDonationFromSubscription(subscription)
}

async function updateDonationRefundStatus(donationId: string) {
  const refunds = await prisma.donationRefund.findMany({
    where: {
      donationId,
      status: DonationRefundStatus.SUCCEEDED,
    },
    select: { amountCents: true },
  })
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    select: { amountCents: true, source: true },
  })

  if (!donation || donation.source !== DonationSource.ONLINE) return

  const refundedAmountCents = refunds.reduce(
    (sum, refund) => sum + refund.amountCents,
    0,
  )

  await prisma.donation.update({
    where: { id: donationId },
    data: {
      refundedAmountCents,
      status:
        refundedAmountCents <= 0
          ? DonationStatus.SUCCEEDED
          : refundedAmountCents >= donation.amountCents
            ? DonationStatus.REFUNDED
            : DonationStatus.PARTIALLY_REFUNDED,
    },
  })
}

async function findDonationByChargeOrPaymentIntent(
  chargeId: string | null,
  paymentIntentId?: string | null,
) {
  if (chargeId) {
    const byCharge = await prisma.donation.findFirst({
      where: { stripeChargeId: chargeId, source: DonationSource.ONLINE },
    })
    if (byCharge) return byCharge
  }

  if (paymentIntentId) {
    return prisma.donation.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
        source: DonationSource.ONLINE,
      },
    })
  }

  return null
}

async function handleRefund(refund: Stripe.Refund) {
  const chargeId = getRefundChargeId(refund)
  const charge =
    chargeId && !refund.payment_intent
      ? await getStripeClient().charges.retrieve(chargeId).catch(() => null)
      : null
  const paymentIntentId =
    typeof refund.payment_intent === "string"
      ? refund.payment_intent
      : charge && typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : null
  const donation = await findDonationByChargeOrPaymentIntent(
    chargeId,
    paymentIntentId,
  )

  if (!donation) return

  await prisma.donationRefund.upsert({
    where: { stripeRefundId: refund.id },
    update: {
      amountCents: refund.amount,
      currency: refund.currency.toLowerCase(),
      status: toRefundStatus(refund.status),
      reason: refund.reason ?? null,
    },
    create: {
      donationId: donation.id,
      stripeRefundId: refund.id,
      amountCents: refund.amount,
      currency: refund.currency.toLowerCase(),
      status: toRefundStatus(refund.status),
      reason: refund.reason ?? null,
    },
  })

  await updateDonationRefundStatus(donation.id)

  await prisma.adminAuditLog.create({
    data: {
      action: "donation.refund_synchronized",
      entityType: "donation",
      entityId: donation.id,
      summary: "Remboursement Stripe synchronise.",
      metadata: {
        stripeRefundId: refund.id,
        status: refund.status ?? "unknown",
      },
    },
  })
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  for (const refund of charge.refunds?.data ?? []) {
    await handleRefund(refund)
  }
}

async function handleDispute(dispute: Stripe.Dispute) {
  const donation = await findDonationByChargeOrPaymentIntent(
    getDisputeChargeId(dispute),
  )

  if (!donation) return

  await prisma.donation.update({
    where: { id: donation.id },
    data: { status: DonationStatus.DISPUTED },
  })

  await prisma.adminAuditLog.create({
    data: {
      action: "donation.dispute_synchronized",
      entityType: "donation",
      entityId: donation.id,
      summary: "Litige Stripe detecte.",
      metadata: {
        stripeDisputeId: dispute.id,
        status: dispute.status,
      },
    },
  })
}

async function dispatchStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session,
      )
      return "PROCESSED"
    case "checkout.session.async_payment_succeeded":
      await handleCheckoutSessionAsyncSucceeded(
        event.data.object as Stripe.Checkout.Session,
      )
      return "PROCESSED"
    case "checkout.session.async_payment_failed":
      await handleCheckoutSessionAsyncFailed(
        event.data.object as Stripe.Checkout.Session,
      )
      return "PROCESSED"
    case "checkout.session.expired":
      await handleCheckoutSessionExpired(
        event.data.object as Stripe.Checkout.Session,
      )
      return "PROCESSED"
    case "invoice.paid":
    case "invoice.payment_succeeded":
      await handleInvoicePayment(
        event.data.object as Stripe.Invoice,
        DonationStatus.SUCCEEDED,
      )
      return "PROCESSED"
    case "invoice.payment_failed":
      await handleInvoicePayment(
        event.data.object as Stripe.Invoice,
        DonationStatus.FAILED,
      )
      return "PROCESSED"
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscription(event.data.object as Stripe.Subscription)
      return "PROCESSED"
    case "charge.refunded":
      await handleChargeRefunded(event.data.object as Stripe.Charge)
      return "PROCESSED"
    case "refund.created":
    case "refund.updated":
      await handleRefund(event.data.object as Stripe.Refund)
      return "PROCESSED"
    case "charge.dispute.created":
    case "charge.dispute.updated":
    case "charge.dispute.closed":
      await handleDispute(event.data.object as Stripe.Dispute)
      return "PROCESSED"
    default:
      return "IGNORED"
  }
}

export async function processStripeWebhookEvent(event: Stripe.Event) {
  const objectId = getObjectId(event)
  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { stripeEventId: event.id },
  })

  if (
    existing &&
    (existing.processingStatus === StripeWebhookProcessingStatus.PROCESSED ||
      existing.processingStatus === StripeWebhookProcessingStatus.IGNORED)
  ) {
    return { status: "duplicate" as const }
  }

  const webhookEvent =
    existing ??
    (await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        stripeObjectId: objectId,
        livemode: event.livemode,
        apiVersion: event.api_version ?? null,
      },
    }))

  await prisma.stripeWebhookEvent.update({
    where: { id: webhookEvent.id },
    data: {
      processingStatus: StripeWebhookProcessingStatus.PROCESSING,
      processingStartedAt: new Date(),
      attemptCount: { increment: 1 },
      lastErrorCode: null,
    },
  })

  try {
    const result = await dispatchStripeEvent(event)
    const processingStatus =
      result === "IGNORED"
        ? StripeWebhookProcessingStatus.IGNORED
        : StripeWebhookProcessingStatus.PROCESSED

    await prisma.stripeWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        processingStatus,
        processedAt: new Date(),
        failedAt: null,
      },
    })

    return { status: result.toLowerCase() as "processed" | "ignored" }
  } catch (error) {
    const safeCode =
      error instanceof Error ? error.message.slice(0, 120) : "UNKNOWN_ERROR"

    await prisma.stripeWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        processingStatus: StripeWebhookProcessingStatus.FAILED,
        lastErrorCode: safeCode,
        failedAt: new Date(),
      },
    })

    throw error
  }
}
