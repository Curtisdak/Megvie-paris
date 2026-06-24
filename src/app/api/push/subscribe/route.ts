import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/auth/rate-limit"
import {
  normalizeLocale,
  normalizeTimezone,
  parsePushSubscription,
} from "@/lib/push/subscription"

function cleanDeviceName(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 80) || null : null
}

function hasBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback
}

export async function POST(request: NextRequest) {
  let body: {
    subscription?: unknown
    locale?: unknown
    timezone?: unknown
    deviceName?: unknown
    anonymousDailyVerseEnabled?: unknown
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Requete d'abonnement invalide." },
      { status: 400 },
    )
  }

  const parsedSubscription = parsePushSubscription(
    body.subscription ?? body,
  )

  if ("error" in parsedSubscription) {
    return NextResponse.json(
      { error: parsedSubscription.error },
      { status: 400 },
    )
  }

  const authState = await auth()
  const rateKey =
    authState.userId ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous"
  const rateLimit = checkRateLimit(`push-subscribe:${rateKey}`, {
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

  const appUser = authState.userId
    ? await prisma.appUser.findUnique({
        where: { clerkUserId: authState.userId },
        select: { id: true },
      })
    : null

  try {
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: parsedSubscription.endpoint },
      select: { userId: true },
    })

    if (!appUser && existing?.userId) {
      return NextResponse.json(
        {
          error:
            "Cet appareil est deja associe a un compte. Connectez-vous pour modifier ses notifications.",
        },
        { status: 403 },
      )
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: parsedSubscription.endpoint },
      update: {
        userId: appUser?.id ?? undefined,
        p256dh: parsedSubscription.p256dh,
        auth: parsedSubscription.auth,
        deviceName: cleanDeviceName(body.deviceName),
        userAgent: request.headers.get("user-agent"),
        locale: normalizeLocale(body.locale),
        timezone: normalizeTimezone(body.timezone),
        isActive: true,
        anonymousDailyVerseEnabled: appUser
          ? hasBoolean(body.anonymousDailyVerseEnabled, true)
          : true,
        lastSeenAt: new Date(),
        revokedAt: null,
      },
      create: {
        userId: appUser?.id ?? undefined,
        endpoint: parsedSubscription.endpoint,
        p256dh: parsedSubscription.p256dh,
        auth: parsedSubscription.auth,
        deviceName: cleanDeviceName(body.deviceName),
        userAgent: request.headers.get("user-agent"),
        locale: normalizeLocale(body.locale),
        timezone: normalizeTimezone(body.timezone),
        anonymousDailyVerseEnabled: appUser
          ? hasBoolean(body.anonymousDailyVerseEnabled, true)
          : true,
        lastSeenAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Push subscription upsert error", error)
    return NextResponse.json(
      { error: "Impossible d'enregistrer les notifications." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
