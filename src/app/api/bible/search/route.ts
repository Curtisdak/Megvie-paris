import { NextResponse } from "next/server"
import { BIBLE_SEARCH_LIMIT, searchVerses } from "@/lib/bible-data"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") ?? ""
  const limit = Number(searchParams.get("limit") ?? BIBLE_SEARCH_LIMIT)

  return NextResponse.json(searchVerses(query, limit))
}
