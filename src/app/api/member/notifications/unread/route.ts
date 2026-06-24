import { NextResponse } from "next/server"
import { getUnreadNotificationCountForCurrentUser } from "@/lib/notifications/member"

export const dynamic = "force-dynamic"

export async function GET() {
  const unread = await getUnreadNotificationCountForCurrentUser()

  return NextResponse.json({ unread })
}
