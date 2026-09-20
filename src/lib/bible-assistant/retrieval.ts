import {
  getBibleBooks,
  getBibleTranslation,
  getVersesForChapter,
  rankBibleVerses,
} from "@/lib/bible-data"
import { getBibleVerseHref } from "@/lib/bible-reference"
import type { BibleAssistantHistoryTurn, BibleCitation } from "./types"

export function normalizeBibleQuestion(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
}

const stopWords = new Set(
  "a au aux avec ce ces cet cette comme comment comprend comprendre contient dans de des du elle en est et etre etait fait il ils je l la le les leur lui m ma me mes moi mon ne nous on ou par parle parlent parler passage passages peu peut plus pour pourquoi qu quand que quel quelle quelles quels qui quoi s sa se selon ses son sont sur t ta te tes toi ton trouve tu un une vers verset versets votre vous y bible biblique bibliques christianisme chretien chretiens dit dire dis donne montre montre-moi sujet histoire nouveau ancien testament livres livre combien voici explique explique-moi aussi maintenant raconte connait savoir voudrais veux merci".split(
    /\s+/,
  ),
)

// Vocabulary expansion only. No external facts, answers, authorship lists or verse mappings.
const vocabulary = [
  ["amour", "aimer", "aime", "aimes", "aimez", "aimons", "aiment", "charite"],
  [
    "pardon",
    "pardonner",
    "pardonne",
    "pardonnez",
    "pardonnes",
    "pardonnant",
    "pardonnera",
    "pardonnerai",
  ],
  [
    "peur",
    "crainte",
    "craindre",
    "crains",
    "craignez",
    "effroi",
    "inquiete",
    "inquiets",
    "inquietez",
    "inquietude",
  ],
  [
    "resurrection",
    "ressuscite",
    "ressusciter",
    "ressuscita",
    "ressuscitera",
    "ressuscites",
  ],
  ["foi", "croire", "croit", "croyez", "croyons", "croyant", "croyants"],
  ["priere", "prier", "priez", "prie", "prieres"],
  ["espoir", "esperance", "esperer", "espere"],
  ["frere", "freres"],
  ["soeur", "soeurs"],
  ["enfant", "enfants"],
  ["trahi", "trahir", "livre", "livra", "livrer"],
]

export function questionTerms(question: string) {
  const normalized = normalizeBibleQuestion(question).replace(/œ/g, "oe")
  const words: string[] = normalized.match(/[a-z]+/g) ?? []
  const groups: string[][] = []
  for (const word of words) {
    if (word.length < 3 || stopWords.has(word)) continue
    if (
      (word === "christ" && words.includes("jesus")) ||
      (word === "apotre" && words.includes("paul"))
    )
      continue
    const familyOfMoses = words.some((item) =>
      ["moise", "aaron"].includes(item),
    )
    const aliases =
      familyOfMoses && ["marie", "miriam"].includes(word)
        ? ["marie", "miriam"]
        : undefined
    const singular =
      word.length > 4 &&
      word.endsWith("s") &&
      !["jesus", "moises", "thomas", "judas", "christ"].includes(word)
        ? word.slice(0, -1)
        : word
    const group = aliases ??
      vocabulary.find((items) => items.includes(word)) ?? [
        ...new Set([word, singular, `${singular}s`]),
      ]
    if (!groups.some((items) => items.includes(word)))
      groups.push([word, ...group.filter((item) => item !== word)])
  }
  return groups.slice(0, 8)
}

export type BiblePassageReference =
  BibleAssistantHistoryTurn["references"][number]

