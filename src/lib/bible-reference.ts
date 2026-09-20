type BibleVerseLinkTarget = {
  book_id: string
  chapter: number
  verse?: number | null
  verses?: number[]
}

export function getBibleReferenceHref(reference: string) {
  return `/bible?ref=${encodeURIComponent(reference)}`
}

export function getBibleVerseHref({
  book_id,
  chapter,
  verse,
  verses,
}: BibleVerseLinkTarget) {
  const params = new URLSearchParams({
    book: book_id,
    chapter: String(chapter),
  })

  if (verse) {
    params.set("verse", String(verse))
  }

  if (verses?.length) {
    const selection = [...new Set(verses)]
      .filter((value) => Number.isInteger(value) && value > 0)
      .sort((a, b) => a - b)
    if (selection.length) {
      params.set("verse", String(selection[0]))
      params.set("verses", selection.join(","))
    }
  }

  return `/bible?${params.toString()}`
}

export function getBibleHighlightedVerses(params: URLSearchParams) {
  const start = Number(params.get("verse"))
  const end = Number(params.get("verseEnd"))
  const selection = (params.get("verses") ?? "").split(",").map(Number)
  if (Number.isInteger(start) && start > 0) {
    selection.push(start)
    if (Number.isInteger(end) && end >= start && end - start < 180) {
      for (let verse = start; verse <= end; verse++) selection.push(verse)
    }
  }
  return [...new Set(selection)]
    .filter((verse) => Number.isInteger(verse) && verse > 0 && verse <= 180)
    .slice(0, 180)
    .sort((a, b) => a - b)
}
