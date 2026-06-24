import fs from "node:fs"
import path from "node:path"

export type Testament = "OT" | "NT"

export type BibleBook = {
  id: string
  book_number: number
  testament: Testament
  name: string
  name_english?: string
  header?: string
  chapter_count: number
  verse_count: number
}

export type BibleChapter = {
  id: string
  book_id: string
  book_number: number
  book_name: string
  testament: Testament
  chapter: number
  verse_count: number
}

export type BibleHeading = {
  id?: string
  marker?: string
  scope?: string
  level?: number
  text?: string
}

export type BibleCrossReference = {
  id?: string
  kind?: string
  marker?: string
  source_reference?: string
  origin_text?: string
  target_text?: string
  caller?: string
}

export type BibleFootnote = {
  id?: string
  marker?: string
  caller?: string
  text?: string
  reference?: string
}

export type BibleVerse = {
  translation_id?: string
  book_id: string
  book_number: number
  book_name: string
  testament: Testament
  id: string
  chapter: number
  verse: number
  reference: string
  text: string
  section_heading?: string | null
  headings?: BibleHeading[]
  cross_references?: BibleCrossReference[]
  section_cross_references?: BibleCrossReference[]
  footnotes?: BibleFootnote[]
}

export type BibleIntroduction = {
  id: string
  translation_id?: string
  book_id: string
  book_number: number
  book_name: string
  testament: Testament
  marker?: string
  text: string
  anchor_chapter?: number | null
  sort_order?: number
}

export type BibleTranslation = {
  id?: string
  name?: string
  abbreviation?: string
  language?: string
  language_name?: string
  canon?: string
  license?: string
  source_note?: string
  counts?: {
    books?: number
    chapters?: number
    verses?: number
  }
}

export type BibleSearchResult = Pick<
  BibleVerse,
  | "id"
  | "book_id"
  | "book_number"
  | "book_name"
  | "testament"
  | "chapter"
  | "verse"
  | "reference"
  | "text"
>

export type BibleSearchResponse = {
  query: string
  total: number
  limit: number
  limited: boolean
  results: BibleSearchResult[]
}

export const BIBLE_SEARCH_LIMIT = 50

type BibleChapterIndexEntry = {
  start: number
  end: number
  verses?: number
}

type BibleChapterIndex = {
  source?: string
  encoding?: BufferEncoding
  chapters?: Record<string, BibleChapterIndexEntry>
}

type BibleSearchIndexRecord = [
  id: string,
  bookId: string,
  bookNumber: number,
  bookName: string,
  testament: Testament,
  chapter: number,
  verse: number,
  reference: string,
  text: string,
  searchText: string,
]

type BibleSearchIndex = {
  source?: string
  recordCount?: number
  records?: BibleSearchIndexRecord[]
}

const bibleDirectory = path.join(process.cwd(), "bible")
const jsonCache = new Map<string, unknown>()
const chapterVerseCache = new Map<string, BibleVerse[]>()

