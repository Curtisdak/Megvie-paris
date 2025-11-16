import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"

const MAX_DONATION_EUR = 5000
const MIN_DONATION_EUR = 5

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL

const stripe =
  stripeSecretKey &&
  new Stripe(stripeSecretKey, {
    apiVersion: "2024-06-20",
  })

export async function POST(request: NextRequest) {
  if (!stripe || !stripeSecretKey || !appUrl) {
    return NextResponse.json(
      { error: "Stripe est mal configure. Merci d'ajouter les cles requises." },
      { status: 500 },
    )
  }

  try {
    const { amount } = await request.json()
    const numericAmount = Number(amount)

    if (Number.isNaN(numericAmount)) {
      return NextResponse.json(
        { error: "Le montant fourni est invalide." },
        { status: 400 },
      )
    }

    const safeAmount = Math.min(
      MAX_DONATION_EUR,
      Math.max(MIN_DONATION_EUR, numericAmount),
    )

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Don MegVie Paris",
            },
            unit_amount: Math.round(safeAmount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/?status=success&amount=${safeAmount}`,
      cancel_url: `${appUrl}/?status=cancel`,
      metadata: {
        donationAmount: safeAmount.toString(),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe session error", error)
    return NextResponse.json(
      { error: "Impossible de creer la session de paiement." },
      { status: 500 },
    )
  }
}
