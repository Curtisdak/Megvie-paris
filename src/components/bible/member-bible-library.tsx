"use client"

import {
  useDeferredValue,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react"
import Link from "next/link"
import { BookOpen, Loader2, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { deleteBibleNoteAction, removeBibleFavoriteAction } from "@/lib/bible-actions"
import { getBibleVerseHref } from "@/lib/bible-reference"
import { VerseShareDialog } from "@/components/bible/verse-share-dialog"

type FavoriteItem = {
  id: string
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
  reference: string
  verseTextSnapshot: string
  translation: string
  createdAt: Date
}

type NoteItem = {
  id: string
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
  reference: string
  content: string
  translation: string
  updatedAt: Date
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function favoriteHref(item: FavoriteItem | NoteItem) {
  return getBibleVerseHref({
    book_id: item.book,
    chapter: item.chapter,
    verse: item.verseStart,
  })
}

export function FavoriteVersesLibrary({
  items,
}: {
  items: FavoriteItem[]
}) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<"recent" | "reference">("recent")
  const deferredQuery = useDeferredValue(query)
  const [isPending, startTransition] = useTransition()
  const [optimisticItems, removeOptimistic] = useOptimistic(
    items,
    (current, removedId: string) => current.filter((item) => item.id !== removedId),
  )
  const visibleItems = useMemo(() => {
    const normalizedQuery = normalize(deferredQuery.trim())
    const filtered = normalizedQuery
      ? optimisticItems.filter((item) =>
          normalize(
            `${item.reference} ${item.verseTextSnapshot} ${item.book}`,
          ).includes(normalizedQuery),
        )
      : optimisticItems

    return [...filtered].sort((a, b) => {
      if (sort === "reference") {
        return (
          a.book.localeCompare(b.book) ||
          a.chapter - b.chapter ||
          a.verseStart - b.verseStart
        )
      }

      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  }, [deferredQuery, optimisticItems, sort])

  const removeFavorite = (id: string) => {
    startTransition(async () => {
      removeOptimistic(id)
      const formData = new FormData()
      formData.set("favoriteId", id)
      const result = await removeBibleFavoriteAction(formData)

      if (!result.ok) {
        toast.error("Favori non supprime", { description: result.message })
      } else {
        toast.success(result.message)
      }
    })
  }

  return (
    <BibleLibraryShell
      count={visibleItems.length}
      emptyLabel="Aucun verset favori pour le moment."
      query={query}
      setQuery={setQuery}
      sort={sort}
      setSort={setSort}
      title="Versets favoris"
    >
      {visibleItems.map((item) => (
        <article
          key={item.id}
          className="rounded-[1.35rem] border border-zinc-200 bg-white/95 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
                {item.reference}
              </p>
              <p className="mt-3 text-base leading-7 text-zinc-800 dark:text-zinc-100">
                {item.verseTextSnapshot}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                {item.translation}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-full">
                <Link href={favoriteHref(item)}>
                  <BookOpen className="h-4 w-4" aria-hidden />
                  Ouvrir
                </Link>
              </Button>
              <VerseShareDialog
                compact
                href={favoriteHref(item)}
                reference={item.reference}
                text={item.verseTextSnapshot}
                translation={item.translation}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="rounded-full text-red-600"
                disabled={isPending}
                onClick={() => removeFavorite(item.id)}
                aria-label={`Supprimer ${item.reference}`}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden />
                )}
              </Button>
            </div>
          </div>
        </article>
      ))}
    </BibleLibraryShell>
  )
}

export function BibleNotesLibrary({ items }: { items: NoteItem[] }) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<"recent" | "reference">("recent")
  const deferredQuery = useDeferredValue(query)
  const [isPending, startTransition] = useTransition()
  const [optimisticItems, removeOptimistic] = useOptimistic(
    items,
    (current, removedId: string) => current.filter((item) => item.id !== removedId),
  )
  const visibleItems = useMemo(() => {
    const normalizedQuery = normalize(deferredQuery.trim())
    const filtered = normalizedQuery
      ? optimisticItems.filter((item) =>
          normalize(`${item.reference} ${item.content} ${item.book}`).includes(
            normalizedQuery,
          ),
        )
      : optimisticItems

    return [...filtered].sort((a, b) => {
      if (sort === "reference") {
        return (
          a.book.localeCompare(b.book) ||
          a.chapter - b.chapter ||
          a.verseStart - b.verseStart
        )
      }

      return b.updatedAt.getTime() - a.updatedAt.getTime()
    })
  }, [deferredQuery, optimisticItems, sort])

  const removeNote = (id: string) => {
    startTransition(async () => {
      removeOptimistic(id)
      const formData = new FormData()
      formData.set("noteId", id)
      const result = await deleteBibleNoteAction(formData)

      if (!result.ok) {
        toast.error("Note non supprimee", { description: result.message })
      } else {
        toast.success(result.message)
      }
    })
  }

  return (
    <BibleLibraryShell
      count={visibleItems.length}
      emptyLabel="Aucune note biblique pour le moment."
      query={query}
      setQuery={setQuery}
      sort={sort}
      setSort={setSort}
      title="Notes bibliques"
    >
      {visibleItems.map((item) => (
        <article
          key={item.id}
          className="rounded-[1.35rem] border border-zinc-200 bg-white/95 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
                {item.reference}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-zinc-800 dark:text-zinc-100">
                {item.content}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                {item.translation}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-full">
                <Link href={favoriteHref(item)}>
                  <BookOpen className="h-4 w-4" aria-hidden />
                  Ouvrir
                </Link>
              </Button>
              <VerseShareDialog
                compact
                href={favoriteHref(item)}
                reference={item.reference}
                text={item.content}
                translation={item.translation}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="rounded-full text-red-600"
                disabled={isPending}
                onClick={() => removeNote(item.id)}
                aria-label={`Supprimer la note ${item.reference}`}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden />
                )}
              </Button>
            </div>
          </div>
        </article>
      ))}
    </BibleLibraryShell>
  )
}

function BibleLibraryShell({
  children,
  count,
  emptyLabel,
  query,
  setQuery,
  sort,
  setSort,
  title,
}: {
  children: ReactNode
  count: number
  emptyLabel: string
  query: string
  setQuery: (value: string) => void
  sort: "recent" | "reference"
  setSort: (value: "recent" | "reference") => void
  title: string
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-[1.5rem] border border-zinc-200 bg-white/95 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {count} element{count > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher..."
                className="h-11 rounded-full pl-9 sm:w-64"
              />
            </div>
            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value === "reference" ? "reference" : "recent")
              }
              className="h-11 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="recent">Plus recent</option>
              <option value="reference">Reference</option>
            </select>
          </div>
        </div>
      </div>

      {count === 0 ? (
        <div className="rounded-[1.35rem] border border-dashed border-zinc-300 bg-white/70 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  )
}
