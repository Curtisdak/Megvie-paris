import "server-only"

import { auth } from "@clerk/nextjs/server"
import { createHmac } from "node:crypto"
import { isIP } from "node:net"
import { MembershipStatus } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

class LimitReached extends Error {
  constructor(public retryAfter: number) {
    super("Bible assistant rate limit")
  }
}

export async function limitBibleAssistant(request: Request) {
  const { userId } = await auth()
  const user = userId
    ? await prisma.appUser.findUnique({
        where: { clerkUserId: userId },
        select: { id: true, membershipStatus: true },
      })
    : null
  const memberId =
    user?.membershipStatus === MembershipStatus.ACTIVE ? user.id : null
  const multiplier = memberId ? 4 : 1

  // Vercel overwrites this header; arbitrary forwarded headers are not trusted elsewhere.
  const forwarded = process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    : null
  const address = forwarded && isIP(forwarded) ? forwarded : "shared-local"
  const identity = createHmac("sha256", process.env.GEMINI_API_KEY ?? "local")
    .update(memberId ? `member:${memberId}` : address)
    .digest("hex")
  const prefix = memberId ? "bible:member" : "bible"
  const windows = [
    { key: `${prefix}:10m:${identity}`, seconds: 600, limit: 8 * multiplier },
    {
      key: `${prefix}:day:${identity}`,
      seconds: 86400,
      limit: 30 * multiplier,
    },
    { key: "bible:global:day", seconds: 86400, limit: 1000 },
  ]
  try {
    await prisma.$transaction(
      async (tx) => {
        for (const window of windows) {
          // Atomic UPSERT, with rollback on any limit, works across concurrent serverless instances.
          const rows = await tx.$queryRaw<
            Array<{ count: number; retryAfter: number }>
          >`
          INSERT INTO "bible_assistant_rate_limits" ("key", "count", "expires_at")
          VALUES (${window.key}, 1, NOW() + ${window.seconds} * INTERVAL '1 second')
          ON CONFLICT ("key") DO UPDATE SET
            "count" = CASE WHEN "bible_assistant_rate_limits"."expires_at" <= NOW() THEN 1 ELSE "bible_assistant_rate_limits"."count" + 1 END,
            "expires_at" = CASE WHEN "bible_assistant_rate_limits"."expires_at" <= NOW() THEN NOW() + ${window.seconds} * INTERVAL '1 second' ELSE "bible_assistant_rate_limits"."expires_at" END
          RETURNING "count", CEIL(EXTRACT(EPOCH FROM ("expires_at" - NOW())))::int AS "retryAfter"
        `
          if (!rows[0] || rows[0].count > window.limit)
            throw new LimitReached(rows[0]?.retryAfter ?? window.seconds)
        }
        await tx.$executeRaw`DELETE FROM "bible_assistant_rate_limits" WHERE "expires_at" < NOW()`
      },
      { timeout: 10000 },
    )
    return { allowed: true, retryAfter: 0 }
  } catch (error) {
    if (error instanceof LimitReached)
      return { allowed: false, retryAfter: Math.max(1, error.retryAfter) }
    // Fail closed when the database or migration is unavailable; never grant unmetered API access.
    throw error
  }
}
