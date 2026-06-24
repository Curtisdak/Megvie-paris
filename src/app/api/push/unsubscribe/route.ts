import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { checkRateLimit } from "@/lib/auth/rate-limit"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  let body: { endpoint?: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Requete de desabonnement invalide." },
      { status: 400 },
    )
  }

  if (typeof body.endpoint !== "string" || body.endpoint.length < 20) {
    return NextResponse.json(
      { error: "Endpoint push invalide." },
      { status: 400 },
    )
  }

  const authState = await auth()
  const appUser = authState.userId
    ? await prisma.appUser.findUnique({
        where: { clerkUserId: authState.userId },
        select: { id: true },
      })
    : null
  const rateKey =
    authState.userId ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous"
  const rateLimit = checkRateLimit(`push-unsubscribe:${rateKey}`, {
    limit: 12,
    windowMs: 60_000,
  })

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Reessayez dans un instant." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    )
  }

  try {
    const updated = await prisma.pushSubscription.updateMany({
      where: {
        endpoint: body.endpoint,
        userId: appUser ? appUser.id : null,
      },
      data: {
        isActive: false,
        anonymousDailyVerseEnabled: false,
        revokedAt: new Date(),
      },
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Aucun abonnement modifiable trouve pour cet appareil." },
        { status: 404 },
      )
    }
  } catch (error) {
    console.error("Push unsubscribe error", error)
    return NextResponse.json(
      { error: "Impossible de desactiver les notifications." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
