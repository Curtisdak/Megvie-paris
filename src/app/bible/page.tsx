import type { Metadata } from "next"
import { BookOpen, Sparkles } from "lucide-react"
import { BiblePageClient } from "@/components/bible/bible-page-client"
import {
  getBibleTranslation,
  getNewTestamentBooks,
  getOldTestamentBooks,
} from "@/lib/bible-data"

export const metadata: Metadata = {
  title: "Bible",
  description:
    "Lire et rechercher la Bible Louis Segond 1910 dans l'application MegVie Paris.",
}

export default function BiblePage() {
  const oldTestamentBooks = getOldTestamentBooks()
  const newTestamentBooks = getNewTestamentBooks()
  const translation = getBibleTranslation()
  const translationName =
    translation.name ?? translation.abbreviation ?? "Louis Segond 1910"

  return (
    <div className="min-h-screen bg-white px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 lg:px-8">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
            <BookOpen className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">La Bible</h1>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {translationName}
            </p>
          </div>
        </header>
        <aside
          className="flex items-start gap-3 border-y border-sky-100 bg-sky-50/60 px-3 py-3 dark:border-sky-400/15 dark:bg-sky-400/5"
          aria-label="Prochainement"
        >
          <Sparkles
            className="mt-0.5 size-4 shrink-0 text-sky-700 dark:text-sky-300"
            aria-hidden
          />
          <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-300">
            <strong className="font-semibold text-sky-800 dark:text-sky-200">
              Bientôt, une aide par IA.
            </strong>{" "}
            Une recherche facilitée et un accompagnement pour mieux comprendre
            les versets et les thèmes bibliques.
          </p>
        </aside>

        <BiblePageClient
          oldTestamentBooks={oldTestamentBooks}
          newTestamentBooks={newTestamentBooks}
          translationName={translationName}
        />
      </main>
    </div>
  )
}
