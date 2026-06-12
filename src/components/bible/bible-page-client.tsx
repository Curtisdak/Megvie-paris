"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react"
import {
  BookOpen,
  ChevronLeft,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getBibleVerseHref } from "@/lib/bible-reference"
import { cn } from "@/lib/utils"
import type {
  BibleBook,
  BibleChapter,
  BibleCrossReference,
  BibleFootnote,
  BibleIntroduction,
  BibleSearchResponse,
  BibleSearchResult,
  BibleVerse,
} from "@/lib/bible-data"

type BibleTab = "old" | "new" | "search"

type BiblePageClientProps = {
  oldTestamentBooks: BibleBook[]
  newTestamentBooks: BibleBook[]
  translationName: string
}

type ChapterPayload = {
  book: BibleBook
  chapter: BibleChapter
  chapters: BibleChapter[]
  introductions: BibleIntroduction[]
  verses: BibleVerse[]
}

type ChapterState =
  | { status: "idle" | "loading"; data: null; error: null }
  | { status: "success"; data: ChapterPayload; error: null }
  | { status: "error"; data: null; error: string }

type SearchState =
  | { status: "idle" | "loading"; data: null; error: null }
  | { status: "success"; data: BibleSearchResponse; error: null }
  | { status: "error"; data: null; error: string }

const tabs: { id: BibleTab; label: string }[] = [
  { id: "old", label: "Ancien Testament" },
  { id: "new", label: "Nouveau Testament" },
  { id: "search", label: "Recherche" },
]

const initialChapterState: ChapterState = {
  status: "idle",
  data: null,
  error: null,
}

const initialSearchState: SearchState = {
  status: "idle",
  data: null,
  error: null,
}

function isValidChapterNumber(value: number) {
  return Number.isInteger(value) && value > 0
}

function updateBibleUrl(
  bookId: string,
  chapterNumber: number,
  verseNumber: number | null,
) {
  if (typeof window === "undefined") {
    return
  }

  window.history.pushState(
    null,
    "",
    getBibleVerseHref({
      book_id: bookId,
      chapter: chapterNumber,
      verse: verseNumber,
    }),
  )
}

