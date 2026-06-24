import "dotenv/config"

import Stripe from "stripe"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim()

if (!stripeSecretKey) {
  console.error("STRIPE_SECRET_KEY is missing.")
  process.exit(1)
}

if (stripeSecretKey.startsWith("sk_live_")) {
  console.error("Refusing to run Stripe smoke test with a live secret key.")
  process.exit(1)
}

if (!stripeSecretKey.startsWith("sk_test_")) {
  console.error("Stripe smoke test requires a test-mode sk_test_ secret key.")
  process.exit(1)
}

const appUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "http://localhost:3000"

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
})

try {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "fr",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "MegVie Paris Stripe smoke test",
          },
          unit_amount: 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      smokeTest: "true",
    },
    success_url: `${appUrl.replace(/\/$/, "")}/donate?smoke=success`,
    cancel_url: `${appUrl.replace(/\/$/, "")}/donate?smoke=cancel`,
  })

  if (session.status === "open") {
    await stripe.checkout.sessions.expire(session.id)
  }

  console.log("Stripe smoke test created and expired a test Checkout Session.")
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Stripe smoke test failed.",
  )
  process.exit(1)
}
