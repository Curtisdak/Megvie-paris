import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import {
  normalizeLocale,
  normalizeTimezone,
  parsePushSubscription,
} from "@/lib/push/subscription"

export async function POST(request: NextRequest) {
  let body: {
    subscription?: unknown
    locale?: unknown
    timezone?: unknown
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
  const appUser = authState.userId
    ? await prisma.appUser.findUnique({
        where: { clerkUserId: authState.userId },
        select: { id: true },
      })
    : null

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: parsedSubscription.endpoint },
      update: {
        userId: appUser?.id ?? undefined,
        p256dh: parsedSubscription.p256dh,
        auth: parsedSubscription.auth,
        userAgent: request.headers.get("user-agent"),
        locale: normalizeLocale(body.locale),
        timezone: normalizeTimezone(body.timezone),
        isActive: true,
      },
      create: {
        userId: appUser?.id ?? undefined,
        endpoint: parsedSubscription.endpoint,
        p256dh: parsedSubscription.p256dh,
        auth: parsedSubscription.auth,
        userAgent: request.headers.get("user-agent"),
        locale: normalizeLocale(body.locale),
        timezone: normalizeTimezone(body.timezone),
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
