import { NextRequest, NextResponse } from "next/server"
import { MembershipStatus } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { requireCurrentAppUser } from "@/lib/auth/clerk-user"
import { getAppBaseUrl, getStripeClient } from "@/lib/stripe/server"

export async function POST(request: NextRequest) {
  const user = await requireCurrentAppUser("/espace-membre/dons")

  if (
    user.membershipStatus !== MembershipStatus.ACTIVE ||
    !user.stripeCustomerId
  ) {
    return NextResponse.json(
      { error: "Aucun don mensuel Stripe a gerer pour ce compte." },
      { status: 403 },
    )
  }

  const stripe = getStripeClient()
  const appUrl = getAppBaseUrl(request)
  const configuration =
    process.env.STRIPE_CUSTOMER_PORTAL_CONFIGURATION_ID?.trim() || undefined
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/espace-membre/dons`,
    configuration,
  })

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: user.id,
      actorMemberId: user.profile?.memberId ?? null,
      action: "donation.customer_portal_opened",
      entityType: "app_user",
      entityId: user.id,
      summary: "Portail Stripe Customer ouvert.",
    },
  })

  return NextResponse.json({ url: session.url })
}
