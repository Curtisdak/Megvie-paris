import { NextRequest, NextResponse } from "next/server"
import { searchFinanceMembers } from "@/lib/finance/direct"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? ""
  const members = await searchFinanceMembers(q)

  return NextResponse.json({ members })
}
