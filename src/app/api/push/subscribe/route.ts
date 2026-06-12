import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
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

  const supabaseConfig = getSupabaseAdminClient()

  if ("error" in supabaseConfig) {
    return NextResponse.json({ error: supabaseConfig.error }, { status: 500 })
  }

  const { error } = await supabaseConfig.supabase
    .from("push_subscriptions")
    .upsert(
      {
        endpoint: parsedSubscription.endpoint,
        p256dh: parsedSubscription.p256dh,
        auth: parsedSubscription.auth,
        user_agent: request.headers.get("user-agent"),
        locale: normalizeLocale(body.locale),
        timezone: normalizeTimezone(body.timezone),
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    )

  if (error) {
    console.error("Push subscription upsert error", error)
    return NextResponse.json(
      { error: "Impossible d'enregistrer les notifications." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
