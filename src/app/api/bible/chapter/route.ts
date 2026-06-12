import { NextResponse } from "next/server"
import {
  getBookById,
  getChaptersForBook,
  getIntroductionsForBook,
  getVersesForChapter,
} from "@/lib/bible-data"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get("bookId")
  const chapterNumber = Number(searchParams.get("chapter") ?? "1")

  if (!bookId) {
    return NextResponse.json(
      { error: "Le livre est obligatoire." },
      { status: 400 },
    )
  }

  if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
    return NextResponse.json(
      { error: "Le chapitre demande est invalide." },
      { status: 400 },
    )
  }

  const book = getBookById(bookId)

  if (!book) {
    return NextResponse.json(
      { error: "Livre biblique introuvable." },
      { status: 404 },
    )
  }

  const chapters = getChaptersForBook(book.id)
  const chapter = chapters.find((item) => item.chapter === chapterNumber)

  if (!chapter) {
    return NextResponse.json(
      { error: "Chapitre biblique introuvable." },
      { status: 404 },
    )
  }

  return NextResponse.json({
    book,
    chapter,
    chapters,
    introductions: getIntroductionsForBook(book.id, chapterNumber),
    verses: getVersesForChapter(book.id, chapterNumber),
  })
}
