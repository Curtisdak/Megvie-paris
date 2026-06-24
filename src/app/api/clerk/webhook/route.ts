import { NextRequest, NextResponse } from "next/server"
import { verifyWebhook } from "@clerk/nextjs/webhooks"
import { MembershipStatus } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

type ClerkEmailAddress = {
  id: string
  email_address: string
}

type ClerkUserPayload = {
  id: string
  first_name?: string | null
  last_name?: string | null
  image_url?: string | null
  primary_email_address_id?: string | null
  email_addresses?: ClerkEmailAddress[]
}

function getPrimaryEmail(data: ClerkUserPayload) {
  const primary = data.email_addresses?.find(
    (email) => email.id === data.primary_email_address_id,
  )

  return (
    primary?.email_address ??
    data.email_addresses?.[0]?.email_address ??
    null
  )?.toLowerCase()
}

async function upsertUser(data: ClerkUserPayload) {
  const email = getPrimaryEmail(data)

  if (!email) {
    return
  }

  await prisma.appUser.upsert({
    where: { clerkUserId: data.id },
    update: {
      email,
      firstName: data.first_name ?? null,
      lastName: data.last_name ?? null,
      imageUrl: data.image_url ?? null,
      archivedAt: null,
    },
    create: {
      clerkUserId: data.id,
      email,
      firstName: data.first_name ?? null,
      lastName: data.last_name ?? null,
      imageUrl: data.image_url ?? null,
      profile: {
        create: {
          displayName: [data.first_name, data.last_name]
            .filter(Boolean)
            .join(" ") || null,
          avatarUrl: data.image_url ?? null,
        },
      },
      notificationPreference: {
        create: {},
      },
    },
  })
}

export async function POST(request: NextRequest) {
  const event = await verifyWebhook(request)

  if (event.type === "user.created" || event.type === "user.updated") {
    await upsertUser(event.data as ClerkUserPayload)
  }

  if (event.type === "user.deleted") {
    const data = event.data as { id?: string | null }

    if (data.id) {
      await prisma.appUser.updateMany({
        where: { clerkUserId: data.id },
        data: {
          archivedAt: new Date(),
          membershipStatus: MembershipStatus.ARCHIVED,
        },
      })
    }
  }

  return NextResponse.json({ received: true })
}
