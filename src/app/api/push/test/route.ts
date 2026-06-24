import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/auth/rate-limit"
import { isAdminRole } from "@/lib/auth/permissions"
import { validateRequestSecret } from "@/lib/request-auth"
import {
  parsePushSubscription,
  type ParsedPushSubscription,
} from "@/lib/push/subscription"
import {
  getWebPushConfig,
  toWebPushSubscription,
} from "@/lib/push/web-push"
import {
  createNotificationCampaign,
  processDuePushAttempts,
} from "@/lib/notifications/service"
import {
  NotificationAudienceType,
  NotificationType,
} from "@/generated/prisma/enums"

export const dynamic = "force-dynamic"

type PushSubscriptionRow = ParsedPushSubscription & {
  id?: string
}

function getSiteUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    request.nextUrl.origin
  ).replace(/\/$/, "")
}

export async function POST(request: NextRequest) {
  const authState = await auth()
  const appUser = authState.userId
    ? await prisma.appUser.findUnique({
        where: { clerkUserId: authState.userId },
        select: { id: true, role: true },
      })
    : null

  if (appUser && isAdminRole(appUser.role)) {
    const rateLimit = checkRateLimit(`admin-test-push:${appUser.id}`, {
      limit: 5,
      windowMs: 60_000,
    })

    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Trop de tests. Reessayez dans un instant." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      )
    }

    const subscriptionCount = await prisma.pushSubscription.count({
      where: { userId: appUser.id, isActive: true, revokedAt: null },
    })

    if (subscriptionCount === 0) {
      return NextResponse.json(
        {
          error:
            "Activez les notifications sur cet appareil avant d'envoyer un test.",
        },
        { status: 404 },
      )
    }

    await createNotificationCampaign({
      type: NotificationType.TEST,
      title: "Test notification - MegVie Paris",
      body: "Ceci est une notification de test MegVie Paris.",
      targetUrl: "/espace-membre/notifications",
      audienceType: NotificationAudienceType.INDIVIDUAL,
      targetUserId: appUser.id,
      createdByUserId: appUser.id,
      sourceType: "admin_test",
      sourceId: appUser.id,
      dedupeKey: `test:${appUser.id}:${Date.now()}`,
      tag: `test:${appUser.id}`,
    })

    const summary = await processDuePushAttempts(10)

    await prisma.adminAuditLog.create({
      data: {
        actorUserId: appUser.id,
        action: "notification.test_push_sent",
        entityType: "notification_campaign",
        summary: "Notification de test envoyee a l'administrateur courant.",
        metadata: { accepted: summary.accepted, failed: summary.failed },
      },
    })

    return NextResponse.json({ success: true, ...summary })
  }

  const secretAuth = validateRequestSecret(request, [
    "TEST_PUSH_SECRET",
    "CRON_SECRET",
  ])

  if (!secretAuth.ok) {
    return NextResponse.json(
      { error: secretAuth.error },
      { status: secretAuth.status },
    )
  }

  const webPushConfig = getWebPushConfig()

  if ("error" in webPushConfig) {
    return NextResponse.json({ error: webPushConfig.error }, { status: 500 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    subscription?: unknown
    endpoint?: unknown
  }

  let subscription: PushSubscriptionRow | null = null

  if (body.subscription) {
    const parsedSubscription = parsePushSubscription(body.subscription)

    if ("error" in parsedSubscription) {
      return NextResponse.json(
        { error: parsedSubscription.error },
        { status: 400 },
      )
    }

    subscription = parsedSubscription
  } else if (typeof body.endpoint === "string") {
    try {
      subscription = await prisma.pushSubscription.findFirst({
        where: { endpoint: body.endpoint, isActive: true },
        select: { id: true, endpoint: true, p256dh: true, auth: true },
      })
    } catch {
      return NextResponse.json(
        { error: "Impossible de charger l'abonnement push." },
        { status: 500 },
      )
    }
  } else {
    try {
      subscription = await prisma.pushSubscription.findFirst({
        where: { isActive: true },
        select: { id: true, endpoint: true, p256dh: true, auth: true },
      })
    } catch {
      return NextResponse.json(
        { error: "Impossible de charger un abonnement push actif." },
        { status: 500 },
      )
    }
  }

  if (!subscription) {
    return NextResponse.json(
      { error: "Aucun abonnement push actif trouve." },
      { status: 404 },
    )
  }

  const payload = JSON.stringify({
    title: "Verset du jour \u2014 MegVie Paris",
    body: "Ceci est une notification de test MegVie Paris.",
    url: `${getSiteUrl(request)}/verset-du-jour`,
    reference: "Test",
    text: "Ceci est une notification de test MegVie Paris.",
  })

  await webPushConfig.push.sendNotification(
    toWebPushSubscription(subscription),
    payload,
  )

  return NextResponse.json({ success: true })
}