// All proposed references (including conversation references) go through the same corpus lookup.
export function verifyBibleReference(
  reference: BiblePassageReference,
): BibleCitation | null {
  const name = normalizeBibleQuestion(reference.book).trim()
  const book = getBibleBooks().find((candidate) =>
    [
      candidate.id,
      candidate.name,
      candidate.name_english,
      ...(candidate.id === "PSA" ? ["psaume"] : []),
    ].some((alias) => alias && normalizeBibleQuestion(alias) === name),
  )
  if (
    !book ||
    !Number.isInteger(reference.chapter) ||
    reference.chapter < 1 ||
    reference.chapter > book.chapter_count ||
    reference.verses.length > 180 ||
    reference.verses.some(
      (verse) => !Number.isInteger(verse) || verse < 1 || verse > 180,
    )
  )
    return null
  const chapter = getVersesForChapter(book.id, reference.chapter)
  if (
    !chapter.length ||
    reference.verses.some(
      (number) => !chapter.some((verse) => verse.verse === number),
    )
  )
    return null
  const selected = reference.verses.length
    ? chapter.filter((verse) => reference.verses.includes(verse.verse))
    : chapter
  const verses = reference.verses.length
    ? selected.map((verse) => verse.verse)
    : []
  return {
    id: "",
    label: `${book.name} ${reference.chapter}${verses.length ? `:${selectionLabel(verses)}` : ""}`,
    text: selected.map((verse) => verse.text).join("\n"),
    bookId: book.id,
    chapter: reference.chapter,
    verses,
    href: getBibleVerseHref({
      book_id: book.id,
      chapter: reference.chapter,
      verses,
    }),
  }
}

export type BibleRetrievalPlan = {
  standaloneQuestion: string
  keywords: string[]
  references: BiblePassageReference[]
}

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, (match) => `\\${match}`)
}

export function extractBibleReferences(text: string) {
  const books = getBibleBooks()
  const aliases = new Map<string, string>()
  for (const book of books) {
    for (const name of [book.name, book.id, book.name_english]) {
      if (name) aliases.set(normalizeBibleQuestion(name), book.id)
    }
  }
  aliases.set("psaume", "PSA")
  const names = [...aliases.keys()]
    .sort((a, b) => b.length - a.length)
    .map(escapePattern)
  const pattern = new RegExp(
    `(?<![a-z0-9])(${names.join("|")})\\s+(\\d+)(?:\\s*:\\s*(\\d+(?:\\s*[-–]\\s*\\d+)?(?:\\s*,\\s*\\d+(?:\\s*[-–]\\s*\\d+)?)*))?`,
    "g",
  )
  return [...normalizeBibleQuestion(text).matchAll(pattern)]
    .slice(0, 8)
    .map((match) => {
      const verses: number[] = []
      for (const part of match[3]?.split(",") ?? []) {
        const [start, end = start] = part.split(/[-–]/).map(Number)
        if (start < 1 || end < start || end > 180)
          return {
            bookId: aliases.get(match[1])!,
            chapter: Number(match[2]),
            verses: [-1],
          }
        for (let verse = start; verse <= end; verse++) verses.push(verse)
      }
      return {
        bookId: aliases.get(match[1])!,
        chapter: Number(match[2]),
        verses: [...new Set(verses)],
      }
    })
}

function selectionLabel(verses: number[]) {
  const parts: string[] = []
  for (let i = 0; i < verses.length; i++) {
    const start = verses[i]
    let end = start
    while (verses[i + 1] === end + 1) end = verses[++i]
    parts.push(start === end ? String(start) : `${start}-${end}`)
  }
  return parts.join(", ")
}

