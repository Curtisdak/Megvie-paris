import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

  try {
    await prisma.pushSubscription.updateMany({
      where: { endpoint: body.endpoint },
      data: { isActive: false },
    })
  } catch (error) {
    console.error("Push unsubscribe error", error)
    return NextResponse.json(
      { error: "Impossible de desactiver les notifications." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
