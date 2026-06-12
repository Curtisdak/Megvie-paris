type BibleVerseLinkTarget = {
  book_id: string
  chapter: number
  verse?: number | null
}

export function getBibleReferenceHref(reference: string) {
  return `/bible?ref=${encodeURIComponent(reference)}`
}

export function getBibleVerseHref({
  book_id,
  chapter,
  verse,
}: BibleVerseLinkTarget) {
  const params = new URLSearchParams({
    book: book_id,
    chapter: String(chapter),
  })

  if (verse) {
    params.set("verse", String(verse))
  }

  return `/bible?${params.toString()}`
}
