import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"

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

  const supabaseConfig = getSupabaseAdminClient()

  if ("error" in supabaseConfig) {
    return NextResponse.json({ error: supabaseConfig.error }, { status: 500 })
  }

  const { error } = await supabaseConfig.supabase
    .from("push_subscriptions")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("endpoint", body.endpoint)

  if (error) {
    console.error("Push unsubscribe error", error)
    return NextResponse.json(
      { error: "Impossible de desactiver les notifications." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