function readJsonFile<T>(fileName: string, fallback: T): T {
  if (jsonCache.has(fileName)) {
    return jsonCache.get(fileName) as T
  }

  const filePath = path.join(bibleDirectory, fileName)

  try {
    if (!fs.existsSync(filePath)) {
      jsonCache.set(fileName, fallback)
      return fallback
    }

    const content = fs.readFileSync(filePath, "utf8").trim()
    if (!content) {
      jsonCache.set(fileName, fallback)
      return fallback
    }

    const parsed = JSON.parse(content) as T
    jsonCache.set(fileName, parsed)
    return parsed
  } catch (error) {
    console.error(`Unable to load Bible data file ${fileName}`, error)
    jsonCache.set(fileName, fallback)
    return fallback
  }
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function toTestament(value: unknown): Testament {
  return value === "NT" ? "NT" : "OT"
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function normalizeBook(rawBook: Record<string, unknown>, index: number): BibleBook {
  const id = toText(rawBook.id ?? rawBook.book_id ?? rawBook.code, `BOOK-${index + 1}`)
  const bookNumber = toNumber(rawBook.book_number ?? rawBook.number, index + 1)

  return {
    id,
    book_number: bookNumber,
    testament: toTestament(rawBook.testament),
    name: toText(rawBook.name ?? rawBook.book_name, id),
    name_english: toText(rawBook.name_english, ""),
    header: toText(rawBook.header, ""),
    chapter_count: toNumber(rawBook.chapter_count ?? rawBook.chapters, 0),
    verse_count: toNumber(rawBook.verse_count ?? rawBook.verses, 0),
  }
}

function normalizeChapter(
  rawChapter: Record<string, unknown>,
  index: number,
): BibleChapter {
  const bookId = toText(rawChapter.book_id)
  const chapter = toNumber(rawChapter.chapter, index + 1)

  return {
    id: toText(rawChapter.id, `${bookId}-${String(chapter).padStart(3, "0")}`),
    book_id: bookId,
    book_number: toNumber(rawChapter.book_number, 0),
    book_name: toText(rawChapter.book_name, bookId),
    testament: toTestament(rawChapter.testament),
    chapter,
    verse_count: toNumber(rawChapter.verse_count, 0),
  }
}

function normalizeVerse(rawVerse: Record<string, unknown>): BibleVerse {
  const bookId = toText(rawVerse.book_id)
  const chapter = toNumber(rawVerse.chapter, 0)
  const verse = toNumber(rawVerse.verse, 0)
  const reference = toText(
    rawVerse.reference,
    `${toText(rawVerse.book_name, bookId)} ${chapter}:${verse}`,
  )

  return {
    translation_id: toText(rawVerse.translation_id, ""),
    book_id: bookId,
    book_number: toNumber(rawVerse.book_number, 0),
    book_name: toText(rawVerse.book_name, bookId),
    testament: toTestament(rawVerse.testament),
    id: toText(rawVerse.id, `${bookId}-${chapter}-${verse}`),
    chapter,
    verse,
    reference,
    text: toText(rawVerse.text),
    section_heading:
      typeof rawVerse.section_heading === "string"
        ? rawVerse.section_heading
        : null,
    headings: toArray<BibleHeading>(rawVerse.headings),
    cross_references: toArray<BibleCrossReference>(rawVerse.cross_references),
    section_cross_references: toArray<BibleCrossReference>(
      rawVerse.section_cross_references,
    ),
    footnotes: toArray<BibleFootnote>(rawVerse.footnotes),
  }
}

function normalizeIntroduction(
  rawIntroduction: Record<string, unknown>,
  index: number,
): BibleIntroduction {
  const bookId = toText(rawIntroduction.book_id)

  return {
    id: toText(rawIntroduction.id, `${bookId}-INTRO-${index + 1}`),
    translation_id: toText(rawIntroduction.translation_id, ""),
    book_id: bookId,
    book_number: toNumber(rawIntroduction.book_number, 0),
    book_name: toText(rawIntroduction.book_name, bookId),
    testament: toTestament(rawIntroduction.testament),
    marker: toText(rawIntroduction.marker, ""),
    text: toText(rawIntroduction.text),
    anchor_chapter:
      rawIntroduction.anchor_chapter === null ||
      rawIntroduction.anchor_chapter === undefined
        ? null
        : toNumber(rawIntroduction.anchor_chapter, 0),
    sort_order: toNumber(rawIntroduction.sort_order, index + 1),
  }
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .toLowerCase()
    .trim()
}

function sortByCanonicalOrder<T extends { book_number: number }>(items: T[]) {
  return [...items].sort((a, b) => a.book_number - b.book_number)
}

function chapterCacheKey(bookId: string, chapterNumber: number) {
  return `${bookId.toUpperCase()}:${chapterNumber}`
}

function toSearchResult(verse: BibleVerse): BibleSearchResult {
  return {
    id: verse.id,
    book_id: verse.book_id,
    book_number: verse.book_number,
    book_name: verse.book_name,
    testament: verse.testament,
    chapter: verse.chapter,
    verse: verse.verse,
    reference: verse.reference,
    text: verse.text,
  }
}

function searchRecordToResult(record: BibleSearchIndexRecord): BibleSearchResult {
  return {
    id: record[0],
    book_id: record[1],
    book_number: record[2],
    book_name: record[3],
    testament: record[4],
    chapter: record[5],
    verse: record[6],
    reference: record[7],
    text: record[8],
  }
}

function readVerseChapterIndex() {
  return readJsonFile<BibleChapterIndex>("verses.chapter-index.json", {
    source: "verses.ndjson",
    encoding: "utf8",
    chapters: {},
  })
}

function readVerseSearchIndex() {
  const index = readJsonFile<BibleSearchIndex>("verses.search-index.json", {
    source: "verses.ndjson",
    recordCount: 0,
    records: [],
  })

  return Array.isArray(index.records) && index.records.length > 0 ? index : null
}

function parseVerseLine(line: string) {
  return normalizeVerse(JSON.parse(line) as Record<string, unknown>)
}

function readVersesForChapterFromIndex(bookId: string, chapterNumber: number) {
  const index = readVerseChapterIndex()
  const entry = index.chapters?.[chapterCacheKey(bookId, chapterNumber)]

  if (!entry || entry.start < 0 || entry.end <= entry.start) {
    return null
  }

  const sourcePath = path.join(bibleDirectory, index.source ?? "verses.ndjson")

  if (!fs.existsSync(sourcePath)) {
    return null
  }

  const length = entry.end - entry.start
  const buffer = Buffer.alloc(length)
  const fd = fs.openSync(sourcePath, "r")

  try {
    fs.readSync(fd, buffer, 0, length, entry.start)
  } finally {
    fs.closeSync(fd)
  }

  return buffer
    .toString(index.encoding ?? "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseVerseLine)
    .filter(
      (verse) =>
        verse.book_id.toUpperCase() === bookId.toUpperCase() &&
        verse.chapter === chapterNumber,
    )
    .sort((a, b) => a.verse - b.verse)
}

function forEachBibleVerse(callback: (verse: BibleVerse) => void) {
  const ndjsonPath = path.join(bibleDirectory, "verses.ndjson")

  if (fs.existsSync(ndjsonPath)) {
    const content = fs.readFileSync(ndjsonPath, "utf8")

    for (const line of content.split(/\r?\n/)) {
      if (line) {
        callback(parseVerseLine(line))
      }
    }

    return
  }

  for (const rawVerse of readJsonFile<Record<string, unknown>[]>("verses.json", [])) {
    callback(normalizeVerse(rawVerse))
  }
}

function searchReferenceVerses(normalizedQuery: string) {
  const referenceMatch = normalizedQuery.match(/^(.+?)\s+(\d{1,3})(?::(\d{1,3}))?$/)

  if (!referenceMatch) {
    return null
  }

  const [, bookPart, chapterText, verseText] = referenceMatch
  const chapterNumber = Number(chapterText)
  const verseNumber = verseText ? Number(verseText) : null
  const books = getBibleBooks()
  const exactBooks = books.filter((book) => {
    const normalizedBookName = normalizeSearchText(book.name)
    const normalizedBookId = normalizeSearchText(book.id)

    return normalizedBookName === bookPart || normalizedBookId === bookPart
  })
  const matchingBooks =
    exactBooks.length > 0
      ? exactBooks
      : books.filter((book) => {
          const normalizedBookName = normalizeSearchText(book.name)
          const normalizedBookId = normalizeSearchText(book.id)

          return (
            normalizedBookName.includes(bookPart) ||
            normalizedBookId.includes(bookPart)
          )
        })

  return matchingBooks.flatMap((book) =>
    getVersesForChapter(book.id, chapterNumber).filter(
      (verse) => verseNumber === null || verse.verse === verseNumber,
    ),
  )
}

function searchIndexedVerses(
  cleanQuery: string,
  normalizedQuery: string,
  boundedLimit: number,
): BibleSearchResponse | null {
  const index = readVerseSearchIndex()

  if (!index?.records?.length) {
    return null
  }

  const words = normalizedQuery.split(/\s+/).filter(Boolean)
  const results: BibleSearchResult[] = []
  let total = 0

  for (const record of index.records) {
    const searchText = record[9]

    if (words.every((word) => searchText.includes(word))) {
      total += 1

      if (results.length < boundedLimit) {
        results.push(searchRecordToResult(record))
      }
    }
  }

  return {
    query: cleanQuery,
    total,
    limit: boundedLimit,
    limited: total > boundedLimit,
    results,
  }
}

export function getBibleTranslation() {
  return readJsonFile<BibleTranslation>("translation.json", {})
}

export function getBibleBooks() {
  const rawBooks = readJsonFile<Record<string, unknown>[]>("books.json", [])
  return sortByCanonicalOrder(rawBooks.map(normalizeBook))
}

export function getOldTestamentBooks() {
  return getBibleBooks().filter((book) => book.testament === "OT")
}

export function getNewTestamentBooks() {
  return getBibleBooks().filter((book) => book.testament === "NT")
}

export function getBookById(bookId: string) {
  const normalizedBookId = bookId.toUpperCase()
  return getBibleBooks().find((book) => book.id.toUpperCase() === normalizedBookId)
}

export function getChaptersForBook(bookId: string) {
  const normalizedBookId = bookId.toUpperCase()
  const rawChapters = readJsonFile<Record<string, unknown>[]>("chapters.json", [])

  return rawChapters
    .map(normalizeChapter)
    .filter((chapter) => chapter.book_id.toUpperCase() === normalizedBookId)
    .sort((a, b) => a.chapter - b.chapter)
}

export function getVersesForChapter(bookId: string, chapterNumber: number) {
  const normalizedBookId = bookId.toUpperCase()
  const cacheKey = chapterCacheKey(normalizedBookId, chapterNumber)

  if (chapterVerseCache.has(cacheKey)) {
    return chapterVerseCache.get(cacheKey) as BibleVerse[]
  }

  const indexedVerses = readVersesForChapterFromIndex(
    normalizedBookId,
    chapterNumber,
  )

  if (indexedVerses) {
    chapterVerseCache.set(cacheKey, indexedVerses)
    return indexedVerses
  }

  const verses = readJsonFile<Record<string, unknown>[]>("verses.json", [])
    .map(normalizeVerse)
    .filter(
      (verse) =>
        verse.book_id.toUpperCase() === normalizedBookId &&
        verse.chapter === chapterNumber,
    )
    .sort((a, b) => a.verse - b.verse)

  chapterVerseCache.set(cacheKey, verses)
  return verses
}

export function getIntroductionsForBook(
  bookId: string,
  chapterNumber?: number,
) {
  const normalizedBookId = bookId.toUpperCase()
  const introductions = readJsonFile<Record<string, unknown>[]>(
    "introductions.json",
    [],
  )

  return introductions
    .map(normalizeIntroduction)
    .filter((introduction) => {
      if (introduction.book_id.toUpperCase() !== normalizedBookId) {
        return false
      }

      if (chapterNumber === undefined) {
        return introduction.anchor_chapter === null
      }

      return (
        introduction.anchor_chapter === null ||
        introduction.anchor_chapter === chapterNumber
      )
    })
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

export function searchVerses(
  query: string,
  limit = BIBLE_SEARCH_LIMIT,
): BibleSearchResponse {
  const cleanQuery = query.trim()
  const normalizedQuery = normalizeSearchText(cleanQuery)
  const boundedLimit = Math.min(Math.max(limit, 1), 100)

  if (!normalizedQuery) {
    return {
      query: cleanQuery,
      total: 0,
      limit: boundedLimit,
      limited: false,
      results: [],
    }
  }

  const referenceVerses = searchReferenceVerses(normalizedQuery)

  if (referenceVerses) {
    const results = referenceVerses.slice(0, boundedLimit).map(toSearchResult)

    return {
      query: cleanQuery,
      total: referenceVerses.length,
      limit: boundedLimit,
      limited: referenceVerses.length > boundedLimit,
      results,
    }
  }

  const indexedResponse = searchIndexedVerses(
    cleanQuery,
    normalizedQuery,
    boundedLimit,
  )

  if (indexedResponse) {
    return indexedResponse
  }

  const words = normalizedQuery.split(/\s+/).filter(Boolean)
  const results: BibleSearchResult[] = []
  let total = 0

  forEachBibleVerse((verse) => {
    const searchableText = normalizeSearchText(
      [
        verse.reference,
        verse.book_id,
        verse.book_name,
        verse.chapter,
        verse.verse,
        verse.text,
      ].join(" "),
    )

    if (words.every((word) => searchableText.includes(word))) {
      total += 1

      if (results.length < boundedLimit) {
        results.push(toSearchResult(verse))
      }
    }
  })

  return {
    query: cleanQuery,
    total,
    limit: boundedLimit,
    limited: total > boundedLimit,
    results,
  }
}