export function BiblePageClient({
  oldTestamentBooks,
  newTestamentBooks,
  translationName,
}: BiblePageClientProps) {
  const [activeTab, setActiveTab] = useState<BibleTab>("old")
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [highlightVerse, setHighlightVerse] = useState<number | null>(null)
  const [chapterState, setChapterState] =
    useState<ChapterState>(initialChapterState)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchState, setSearchState] =
    useState<SearchState>(initialSearchState)

  const allBooks = useMemo(
    () => [...oldTestamentBooks, ...newTestamentBooks],
    [oldTestamentBooks, newTestamentBooks],
  )

  const visibleBooks =
    activeTab === "old" ? oldTestamentBooks : newTestamentBooks

  const selectedBook = selectedBookId
    ? allBooks.find((book) => book.id === selectedBookId)
    : null

  const openBook = useCallback(
    (
      bookId: string,
      chapterNumber = 1,
      verseNumber: number | null = null,
      shouldUpdateUrl = true,
    ) => {
      setSelectedBookId(bookId)
      setSelectedChapter(chapterNumber)
      setHighlightVerse(verseNumber)

      if (shouldUpdateUrl) {
        updateBibleUrl(bookId, chapterNumber, verseNumber)
      }
    },
    [],
  )

  const closeBook = () => {
    setSelectedBookId(null)
    setSelectedChapter(1)
    setHighlightVerse(null)
    setChapterState(initialChapterState)

    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/bible")
    }
  }

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search)
      const bookId = params.get("book")
      const chapterParam = Number(params.get("chapter") ?? "1")
      const verseParam = Number(params.get("verse"))
      const reference = params.get("ref")

      if (bookId && isValidChapterNumber(chapterParam)) {
        openBook(
          bookId.toUpperCase(),
          chapterParam,
          Number.isInteger(verseParam) && verseParam > 0 ? verseParam : null,
          false,
        )
        return
      }

      if (!reference) {
        return
      }

      const openReference = async () => {
        try {
          const response = await fetch(
            `/api/bible/search?q=${encodeURIComponent(reference)}&limit=1`,
          )
          const data = (await response.json()) as BibleSearchResponse
          const result = data.results[0]

          if (result) {
            openBook(result.book_id, result.chapter, result.verse, false)
          }
        } catch (error) {
          console.error("Unable to open Bible reference", error)
        }
      }

      void openReference()
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [openBook])

  useEffect(() => {
    if (!selectedBookId) {
      return
    }

    const controller = new AbortController()
    const bookId = selectedBookId

    async function loadChapter() {
      setChapterState({ status: "loading", data: null, error: null })

      try {
        const response = await fetch(
          `/api/bible/chapter?bookId=${encodeURIComponent(bookId)}&chapter=${selectedChapter}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string
          } | null
          throw new Error(
            payload?.error ?? "Impossible de charger ce chapitre.",
          )
        }

        const data = (await response.json()) as ChapterPayload
        setChapterState({ status: "success", data, error: null })
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setChapterState({
          status: "error",
          data: null,
          error:
            error instanceof Error
              ? error.message
              : "Impossible de charger ce chapitre.",
        })
      }
    }

    loadChapter()

    return () => controller.abort()
  }, [selectedBookId, selectedChapter])

  useEffect(() => {
    if (chapterState.status !== "success" || !highlightVerse) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      document
        .getElementById(`bible-verse-${highlightVerse}`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" })
    }, 120)

    return () => window.clearTimeout(timeoutId)
  }, [chapterState.status, highlightVerse, selectedChapter])

  const performSearch = useCallback(
    async (query: string, signal?: AbortSignal) => {
      const cleanQuery = query.trim()

      if (cleanQuery.length < 2) {
        setSearchState(initialSearchState)
        return
      }

      setSearchState({ status: "loading", data: null, error: null })

      try {
        const response = await fetch(
          `/api/bible/search?q=${encodeURIComponent(cleanQuery)}`,
          { signal },
        )

        if (!response.ok) {
          throw new Error("Impossible de rechercher dans la Bible.")
        }

        const data = (await response.json()) as BibleSearchResponse
        setSearchState({ status: "success", data, error: null })
      } catch (error) {
        if (signal?.aborted) {
          return
        }

        setSearchState({
          status: "error",
          data: null,
          error:
            error instanceof Error
              ? error.message
              : "Impossible de rechercher dans la Bible.",
        })
      }
    },
    [],
  )

  useEffect(() => {
    const cleanQuery = searchQuery.trim()

    if (cleanQuery.length < 2) {
      setSearchState(initialSearchState)
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      performSearch(cleanQuery, controller.signal)
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [performSearch, searchQuery])

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    performSearch(searchQuery)
  }

  const handleSearchResultClick = (result: BibleSearchResult) => {
    openBook(result.book_id, result.chapter, result.verse)
  }

  if (selectedBook) {
    return (
      <BookDetailView
        chapterState={chapterState}
        highlightVerse={highlightVerse}
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        translationName={translationName}
        onBack={closeBook}
        onChapterSelect={(chapterNumber) => {
          openBook(selectedBook.id, chapterNumber, null)
        }}
        onVerseReferenceClick={(verse) => {
          openBook(verse.book_id, verse.chapter, verse.verse)
        }}
      />
    )
  }

  return (
    <section className="space-y-6">
      <div
        className="sticky top-[4.5rem] z-20 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.25rem] gap-1 rounded-[1.35rem] border border-zinc-200/80 bg-white/90 p-1.5 shadow-sm backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/85 sm:grid-cols-3 sm:gap-2 sm:rounded-full"
        role="tablist"
        aria-label="Sections de la Bible"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              className={cn(
                "flex min-h-11 min-w-0 items-center justify-center rounded-full px-2 py-2 text-center text-[0.72rem] font-semibold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:px-4 sm:text-sm",
                tab.id === "search" && "px-0 sm:px-0",
                isActive
                  ? "bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950"
                  : "text-zinc-600 hover:bg-amber-50 dark:text-zinc-300 dark:hover:bg-amber-400/10",
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.id === "search" ? (
                <>
                  <Search className="h-5 w-5" aria-hidden />
                  <span className="sr-only">{tab.label}</span>
                </>
              ) : (
                <span>{tab.label}</span>
              )}
            </button>
          )
        })}
      </div>

      {activeTab === "search" ? (
        <SearchPanel
          searchQuery={searchQuery}
          searchState={searchState}
          onQueryChange={setSearchQuery}
          onResultClick={handleSearchResultClick}
          onSubmit={handleSearchSubmit}
        />
      ) : (
        <BookGrid
          books={visibleBooks}
          onBookSelect={(book) => openBook(book.id, 1)}
        />
      )}
    </section>
  )
}

function BookGrid({
  books,
  onBookSelect,
}: {
  books: BibleBook[]
  onBookSelect: (book: BibleBook) => void
}) {
  return (
    <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <button
          key={book.id}
          type="button"
          className="group flex min-h-20 items-center justify-between gap-4 border-b border-zinc-200/80 py-4 text-left transition hover:border-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-zinc-800/80"
          onClick={() => onBookSelect(book)}
        >
          <span className="min-w-0">
            <span className="block text-lg font-semibold text-zinc-900 transition group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-200">
              {book.name}
            </span>
            <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">
              {book.chapter_count} chapitres - {book.verse_count} versets
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-200">
            {String(book.book_number).padStart(2, "0")}
            <BookOpen className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </button>
      ))}
    </div>
  )
}

function SearchPanel({
  searchQuery,
  searchState,
  onQueryChange,
  onResultClick,
  onSubmit,
}: {
  searchQuery: string
  searchState: SearchState
  onQueryChange: (value: string) => void
  onResultClick: (result: BibleSearchResult) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div>
      <form
        className="w-full"
        onSubmit={onSubmit}
        role="search"
      >
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Rechercher un verset ou un mot-cle"
            className="h-12 rounded-full border-zinc-200 bg-white pl-5 pr-14 text-base shadow-sm dark:border-zinc-700 dark:bg-zinc-950/50"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-950 text-white shadow-sm transition hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-amber-300"
            aria-label="Rechercher dans la Bible"
          >
            <Search className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </form>

      <div className="mt-5">
        {searchState.status === "idle" ? (
          <div className="border-l-4 border-amber-500 bg-amber-50/70 px-5 py-4 text-sm leading-6 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100">
            Essayez une recherche comme <strong>amour</strong>,{" "}
            <strong>Jean 3</strong>, <strong>Jean 3:16</strong> ou{" "}
            <strong>Psaumes</strong>.
          </div>
        ) : null}

        {searchState.status === "loading" ? (
          <LoadingPanel label="Recherche en cours..." />
        ) : null}

        {searchState.status === "error" ? (
          <ErrorPanel message={searchState.error} />
        ) : null}

        {searchState.status === "success" ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 border-b border-zinc-200 pb-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {searchState.data.total} resultat
                {searchState.data.total > 1 ? "s" : ""} pour{" "}
                <strong className="text-zinc-900 dark:text-white">
                  {searchState.data.query}
                </strong>
              </span>
              {searchState.data.limited ? (
                <span className="font-medium text-amber-700 dark:text-amber-200">
                  Affichage des {searchState.data.limit} premiers resultats
                </span>
              ) : null}
            </div>

            {searchState.data.results.length > 0 ? (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {searchState.data.results.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="w-full py-5 text-left transition hover:bg-amber-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:bg-amber-400/10"
                    onClick={() => onResultClick(result)}
                  >
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">
                      {result.reference}
                    </p>
                    <p className="mt-2 text-base leading-7 text-zinc-800 dark:text-zinc-100">
                      {result.text}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="border-l-4 border-zinc-300 bg-white/60 px-5 py-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
                Aucun verset trouve pour cette recherche.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function BookDetailView({
  chapterState,
  highlightVerse,
  selectedBook,
  selectedChapter,
  translationName,
  onBack,
  onChapterSelect,
  onVerseReferenceClick,
}: {
  chapterState: ChapterState
  highlightVerse: number | null
  selectedBook: BibleBook
  selectedChapter: number
  translationName: string
  onBack: () => void
  onChapterSelect: (chapterNumber: number) => void
  onVerseReferenceClick: (verse: BibleVerse) => void
}) {
  const chapters = chapterState.data?.chapters ?? []

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Button
            type="button"
            variant="ghost"
            className="mb-4 rounded-full text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            onClick={onBack}
          >
            <ChevronLeft className="h-4 w-4" />
            Retour aux livres
          </Button>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            {translationName}
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-white sm:text-4xl">
            {selectedBook.name}
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {selectedBook.chapter_count} chapitres - {selectedBook.verse_count}{" "}
            versets
          </p>
        </div>

        <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-100">
          Chapitre selectionne:{" "}
          <span className="font-semibold">{selectedChapter}</span>
        </div>
      </div>

      {chapterState.status === "loading" ? (
        <LoadingPanel label="Chargement du chapitre..." />
      ) : null}

      {chapterState.status === "error" ? (
        <ErrorPanel message={chapterState.error} />
      ) : null}

      {chapterState.status === "success" ? (
        <>
          <div className="border-y border-zinc-200 py-5 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              Choisir un chapitre
            </p>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {chapters.map((chapter) => {
                const isActive = chapter.chapter === selectedChapter

                return (
                  <button
                    key={chapter.id}
                    type="button"
                    className={cn(
                      "min-h-10 min-w-10 rounded-full border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                      isActive
                        ? "border-amber-500 bg-amber-600 text-white shadow-sm"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-amber-200 hover:bg-amber-50 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-200 dark:hover:border-amber-300/30 dark:hover:bg-amber-300/10",
                    )}
                    onClick={() => onChapterSelect(chapter.chapter)}
                    aria-current={isActive ? "true" : undefined}
                  >
                    {chapter.chapter}
                  </button>
                )
              })}
            </div>
          </div>

          <IntroductionsPanel introductions={chapterState.data.introductions} />

          <VerseList
            highlightVerse={highlightVerse}
            onReferenceClick={onVerseReferenceClick}
            verses={chapterState.data.verses}
          />
        </>
      ) : null}
    </section>
  )
}

function IntroductionsPanel({
  introductions,
}: {
  introductions: BibleIntroduction[]
}) {
  if (introductions.length === 0) {
    return null
  }

  return (
    <details
      className="border-l-4 border-amber-500 bg-amber-50/70 px-5 py-4 dark:bg-amber-400/10"
    >
      <summary className="cursor-pointer text-sm font-semibold text-amber-900 dark:text-amber-100">
        Introduction
      </summary>
      <div className="mt-4 space-y-3 text-sm leading-7 text-amber-950 dark:text-amber-50">
        {introductions.map((introduction) => (
          <p key={introduction.id}>{introduction.text}</p>
        ))}
      </div>
    </details>
  )
}

function VerseList({
  highlightVerse,
  onReferenceClick,
  verses,
}: {
  highlightVerse: number | null
  onReferenceClick: (verse: BibleVerse) => void
  verses: BibleVerse[]
}) {
  const verseEntries = useMemo(() => getVerseEntries(verses), [verses])

  return (
    <div className="space-y-2">
      {verseEntries.map(({ headings, shouldShowHeadings, verse }) => {
        const crossReferences = [
          ...(verse.section_cross_references ?? []),
          ...(verse.cross_references ?? []),
        ]
        const footnotes = verse.footnotes ?? []
        const isHighlighted = highlightVerse === verse.verse

        return (
          <div key={verse.id} className="space-y-3">
            {shouldShowHeadings ? (
              <div className="pt-6">
                <div className="space-y-2">
                  {headings.map((heading) => (
                    <p
                      key={heading}
                      className="border-l-4 border-amber-500 pl-4 text-sm font-semibold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-100"
                    >
                      {heading}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <article
              id={`bible-verse-${verse.verse}`}
              className={cn(
                "border-b border-zinc-200 py-5 transition dark:border-zinc-800",
                isHighlighted
                  ? "bg-amber-50/80 px-4 dark:bg-amber-400/10"
                  : "bg-transparent",
              )}
            >
              <div className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-100">
                  {verse.verse}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base leading-8 text-zinc-800 dark:text-zinc-100 sm:text-lg">
                    {verse.text}
                  </p>
                  <button
                    type="button"
                    className="mt-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 underline-offset-4 transition hover:text-amber-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-200"
                    onClick={() => onReferenceClick(verse)}
                  >
                    {verse.reference}
                  </button>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                    {verse.book_id} - Chapitre {verse.chapter}, verset{" "}
                    {verse.verse}
                  </p>

                  <VerseMetadata
                    crossReferences={crossReferences}
                    footnotes={footnotes}
                  />
                </div>
              </div>
            </article>
          </div>
        )
      })}
    </div>
  )
}

function VerseMetadata({
  crossReferences,
  footnotes,
}: {
  crossReferences: BibleCrossReference[]
  footnotes: BibleFootnote[]
}) {
  if (crossReferences.length === 0 && footnotes.length === 0) {
    return null
  }

  return (
    <div className="mt-4 space-y-2">
      {crossReferences.length > 0 ? (
        <details className="border-l border-zinc-200 pl-3 dark:border-zinc-800">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            References croisees ({crossReferences.length})
          </summary>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {crossReferences.map((reference, index) => (
              <li key={reference.id ?? `${reference.target_text}-${index}`}>
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {reference.origin_text || reference.source_reference}
                </span>
                {reference.origin_text || reference.source_reference
                  ? " : "
                  : null}
                {reference.target_text}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {footnotes.length > 0 ? (
        <details className="border-l border-zinc-200 pl-3 dark:border-zinc-800">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Notes ({footnotes.length})
          </summary>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {footnotes.map((footnote, index) => (
              <li key={footnote.id ?? `${footnote.text}-${index}`}>
                {footnote.reference ? (
                  <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                    {footnote.reference}:{" "}
                  </span>
                ) : null}
                {footnote.text}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}

function getVerseEntries(verses: BibleVerse[]) {
  let previousHeadingKey = ""

  return verses.map((verse) => {
    const headings = getVerseHeadings(verse)
    const headingKey = headings.join("|")
    const shouldShowHeadings =
      headingKey.length > 0 && headingKey !== previousHeadingKey

    if (headingKey.length > 0) {
      previousHeadingKey = headingKey
    }

    return {
      headings,
      shouldShowHeadings,
      verse,
    }
  })
}

function getVerseHeadings(verse: BibleVerse) {
  const headings = [
    ...(verse.headings ?? [])
      .map((heading) => heading.text)
      .filter((heading): heading is string => Boolean(heading?.trim())),
    verse.section_heading ?? "",
  ]

  return [...new Set(headings.map((heading) => heading.trim()).filter(Boolean))]
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="mt-6 flex items-center justify-center gap-3 rounded-3xl border border-zinc-200 bg-white p-6 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-300">
      <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
      {label}
    </div>
  )
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100">
      {message}
    </div>
  )
}

export function BibleFeatureBadges() {
  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
      {["66 livres", "31 170 versets", "Recherche locale"].map((item) => (
        <div
          key={item}
          className="flex items-center gap-3 border-b border-zinc-200 py-3 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
        >
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-200" />
          {item}
        </div>
      ))}
    </div>
  )
}
