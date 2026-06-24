import "server-only"

import Stripe from "stripe"
import type { NextRequest } from "next/server"

export const STRIPE_API_VERSION: Stripe.LatestApiVersion =
  "2025-10-29.clover"

let stripeClient: Stripe | null = null

export function getStripeSecretKey() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim()

  if (!stripeSecretKey) {
    throw new Error(
      "Stripe est mal configure. Ajoutez STRIPE_SECRET_KEY cote serveur.",
    )
  }

  if (stripeSecretKey.startsWith("pk_")) {
    throw new Error(
      "STRIPE_SECRET_KEY doit etre une cle secrete Stripe sk_, pas une cle publishable pk_.",
    )
  }

  if (
    !stripeSecretKey.startsWith("sk_test_") &&
    !stripeSecretKey.startsWith("sk_live_")
  ) {
    throw new Error("STRIPE_SECRET_KEY doit commencer par sk_test_ ou sk_live_.")
  }

  return stripeSecretKey
}

export function getStripePublishableKey() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()

  if (!publishableKey) return null

  if (
    !publishableKey.startsWith("pk_test_") &&
    !publishableKey.startsWith("pk_live_")
  ) {
    throw new Error(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY doit commencer par pk_test_ ou pk_live_.",
    )
  }

  return publishableKey
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()

  if (!webhookSecret || !webhookSecret.startsWith("whsec_")) {
    throw new Error("STRIPE_WEBHOOK_SECRET doit commencer par whsec_.")
  }

  return webhookSecret
}

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      apiVersion: STRIPE_API_VERSION,
    })
  }

  return stripeClient
}

export function isStripeLiveModeConfigured() {
  return getStripeSecretKey().startsWith("sk_live_")
}

export function getAppBaseUrl(request?: NextRequest) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    request?.nextUrl.origin

  if (!configured) {
    throw new Error("NEXT_PUBLIC_SITE_URL est manquant.")
  }

  return configured.replace(/\/$/, "")
}

type StripeObjectReference = string | { id?: string | null } | null | undefined

export function getStripeReferenceId(reference: StripeObjectReference) {
  if (typeof reference === "string") return reference
  if (reference && typeof reference.id === "string") return reference.id
  return null
}

export function getSessionCustomerId(session: Stripe.Checkout.Session) {
  return getStripeReferenceId(session.customer)
}

export function getSessionPaymentIntentId(session: Stripe.Checkout.Session) {
  return getStripeReferenceId(session.payment_intent)
}

export function getSessionSubscriptionId(session: Stripe.Checkout.Session) {
  return getStripeReferenceId(session.subscription)
}

export function getInvoiceCustomerId(invoice: Stripe.Invoice) {
  return getStripeReferenceId(invoice.customer)
}

export function getInvoiceChargeId(invoice: Stripe.Invoice) {
  const compatibleInvoice = invoice as Stripe.Invoice & {
    charge?: StripeObjectReference
  }

  return getStripeReferenceId(compatibleInvoice.charge)
}

export function getInvoicePaymentIntentId(invoice: Stripe.Invoice) {
  const compatibleInvoice = invoice as Stripe.Invoice & {
    payment_intent?: StripeObjectReference
  }

  return getStripeReferenceId(compatibleInvoice.payment_intent)
}

export function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const compatibleInvoice = invoice as Stripe.Invoice & {
    subscription?: StripeObjectReference
    parent?: {
      subscription_details?: {
        subscription?: StripeObjectReference
      } | null
    } | null
  }

  return (
    getStripeReferenceId(compatibleInvoice.subscription) ??
    getStripeReferenceId(
      compatibleInvoice.parent?.subscription_details?.subscription,
    )
  )
}

export function getSubscriptionCustomerId(subscription: Stripe.Subscription) {
  return getStripeReferenceId(subscription.customer)
}

export function getSubscriptionPriceAndProductIds(
  subscription: Stripe.Subscription,
) {
  const item = subscription.items.data[0]
  const price = item?.price ?? null

  return {
    priceId: price?.id ?? null,
    productId: getStripeReferenceId(price?.product),
  }
}

export function getChargeReceiptUrl(charge: Stripe.Charge) {
  return charge.receipt_url ?? null
}

export function getRefundChargeId(refund: Stripe.Refund) {
  return getStripeReferenceId(refund.charge)
}

export function getDisputeChargeId(dispute: Stripe.Dispute) {
  return getStripeReferenceId(dispute.charge)
}
