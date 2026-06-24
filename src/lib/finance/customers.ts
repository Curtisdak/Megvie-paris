import "server-only"

import { prisma } from "@/lib/prisma"
import { getStripeClient } from "@/lib/stripe/server"

type StripeCustomerUser = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  stripeCustomerId: string | null
  profile: { memberId: string | null; displayName: string | null } | null
}

export function getDonationDisplayName(user: {
  email: string
  firstName: string | null
  lastName: string | null
  profile?: { displayName?: string | null } | null
}) {
  return (
    user.profile?.displayName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email
  )
}

export async function getOrCreateStripeCustomer(user: StripeCustomerUser) {
  if (user.stripeCustomerId) return user.stripeCustomerId

  const stripe = getStripeClient()
  const customer = await stripe.customers.create(
    {
      email: user.email,
      name: getDonationDisplayName(user),
      metadata: {
        applicationUserId: user.id,
        memberId: user.profile?.memberId ?? "",
      },
    },
    {
      idempotencyKey: `megvie-customer:${user.id}`,
    },
  )

  await prisma.appUser.updateMany({
    where: { id: user.id, stripeCustomerId: null },
    data: { stripeCustomerId: customer.id },
  })

  const refreshed = await prisma.appUser.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true },
  })

  return refreshed?.stripeCustomerId ?? customer.id
}
