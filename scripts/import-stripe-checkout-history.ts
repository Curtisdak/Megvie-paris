import { existsSync } from "node:fs"
import { config } from "dotenv"
import Stripe from "stripe"
import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient } from "../src/generated/prisma/client"
import {
  DonationCheckoutStatus,
  DonationFrequency,
  DonationStatus,
} from "../src/generated/prisma/enums"
import WebSocket from "ws"

for (const path of [".env.local", ".env"]) {
  if (existsSync(path)) {
    config({ path, override: false, quiet: true })
  }
}

neonConfig.webSocketConstructor = WebSocket

const defaultDonationCategories = [
  {
    id: "doncat_dime",
    slug: "dime",
    label: "Dîme",
    description: "Soutenir fidelement la vie et les missions de l'eglise.",
    sortOrder: 10,
  },
  {
    id: "doncat_offrande",
    slug: "offrande",
    label: "Offrande",
    description: "Participer librement aux besoins et projets MegVie Paris.",
    sortOrder: 20,
  },
  {
    id: "doncat_remerciement",
    slug: "remerciement",
    label: "Remerciement",
    description: "Exprimer une reconnaissance particuliere.",
    sortOrder: 30,
  },
  {
    id: "doncat_rachat",
    slug: "rachat",
    label: "Rachat",
    description: "Contribuer a une intention ou un engagement personnel.",
    sortOrder: 40,
  },
  {
    id: "doncat_autre",
    slug: "autre",
    label: "Autre",
    description: "Autre forme de soutien.",
    sortOrder: 50,
  },
] as const

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing ${name}.`)
  }

  return value
}

function getStripeSecretKey() {
  const key = requiredEnv("STRIPE_SECRET_KEY")

  if (key.startsWith("pk_")) {
    throw new Error("STRIPE_SECRET_KEY must be a secret sk_ key, not pk_.")
  }

  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) {
    throw new Error("STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.")
  }

  return key
}

type StripeObjectReference = string | { id?: string | null } | null | undefined

function referenceId(reference: StripeObjectReference) {
  if (typeof reference === "string") return reference
  if (reference && typeof reference.id === "string") return reference.id
  return null
}

function cleanText(value: string | null | undefined, maxLength = 180) {
  return value?.trim().replace(/\s+/g, " ").slice(0, maxLength) || null
}

function getPaymentIntent(session: Stripe.Checkout.Session) {
  const paymentIntent = session.payment_intent

  if (paymentIntent && typeof paymentIntent === "object") {
    return paymentIntent as Stripe.PaymentIntent
  }

  return null
}

function getLatestCharge(paymentIntent: Stripe.PaymentIntent | null) {
  const latestCharge = paymentIntent?.latest_charge

  if (latestCharge && typeof latestCharge === "object") {
    return latestCharge as Stripe.Charge
  }

  return null
}

async function ensureDefaultDonationCategories(prisma: PrismaClient) {
  await Promise.all(
    defaultDonationCategories.map((category) =>
      prisma.donationCategory.upsert({
        where: { slug: category.slug },
        update: {
          label: category.label,
          description: category.description,
          sortOrder: category.sortOrder,
        },
        create: category,
      }),
    ),
  )
}

async function resolveCategoryId(
  prisma: PrismaClient,
  metadata: Stripe.Metadata | null,
) {
  const metadataCategory =
    metadata?.categoryId?.trim() || metadata?.categorySlug?.trim()

  if (metadataCategory) {
    const category = await prisma.donationCategory.findFirst({
      where: {
        isActive: true,
        OR: [{ id: metadataCategory }, { slug: metadataCategory }],
      },
      select: { id: true },
    })

    if (category) return category.id
  }

  const fallback = await prisma.donationCategory.findUnique({
    where: { slug: "autre" },
    select: { id: true },
  })

  if (!fallback) {
    throw new Error("Default donation category 'autre' is missing.")
  }

  return fallback.id
}

async function importSession(
  prisma: PrismaClient,
  session: Stripe.Checkout.Session,
) {
  if (session.mode !== "payment") {
    return "skipped_non_payment" as const
  }

  if (session.payment_status !== "paid") {
    return "skipped_unpaid" as const
  }

  const amountCents = session.amount_total
  const currency = session.currency?.toLowerCase()
  const paymentIntentId = referenceId(session.payment_intent)

  if (!amountCents || amountCents <= 0 || !currency || !paymentIntentId) {
    return "skipped_incomplete" as const
  }

  const existingDonation = await prisma.donation.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { id: true },
  })

  if (existingDonation) {
    return "already_imported" as const
  }

  const paymentIntent = getPaymentIntent(session)
  const latestCharge = getLatestCharge(paymentIntent)
  const stripeChargeId = latestCharge?.id ?? null
  const stripeReceiptUrl = latestCharge?.receipt_url ?? null
  const donorName = cleanText(
    session.customer_details?.name ??
      session.metadata?.donorName ??
      session.metadata?.donor_name,
  )
  const donorEmail = cleanText(
    session.customer_details?.email ??
      session.customer_email ??
      session.metadata?.donorEmail ??
      session.metadata?.donor_email,
    254,
  )?.toLowerCase()
  const stripeCustomerId = referenceId(session.customer)
  const categoryId = await resolveCategoryId(prisma, session.metadata)
  const donatedAt = new Date(session.created * 1000)

  await prisma.$transaction(async (tx) => {
    const checkout = await tx.donationCheckout.upsert({
      where: { stripeCheckoutSessionId: session.id },
      update: {
        categoryId,
        frequency: DonationFrequency.ONE_TIME,
        amountCents,
        currency,
        donorNameSnapshot: donorName,
        donorEmailSnapshot: donorEmail,
        status: DonationCheckoutStatus.COMPLETED,
        stripeCustomerId,
        stripePaymentIntentId: paymentIntentId,
        livemode: session.livemode,
        expiresAt: session.expires_at
          ? new Date(session.expires_at * 1000)
          : null,
        completedAt: donatedAt,
      },
      create: {
        categoryId,
        frequency: DonationFrequency.ONE_TIME,
        amountCents,
        currency,
        donorNameSnapshot: donorName,
        donorEmailSnapshot: donorEmail,
        status: DonationCheckoutStatus.COMPLETED,
        stripeCheckoutSessionId: session.id,
        stripeCustomerId,
        stripePaymentIntentId: paymentIntentId,
        livemode: session.livemode,
        expiresAt: session.expires_at
          ? new Date(session.expires_at * 1000)
          : null,
        completedAt: donatedAt,
      },
    })

    await tx.donation.create({
      data: {
        checkoutId: checkout.id,
        categoryId,
        frequency: DonationFrequency.ONE_TIME,
        status: DonationStatus.SUCCEEDED,
        amountCents,
        currency,
        donorNameSnapshot: donorName,
        donorEmailSnapshot: donorEmail,
        stripeCustomerId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId,
        stripeReceiptUrl,
        livemode: session.livemode,
        donatedAt,
      },
    })
  })

  return "imported" as const
}

async function main() {
  const stripe = new Stripe(getStripeSecretKey(), {
    apiVersion: "2025-10-29.clover",
  })
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: requiredEnv("DATABASE_URL") }),
  })
  const summary = {
    inspected: 0,
    imported: 0,
    alreadyImported: 0,
    skippedNonPayment: 0,
    skippedUnpaid: 0,
    skippedIncomplete: 0,
  }

  try {
    await ensureDefaultDonationCategories(prisma)

    for await (const session of stripe.checkout.sessions.list({
      limit: 100,
      status: "complete",
      expand: ["data.payment_intent", "data.payment_intent.latest_charge"],
    })) {
      summary.inspected += 1
      const result = await importSession(prisma, session)

      if (result === "imported") summary.imported += 1
      if (result === "already_imported") summary.alreadyImported += 1
      if (result === "skipped_non_payment") summary.skippedNonPayment += 1
      if (result === "skipped_unpaid") summary.skippedUnpaid += 1
      if (result === "skipped_incomplete") summary.skippedIncomplete += 1
    }

    if (summary.imported > 0) {
      await prisma.adminAuditLog.create({
        data: {
          action: "donation.historical_import",
          entityType: "donation",
          summary: `${summary.imported} paiement(s) Stripe Checkout importe(s).`,
          metadata: summary,
        },
      })
    }

    console.log(JSON.stringify(summary, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Import failed.")
  process.exitCode = 1
})
