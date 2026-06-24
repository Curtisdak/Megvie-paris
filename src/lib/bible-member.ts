import "server-only"

import { getBibleTranslation, getBookById, getVersesForChapter } from "@/lib/bible-data"
import { getBibleVerseHref } from "@/lib/bible-reference"

export type BibleVerseSelectionInput = {
  book: string
  chapter: number
  verseStart: number
  verseEnd?: number
  translation?: string | null
}

export type ValidatedBibleVerseSelection = {
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
  reference: string
  text: string
  translation: string
  href: string
}

function toPositiveInteger(value: unknown) {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function getDefaultBibleTranslationName() {
  const translation = getBibleTranslation()

  return translation.name ?? translation.abbreviation ?? "Louis Segond 1910"
}

export function validateBibleVerseSelection(
  input: BibleVerseSelectionInput,
): ValidatedBibleVerseSelection {
  const bookId = input.book.trim().toUpperCase()
  const book = getBookById(bookId)
  const chapter = toPositiveInteger(input.chapter)
  const verseStart = toPositiveInteger(input.verseStart)
  const verseEnd = toPositiveInteger(input.verseEnd ?? input.verseStart)

  if (!book || !chapter || !verseStart || !verseEnd || verseEnd < verseStart) {
    throw new Error("Reference biblique invalide.")
  }

  const chapterVerses = getVersesForChapter(book.id, chapter)
  const selectedVerses = chapterVerses.filter(
    (verse) => verse.verse >= verseStart && verse.verse <= verseEnd,
  )

  if (selectedVerses.length !== verseEnd - verseStart + 1) {
    throw new Error("Verset biblique introuvable.")
  }

  const reference =
    verseStart === verseEnd
      ? selectedVerses[0].reference
      : `${book.name} ${chapter}:${verseStart}-${verseEnd}`
  const text = selectedVerses
    .map((verse) => `${verse.verse} ${verse.text}`)
    .join(" ")
    .trim()

  return {
    book: book.id,
    chapter,
    verseStart,
    verseEnd,
    reference,
    text,
    translation: input.translation?.trim() || getDefaultBibleTranslationName(),
    href: getBibleVerseHref({
      book_id: book.id,
      chapter,
      verse: verseStart,
    }),
  }
}
