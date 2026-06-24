import { NextRequest, NextResponse } from "next/server"
import {
  getStripeClient,
  getStripeWebhookSecret,
} from "@/lib/stripe/server"
import { processStripeWebhookEvent } from "@/lib/finance/webhooks"

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "Signature Stripe manquante." },
      { status: 400 },
    )
  }

  let event

  try {
    const payload = await request.text()
    event = getStripeClient().webhooks.constructEvent(
      payload,
      signature,
      getStripeWebhookSecret(),
    )
  } catch {
    return NextResponse.json(
      { error: "Signature Stripe invalide." },
      { status: 400 },
    )
  }

  try {
    const result = await processStripeWebhookEvent(event)
    return NextResponse.json({ received: true, status: result.status })
  } catch {
    return NextResponse.json(
      { error: "Traitement Stripe webhook echoue." },
      { status: 500 },
    )
  }
}
