import "dotenv/config"

import { createClerkClient } from "@clerk/backend"
import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient } from "../src/generated/prisma/client"
import { ChurchRole, MembershipStatus } from "../src/generated/prisma/enums"
import WebSocket from "ws"

neonConfig.webSocketConstructor = WebSocket

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing ${name}.`)
  }

  return value
}

function formatMemberId(memberNumber: number) {
  return `Mv${String(memberNumber).padStart(5, "0")}P`
}

function getCreatorUsername(email: string) {
  return (
    process.env.CREATOR_USERNAME?.trim() ||
    email
      .split("@")[0]
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 32) ||
    "creator"
  )
}

function getClerkErrorDetails(error: unknown) {
  if (typeof error !== "object" || error === null) return null

  const candidate = error as {
    status?: unknown
    message?: unknown
    errors?: unknown
  }

  if (!Array.isArray(candidate.errors)) return null

  return {
    status: typeof candidate.status === "number" ? candidate.status : "unknown",
    message:
      typeof candidate.message === "string"
        ? candidate.message
        : "Clerk API request failed.",
    errors: candidate.errors as Array<{
      code?: string
      message?: string
      longMessage?: string
      meta?: Record<string, unknown>
    }>,
  }
}

async function findOrCreateCreatorInClerk(email: string) {
  const clerk = createClerkClient({
    secretKey: requiredEnv("CLERK_SECRET_KEY"),
  })
  const userList = await clerk.users.getUserList({
    emailAddress: [email],
    limit: 2,
  })

  if (userList.data.length > 1) {
    throw new Error("Multiple Clerk users matched CREATOR_EMAIL.")
  }

  if (userList.data[0]) {
    return userList.data[0]
  }

  const password = process.env.CREATOR_PASSWORD?.trim()
  const phoneNumber = process.env.CREATOR_PHONE_NUMBER?.trim()

  if (!password) {
    throw new Error(
      "Creator Clerk user not found. Create it in Clerk or set CREATOR_PASSWORD for one-time bootstrap.",
    )
  }

  if (!phoneNumber) {
    throw new Error(
      "Creator Clerk user not found, and this Clerk instance requires a phone number. Create the user manually in Clerk, or add CREATOR_PHONE_NUMBER in E.164 format such as +33123456789 and rerun.",
    )
  }

  return clerk.users.createUser({
    emailAddress: [email],
    phoneNumber: [phoneNumber],
    username: getCreatorUsername(email),
    password,
    skipLegalChecks: true,
  })
}

async function main() {
  const email = requiredEnv("CREATOR_EMAIL").toLowerCase()
  const databaseUrl = requiredEnv("DATABASE_URL")
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl }),
  })

  try {
    const clerkUser = await findOrCreateCreatorInClerk(email)

    await prisma.$transaction(async (tx) => {
      const appUser = await tx.appUser.upsert({
        where: { clerkUserId: clerkUser.id },
        update: {
          email,
          firstName: clerkUser.firstName ?? null,
          lastName: clerkUser.lastName ?? null,
          imageUrl: clerkUser.imageUrl ?? null,
          role: ChurchRole.CREATOR,
          membershipStatus: MembershipStatus.ACTIVE,
          onboardingComplete: true,
          archivedAt: null,
        },
        create: {
          clerkUserId: clerkUser.id,
          email,
          firstName: clerkUser.firstName ?? null,
          lastName: clerkUser.lastName ?? null,
          imageUrl: clerkUser.imageUrl ?? null,
          role: ChurchRole.CREATOR,
          membershipStatus: MembershipStatus.ACTIVE,
          onboardingComplete: true,
        },
        include: { profile: true },
      })

      let memberNumber = appUser.profile?.memberNumber ?? null
      let memberId = appUser.profile?.memberId ?? null

      if (!memberNumber || !memberId) {
        const rows = await tx.$queryRaw<Array<{ nextval: number | bigint }>>`
          SELECT nextval('member_number_seq') AS nextval
        `
        memberNumber = Number(rows[0]?.nextval)

        if (!memberNumber || memberNumber > 99999) {
          throw new Error("Member ID range exhausted.")
        }

        memberId = formatMemberId(memberNumber)
      }

      await tx.memberProfile.upsert({
        where: { userId: appUser.id },
        update: {
          memberNumber,
          memberId,
          displayName: appUser.profile?.displayName ?? "Creator MegVie",
          avatarUrl: clerkUser.imageUrl ?? appUser.profile?.avatarUrl,
          joinedAt: appUser.profile?.joinedAt ?? new Date(),
          approvedAt: appUser.profile?.approvedAt ?? new Date(),
          approvedById: appUser.id,
        },
        create: {
          userId: appUser.id,
          memberNumber,
          memberId,
          displayName: "Creator MegVie",
          avatarUrl: clerkUser.imageUrl ?? null,
          joinedAt: new Date(),
          approvedAt: new Date(),
          approvedById: appUser.id,
        },
      })

      await tx.notificationPreference.upsert({
        where: { userId: appUser.id },
        update: { timezone: "Europe/Paris" },
        create: { userId: appUser.id, timezone: "Europe/Paris" },
      })

      await tx.adminAuditLog.create({
        data: {
          actorUserId: appUser.id,
          action: "creator.bootstrap",
          entityType: "app_user",
          entityId: appUser.id,
          metadata: { email },
        },
      })

      console.log(`Creator bootstrap complete for ${email}.`)
      console.log(`Member ID: ${memberId}`)
    })
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  const clerkError = getClerkErrorDetails(error)

  if (clerkError) {
    console.error(`Clerk API error (${clerkError.status}): ${clerkError.message}`)

    for (const detail of clerkError.errors) {
      const code = detail.code ? ` [${detail.code}]` : ""
      const meta =
        detail.meta && Object.keys(detail.meta).length > 0
          ? ` ${JSON.stringify(detail.meta)}`
          : ""

      console.error(`- ${detail.longMessage || detail.message}${code}${meta}`)
    }

    if (
      clerkError.errors.some(
        (detail) => detail.code === "unsupported_country_code",
      )
    ) {
      console.error(
        "Hint: your Clerk instance currently requires phone numbers, but the provided country code is not supported for user creation. In Clerk Dashboard, make phone number optional/disabled and use email as the required identifier, or use a Clerk-supported phone country for CREATOR_PHONE_NUMBER.",
      )
    }
  } else {
    console.error(error instanceof Error ? error.message : "Bootstrap failed.")
  }

  process.exitCode = 1
})
