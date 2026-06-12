import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { validateRequestSecret } from "@/lib/request-auth"
import {
  parsePushSubscription,
  type ParsedPushSubscription,
} from "@/lib/push/subscription"
import {
  getWebPushConfig,
  toWebPushSubscription,
} from "@/lib/push/web-push"

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
  const auth = validateRequestSecret(request, [
    "TEST_PUSH_SECRET",
    "CRON_SECRET",
  ])

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const webPushConfig = getWebPushConfig()

  if ("error" in webPushConfig) {
    return NextResponse.json({ error: webPushConfig.error }, { status: 500 })
  }

  const supabaseConfig = getSupabaseAdminClient()

  if ("error" in supabaseConfig) {
    return NextResponse.json({ error: supabaseConfig.error }, { status: 500 })
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
    const { data, error } = await supabaseConfig.supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("endpoint", body.endpoint)
      .eq("is_active", true)
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: "Impossible de charger l'abonnement push." },
        { status: 500 },
      )
    }

    subscription = data as PushSubscriptionRow | null
  } else {
    const { data, error } = await supabaseConfig.supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: "Impossible de charger un abonnement push actif." },
        { status: 500 },
      )
    }

    subscription = data as PushSubscriptionRow | null
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