export function retrieveBibleContext(
  question: string,
  plan?: BibleRetrievalPlan,
) {
  const books = getBibleBooks()
  const query = plan?.standaloneQuestion ?? question
  const normalized = normalizeBibleQuestion(query)
  const explicitReferences = extractBibleReferences(question)
  const sources: BibleCitation[] = []
  let characters = 0
  let verseCount = 0
  const append = (
    bookId: string,
    chapter: number,
    numbers: number[],
    wholeChapter = false,
  ) => {
    let source = verifyBibleReference({
      book: bookId,
      chapter,
      verses: wholeChapter ? [] : numbers,
    })
    if (!source) return
    let selected = source.verses?.length
      ? source.verses
      : getVersesForChapter(source.bookId!, chapter).map((verse) => verse.verse)
    // Long chapters stay readable via the existing reader; the model gets a precisely labelled excerpt.
    if (selected.length > 30) {
      selected = selected.slice(0, 30)
      source = verifyBibleReference({
        book: source.bookId!,
        chapter,
        verses: selected,
      })!
    }
    const count = selected.length
    if (
      characters + source.text.length > 20000 ||
      sources.length >= 10 ||
      verseCount + count > 80
    )
      return
    if (sources.some((existing) => existing.href === source.href)) return
    characters += source.text.length
    verseCount += count
    sources.push({ ...source, id: `P${sources.length + 1}` })
  }
  for (const reference of explicitReferences)
    append(
      reference.bookId,
      reference.chapter,
      reference.verses,
      !reference.verses.length,
    )
  for (const reference of plan?.references ?? [])
    append(
      reference.book,
      reference.chapter,
      reference.verses,
      !reference.verses.length,
    )
  if (!explicitReferences.length) {
    const groups = questionTerms([query, ...(plan?.keywords ?? [])].join(" "))
    if (
      groups.length === 1 &&
      /\b(qui etait|qui est|parle moi|histoire de)\b/.test(
        normalizeBibleQuestion(query),
      )
    ) {
      groups.push([
        "homme",
        "fils",
        "roi",
        "serviteur",
        "prophete",
        "ne",
        "naquit",
        "appele",
      ])
    }
    const ranked = rankBibleVerses(groups, 60)
    if (/\b(dit|parle|paroles)\b/.test(normalized)) {
      const speech = (text: string) =>
        Number(
          /\b(dit|dis|disait|repondit|repond)\b/.test(
            normalizeBibleQuestion(text),
          ),
        )
      ranked.sort((a, b) => speech(b.text) - speech(a.text))
    }
    const chapterHits = new Map<string, number>()
    const bookHits = new Map<string, number>()
    for (const verse of ranked) {
      if (
        plan?.references.length &&
        sources.length >= Math.max(6, plan.references.length)
      )
        break
      const key = `${verse.book_id}:${verse.chapter}`
      if (
        (chapterHits.get(key) ?? 0) >= 1 ||
        (bookHits.get(verse.book_id) ?? 0) >= 3 ||
        sources.some(
          (source) =>
            source.bookId === verse.book_id && source.chapter === verse.chapter,
        )
      )
        continue
      chapterHits.set(key, 1)
      bookHits.set(verse.book_id, (bookHits.get(verse.book_id) ?? 0) + 1)
      const context = getVersesForChapter(verse.book_id, verse.chapter).filter(
        (candidate) =>
          candidate.verse >= verse.verse - 2 &&
          candidate.verse <= verse.verse + 2,
      )
      append(
        verse.book_id,
        verse.chapter,
        context.map((candidate) => candidate.verse),
      )
    }
  }
  // Counts and book names come from the installed edition, never from model memory.
  if (
    /\b(livres?|testament|chapitres?|combien|bible contient)\b/.test(normalized)
  ) {
    const translation = getBibleTranslation()
    const lines = [
      `Édition : ${translation.name ?? translation.abbreviation ?? "Bible locale"}.`,
      `La Bible disponible contient ${books.length} livres.`,
    ]
    for (const [testament, label] of [
      ["OT", "Ancien Testament"],
      ["NT", "Nouveau Testament"],
    ] as const) {
      const selected = books.filter((book) => book.testament === testament)
      lines.push(
        `${label} : ${selected.length} livres. ${selected.map((book) => `${book.name} (${book.chapter_count} chapitres)`).join(" ; ")}.`,
      )
    }
    sources.push({
      id: "CATALOGUE",
      label: "Sommaire de la Bible",
      text: lines.join("\n"),
      href: null,
    })
  }
  return sources
}
