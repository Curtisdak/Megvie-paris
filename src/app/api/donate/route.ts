import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"

const MAX_DONATION_EUR = 5000
const MIN_DONATION_EUR = 5

type StripeConfig =
  | { stripe: Stripe; error?: never }
  | { stripe?: never; error: string }

function getStripeConfig(): StripeConfig {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim()

  if (!stripeSecretKey) {
    return {
      error:
        "Stripe est mal configure. Ajoutez STRIPE_SECRET_KEY dans les variables d'environnement.",
    }
  }

  if (stripeSecretKey.startsWith("pk_")) {
    return {
      error:
        "STRIPE_SECRET_KEY doit etre une cle serveur Stripe qui commence par sk_, pas une cle publishable pk_.",
    }
  }

  if (!stripeSecretKey.startsWith("sk_")) {
    return {
      error: "STRIPE_SECRET_KEY doit contenir une cle serveur Stripe valide.",
    }
  }

  return {
    stripe: new Stripe(stripeSecretKey, {
      apiVersion: "2025-10-29.clover",
    }),
  }
}

function getAppUrl(request: NextRequest) {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const fallbackAppUrl = request.nextUrl.origin

  return (configuredAppUrl || fallbackAppUrl).replace(/\/$/, "")
}

function normalizeDonationAmount(amount: unknown) {
  const numericAmount = Number(amount)

  if (!Number.isFinite(numericAmount)) {
    return null
  }

  const roundedAmount = Math.round(numericAmount)

  if (
    roundedAmount < MIN_DONATION_EUR ||
    roundedAmount > MAX_DONATION_EUR
  ) {
    return null
  }

  return roundedAmount
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id")

  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json(
      { error: "Session Stripe invalide." },
      { status: 400 },
    )
  }

  const stripeConfig = getStripeConfig()

  if ("error" in stripeConfig) {
    return NextResponse.json({ error: stripeConfig.error }, { status: 500 })
  }

  try {
    const session = await stripeConfig.stripe.checkout.sessions.retrieve(
      sessionId,
    )

    return NextResponse.json({
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
    })
  } catch (error) {
    console.error("Stripe session retrieval error", error)
    return NextResponse.json(
      { error: "Impossible de verifier la session Stripe." },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const stripeConfig = getStripeConfig()

  if ("error" in stripeConfig) {
    return NextResponse.json({ error: stripeConfig.error }, { status: 500 })
  }

  let body: { amount?: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "La requete de don est invalide." },
      { status: 400 },
    )
  }

  const donationAmount = normalizeDonationAmount(body.amount)

  if (!donationAmount) {
    return NextResponse.json(
      {
        error: `Le montant doit etre entre ${MIN_DONATION_EUR} EUR et ${MAX_DONATION_EUR} EUR.`,
      },
      { status: 400 },
    )
  }

  try {
    const appUrl = getAppUrl(request)
    const session = await stripeConfig.stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      submit_type: "donate",
      locale: "fr",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Don MegVie Paris",
            },
            unit_amount: donationAmount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/donate?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/donate?status=cancel`,
      metadata: {
        donationAmount: donationAmount.toString(),
      },
    })

    if (!session.url) {
      return NextResponse.json(
        { error: "URL de paiement Stripe introuvable." },
        { status: 500 },
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe session error", error)
    return NextResponse.json(
      { error: "Impossible de creer la session de paiement." },
      { status: 500 },
    )
  }
}
