import { NextRequest, NextResponse } from "next/server"
import { getParisDayOfYear } from "@/lib/daily-verse"
import { NotificationDeliveryStatus } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { validateRequestSecret } from "@/lib/request-auth"
import {
  getWebPushConfig,
  isExpiredPushSubscriptionError,
  toWebPushSubscription,
  type StoredPushSubscription,
} from "@/lib/push/web-push"

export const dynamic = "force-dynamic"

type PushSubscriptionRow = StoredPushSubscription & {
  id: string
  userId: string | null
}

function getSiteUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    request.nextUrl.origin
  ).replace(/\/$/, "")
}

async function handleDailyVerse(request: NextRequest) {
  const auth = validateRequestSecret(request, ["CRON_SECRET"])

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const webPushConfig = getWebPushConfig()

  if ("error" in webPushConfig) {
    return NextResponse.json({ error: webPushConfig.error }, { status: 500 })
  }

  const dayOfYear = getParisDayOfYear()
  const verse = await prisma.dailyBibleVerse
    .findUnique({
      where: { dayOfYear },
      select: { id: true, reference: true, text: true, translation: true },
    })
    .catch((error) => {
      console.error("Daily verse fetch error", error)
      return null
    })

  if (!verse) {
    return NextResponse.json(
      { error: `Aucun verset configure pour le jour ${dayOfYear}.` },
      { status: 404 },
    )
  }

  let subscriptions: PushSubscriptionRow[]

  try {
    subscriptions = await prisma.pushSubscription.findMany({
      where: {
        isActive: true,
        OR: [
          { userId: null },
          {
            user: {
              notificationPreference: {
                is: { dailyVerseEnabled: true },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        userId: true,
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    })
  } catch (error) {
    console.error("Push subscriptions fetch error", error)
    return NextResponse.json(
      { error: "Impossible de charger les abonnements push." },
      { status: 500 },
    )
  }

  let sent = 0
  let failed = 0
  let deactivated = 0
  const siteUrl = getSiteUrl(request)
  const payload = JSON.stringify({
    title: "Verset du jour \u2014 MegVie Paris",
    body: `${verse.text} \u2014 ${verse.reference}`,
    url: `${siteUrl}/verset-du-jour`,
    reference: verse.reference,
    text: verse.text,
  })

  for (const subscription of subscriptions) {
    try {
      await webPushConfig.push.sendNotification(
        toWebPushSubscription(subscription),
        payload,
      )

      sent += 1

      await prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: { lastSentAt: new Date() },
      })

      await prisma.notificationLog.create({
        data: {
          userId: subscription.userId,
          pushSubscriptionId: subscription.id,
          notificationType: "daily_verse",
          title: "Verset du jour",
          deliveryStatus: NotificationDeliveryStatus.SENT,
          sentAt: new Date(),
        },
      })
    } catch (error) {
      failed += 1

      const shouldDeactivate = isExpiredPushSubscriptionError(error)

      if (shouldDeactivate) {
        deactivated += 1
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { isActive: false },
        })
      }

      await prisma.notificationLog.create({
        data: {
          userId: subscription.userId,
          pushSubscriptionId: subscription.id,
          notificationType: "daily_verse",
          title: "Verset du jour",
          deliveryStatus: shouldDeactivate
            ? NotificationDeliveryStatus.DEACTIVATED
            : NotificationDeliveryStatus.FAILED,
          errorMessage:
            error instanceof Error
              ? error.message
              : "Erreur web-push inconnue",
        },
      })
    }
  }

  return NextResponse.json({
    dayOfYear,
    verse: verse.reference,
    sent,
    failed,
    deactivated,
  })
}

export async function GET(request: NextRequest) {
  return handleDailyVerse(request)
}

export async function POST(request: NextRequest) {
  return handleDailyVerse(request)
}
