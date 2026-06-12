import { NextRequest, NextResponse } from "next/server"
import { getParisDayOfYear } from "@/lib/daily-verse"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { validateRequestSecret } from "@/lib/request-auth"
import {
  getWebPushConfig,
  isExpiredPushSubscriptionError,
  toWebPushSubscription,
  type StoredPushSubscription,
} from "@/lib/push/web-push"

export const dynamic = "force-dynamic"

type DailyVerseRow = {
  id: string
  reference: string
  text: string
  translation: string
}

type PushSubscriptionRow = StoredPushSubscription & {
  id: string
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

  const supabaseConfig = getSupabaseAdminClient()

  if ("error" in supabaseConfig) {
    return NextResponse.json({ error: supabaseConfig.error }, { status: 500 })
  }

  const webPushConfig = getWebPushConfig()

  if ("error" in webPushConfig) {
    return NextResponse.json({ error: webPushConfig.error }, { status: 500 })
  }

  const dayOfYear = getParisDayOfYear()
  const { data: verse, error: verseError } = await supabaseConfig.supabase
    .from("daily_bible_verses")
    .select("id, reference, text, translation")
    .eq("day_of_year", dayOfYear)
    .maybeSingle()

  if (verseError) {
    console.error("Daily verse fetch error", verseError)
    return NextResponse.json(
      { error: "Impossible de charger le verset du jour." },
      { status: 500 },
    )
  }

  if (!verse) {
    return NextResponse.json(
      { error: `Aucun verset configure pour le jour ${dayOfYear}.` },
      { status: 404 },
    )
  }

  const { data: subscriptions, error: subscriptionsError } =
    await supabaseConfig.supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("is_active", true)

  if (subscriptionsError) {
    console.error("Push subscriptions fetch error", subscriptionsError)
    return NextResponse.json(
      { error: "Impossible de charger les abonnements push." },
      { status: 500 },
    )
  }

  let sent = 0
  let failed = 0
  let deactivated = 0
  const siteUrl = getSiteUrl(request)
  const typedVerse = verse as DailyVerseRow
  const payload = JSON.stringify({
    title: "Verset du jour \u2014 MegVie Paris",
    body: `${typedVerse.text} \u2014 ${typedVerse.reference}`,
    url: `${siteUrl}/verset-du-jour`,
    reference: typedVerse.reference,
    text: typedVerse.text,
  })

  for (const subscription of (subscriptions ?? []) as PushSubscriptionRow[]) {
    try {
      await webPushConfig.push.sendNotification(
        toWebPushSubscription(subscription),
        payload,
      )

      sent += 1

      await supabaseConfig.supabase
        .from("push_subscriptions")
        .update({
          last_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id)

      await supabaseConfig.supabase.from("notification_logs").insert({
        subscription_id: subscription.id,
        verse_id: typedVerse.id,
        status: "sent",
      })
    } catch (error) {
      failed += 1

      const shouldDeactivate = isExpiredPushSubscriptionError(error)

      if (shouldDeactivate) {
        deactivated += 1
        await supabaseConfig.supabase
          .from("push_subscriptions")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id)
      }

      await supabaseConfig.supabase.from("notification_logs").insert({
        subscription_id: subscription.id,
        verse_id: typedVerse.id,
        status: "failed",
        error_message:
          error instanceof Error ? error.message : "Erreur web-push inconnue",
      })
    }
  }

  return NextResponse.json({
    dayOfYear,
    verse: typedVerse.reference,
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
