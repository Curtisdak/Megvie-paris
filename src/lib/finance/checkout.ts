import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"
import type { NextRequest } from "next/server"
import {
  DonationCheckoutStatus,
  DonationFrequency,
  MembershipStatus,
} from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/auth/rate-limit"
import {
  DONATION_CURRENCY,
  assertSupportedCurrency,
  eurosToCents,
  formatCurrencyFromCents,
  normalizeAmountCents,
  normalizeCurrency,
} from "@/lib/finance/config"
import { getActiveDonationCategory } from "@/lib/finance/categories"
import {
  getDonationDisplayName,
  getOrCreateStripeCustomer,
} from "@/lib/finance/customers"
import {
  getAppBaseUrl,
  getSessionCustomerId,
  getSessionPaymentIntentId,
  getSessionSubscriptionId,
  getStripeClient,
} from "@/lib/stripe/server"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type CheckoutInput = {
  amount?: unknown
  amountCents?: unknown
  currency?: unknown
  categoryId?: unknown
  categorySlug?: unknown
  frequency?: unknown
  donorName?: unknown
  donorEmail?: unknown
}

function cleanText(value: unknown, maxLength = 180) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, maxLength)
    : ""
}

function cleanEmail(value: unknown) {
  return cleanText(value, 254).toLowerCase()
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

async function getOptionalDonationUser() {
  const authState = await auth()

  if (!authState.userId) return null

  let user = await prisma.appUser.findUnique({
    where: { clerkUserId: authState.userId },
    include: { profile: true },
  })

  if (user) return user

  const clerkUser = await currentUser()
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    null

  if (!clerkUser || !email) return null

  user = await prisma.appUser.upsert({
    where: { clerkUserId: clerkUser.id },
    update: {
      email: email.toLowerCase(),
      firstName: clerkUser.firstName ?? null,
      lastName: clerkUser.lastName ?? null,
      imageUrl: clerkUser.imageUrl ?? null,
    },
    create: {
      clerkUserId: clerkUser.id,
      email: email.toLowerCase(),
      firstName: clerkUser.firstName ?? null,
      lastName: clerkUser.lastName ?? null,
      imageUrl: clerkUser.imageUrl ?? null,
      profile: {
        create: {
          displayName: [clerkUser.firstName, clerkUser.lastName]
            .filter(Boolean)
            .join(" ") || null,
          avatarUrl: clerkUser.imageUrl ?? null,
        },
      },
      notificationPreference: { create: {} },
    },
    include: { profile: true },
  })

  return user
}

function parseFrequency(value: unknown) {
  const frequency = cleanText(value, 24).toUpperCase()
  return frequency === DonationFrequency.MONTHLY
    ? DonationFrequency.MONTHLY
    : DonationFrequency.ONE_TIME
}

function parseAmount(input: CheckoutInput) {
  if (input.amountCents !== undefined) {
    return normalizeAmountCents(Number(input.amountCents))
  }

  return eurosToCents(input.amount)
}

export async function createDonationCheckout(input: CheckoutInput, request: NextRequest) {
  const ip = getClientIp(request)
  const rateLimit = checkRateLimit(`donation-checkout:${ip}`, {
    limit: 12,
    windowMs: 10 * 60 * 1000,
  })

  if (!rateLimit.ok) {
    return {
      ok: false as const,
      status: 429,
      error: `Trop de tentatives. Reessayez dans ${rateLimit.retryAfterSeconds} secondes.`,
    }
  }

  const amountCents = parseAmount(input)

  if (!amountCents) {
    return {
      ok: false as const,
      status: 400,
      error: "Le montant du don est invalide.",
    }
  }

  const currency = normalizeCurrency(input.currency)

  try {
    assertSupportedCurrency(currency)
  } catch (error) {
    return {
      ok: false as const,
      status: 400,
      error: error instanceof Error ? error.message : "Devise invalide.",
    }
  }

  const categoryLookup =
    cleanText(input.categoryId, 80) || cleanText(input.categorySlug, 80) || "autre"
  const category = await getActiveDonationCategory(categoryLookup)

  if (!category) {
    return {
      ok: false as const,
      status: 400,
      error: "Cette categorie de don n'est pas disponible.",
    }
  }

  const frequency = parseFrequency(input.frequency)
  const user = await getOptionalDonationUser()

  if (frequency === DonationFrequency.MONTHLY) {
    if (!user) {
      return {
        ok: false as const,
        status: 401,
        error: "Les dons mensuels necessitent un compte membre connecte.",
      }
    }

    if (user.membershipStatus !== MembershipStatus.ACTIVE) {
      return {
        ok: false as const,
        status: 403,
        error: "Les dons mensuels sont reserves aux membres actifs.",
      }
    }
  }

  const donorName =
    user ? getDonationDisplayName(user) : cleanText(input.donorName, 160) || null
  const donorEmail = user ? user.email : cleanEmail(input.donorEmail) || null

  if (!user && (!donorName || !donorEmail)) {
    return {
      ok: false as const,
      status: 400,
      error: "Votre nom et votre email sont necessaires pour un don invite.",
    }
  }

  if (!user && donorEmail && !emailPattern.test(donorEmail)) {
    return {
      ok: false as const,
      status: 400,
      error: "Adresse email invalide.",
    }
  }

  const memberIdSnapshot = user?.profile?.memberId ?? null
  const stripeCustomerId = user ? await getOrCreateStripeCustomer(user) : null
  const checkout = await prisma.donationCheckout.create({
    data: {
      userId: user?.id ?? null,
      memberIdSnapshot,
      categoryId: category.id,
      frequency,
      amountCents,
      currency,
      donorNameSnapshot: donorName,
      donorEmailSnapshot: donorEmail,
      status: DonationCheckoutStatus.CREATED,
      stripeCustomerId,
    },
  })
  const stripe = getStripeClient()
  const appUrl = getAppBaseUrl(request)
  const metadata = {
    donationCheckoutId: checkout.id,
    applicationUserId: user?.id ?? "",
    memberId: memberIdSnapshot ?? "",
    categoryId: category.id,
    categorySlug: category.slug,
    frequency,
  }
  const idempotencyKey = `checkout:${checkout.id}`
  const productName =
    frequency === DonationFrequency.MONTHLY
      ? `Don mensuel MegVie Paris - ${category.label}`
      : `Don MegVie Paris - ${category.label}`

  const session = await stripe.checkout.sessions.create(
    {
      mode: frequency === DonationFrequency.MONTHLY ? "subscription" : "payment",
      payment_method_types: ["card"],
      locale: "fr",
      submit_type: frequency === DonationFrequency.ONE_TIME ? "donate" : undefined,
      customer: stripeCustomerId ?? undefined,
      customer_creation:
        !stripeCustomerId && frequency === DonationFrequency.ONE_TIME
          ? "always"
          : undefined,
      customer_email: !stripeCustomerId && donorEmail ? donorEmail : undefined,
      client_reference_id: checkout.id,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: productName,
              metadata,
            },
            unit_amount: amountCents,
            recurring:
              frequency === DonationFrequency.MONTHLY
                ? { interval: "month" }
                : undefined,
          },
          quantity: 1,
        },
      ],
      payment_intent_data:
        frequency === DonationFrequency.ONE_TIME
          ? {
              metadata,
              receipt_email:
                process.env.STRIPE_RECEIPT_EMAILS_ENABLED === "true" &&
                donorEmail
                  ? donorEmail
                  : undefined,
            }
          : undefined,
      subscription_data:
        frequency === DonationFrequency.MONTHLY
          ? {
              metadata,
            }
          : undefined,
      metadata,
      success_url: `${appUrl}/donate?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/donate?status=cancel`,
    },
    { idempotencyKey },
  )

  await prisma.donationCheckout.update({
    where: { id: checkout.id },
    data: {
      status: DonationCheckoutStatus.OPEN,
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: getSessionCustomerId(session) ?? stripeCustomerId,
      stripeSubscriptionId: getSessionSubscriptionId(session),
      stripePaymentIntentId: getSessionPaymentIntentId(session),
      livemode: session.livemode,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : null,
    },
  })

  if (!session.url) {
    return {
      ok: false as const,
      status: 500,
      error: "URL de paiement Stripe introuvable.",
    }
  }

  return {
    ok: true as const,
    url: session.url,
    checkoutId: checkout.id,
    amountLabel: formatCurrencyFromCents(amountCents, currency),
  }
}

export async function getDonationCheckoutSessionStatus(sessionId: string) {
  if (!sessionId.startsWith("cs_")) {
    return null
  }

  const [checkout, session] = await Promise.all([
    prisma.donationCheckout.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        donations: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            amountCents: true,
            currency: true,
            donatedAt: true,
            failedAt: true,
          },
        },
      },
    }),
    getStripeClient().checkout.sessions.retrieve(sessionId).catch(() => null),
  ])

  return {
    status: session?.status ?? checkout?.status ?? null,
    paymentStatus: session?.payment_status ?? null,
    amountTotal: session?.amount_total ?? checkout?.amountCents ?? null,
    currency: session?.currency ?? checkout?.currency ?? DONATION_CURRENCY,
    ledgerStatus: checkout?.donations[0]?.status ?? null,
  }
}
