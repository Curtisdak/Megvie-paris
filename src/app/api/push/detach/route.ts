import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { checkRateLimit } from "@/lib/auth/rate-limit"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const authState = await auth()

  if (!authState.userId) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 })
  }

  const rateLimit = checkRateLimit(`push-detach:${authState.userId}`, {
    limit: 10,
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

  const body = (await request.json().catch(() => ({}))) as {
    endpoint?: unknown
    preserveAnonymousDailyVerse?: unknown
  }

  if (typeof body.endpoint !== "string" || body.endpoint.length < 20) {
    return NextResponse.json(
      { error: "Endpoint push invalide." },
      { status: 400 },
    )
  }

  const user = await prisma.appUser.findUnique({
    where: { clerkUserId: authState.userId },
    select: { id: true },
  })

  if (!user) {
    return NextResponse.json({ error: "Membre introuvable." }, { status: 404 })
  }

  const preserveAnonymousDailyVerse =
    body.preserveAnonymousDailyVerse === true
  const updated = await prisma.pushSubscription.updateMany({
    where: { endpoint: body.endpoint, userId: user.id },
    data: {
      userId: null,
      anonymousDailyVerseEnabled: preserveAnonymousDailyVerse,
      isActive: preserveAnonymousDailyVerse,
      revokedAt: preserveAnonymousDailyVerse ? null : new Date(),
    },
  })

  if (updated.count === 0) {
    return NextResponse.json(
      { error: "Aucun appareil associe a votre compte." },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true })
}
