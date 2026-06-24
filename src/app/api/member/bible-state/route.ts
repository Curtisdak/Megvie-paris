import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getBookById, getVersesForChapter } from "@/lib/bible-data"
import { getCurrentUserBibleStateForChapter } from "@/lib/bible-data-member"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const authState = await auth()

  if (!authState.userId) {
    return NextResponse.json({
      authenticated: false,
      favorites: [],
      notes: [],
    })
  }

  const { searchParams } = new URL(request.url)
  const bookParam = searchParams.get("book") ?? ""
  const chapter = Number(searchParams.get("chapter") ?? "0")
  const translation = searchParams.get("translation")?.trim() || "Louis Segond 1910"
  const book = getBookById(bookParam)

  if (!book || !Number.isInteger(chapter) || chapter < 1) {
    return NextResponse.json(
      { authenticated: true, error: "Reference biblique invalide." },
      { status: 400 },
    )
  }

  const verses = getVersesForChapter(book.id, chapter)

  if (verses.length === 0) {
    return NextResponse.json(
      { authenticated: true, error: "Chapitre biblique introuvable." },
      { status: 404 },
    )
  }

  const user = await prisma.appUser.findUnique({
    where: { clerkUserId: authState.userId },
    select: { id: true },
  })

  if (!user) {
    return NextResponse.json({
      authenticated: true,
      favorites: [],
      notes: [],
    })
  }

  const state = await getCurrentUserBibleStateForChapter({
    userId: user.id,
    book: book.id,
    chapter,
    translation,
  })

  return NextResponse.json({
    authenticated: true,
    favorites: state.favorites,
    notes: state.notes.map((note) => ({
      ...note,
      updatedAt: note.updatedAt.toISOString(),
    })),
  })
}
