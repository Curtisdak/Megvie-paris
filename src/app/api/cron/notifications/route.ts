import { NextRequest, NextResponse } from "next/server"
import { runNotificationScheduler } from "@/lib/notifications/service"
import { validateRequestSecret } from "@/lib/request-auth"

export const dynamic = "force-dynamic"

async function handleNotificationsCron(request: NextRequest) {
  const auth = validateRequestSecret(request, ["CRON_SECRET"])

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const summary = await runNotificationScheduler()

  return NextResponse.json(summary)
}

export async function GET(request: NextRequest) {
  return handleNotificationsCron(request)
}

export async function POST(request: NextRequest) {
  return handleNotificationsCron(request)
}
