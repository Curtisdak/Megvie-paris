import type { Metadata } from "next"
import { BibleFeatureBadges, BiblePageClient } from "@/components/bible/bible-page-client"
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-2 py-5 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-50 sm:px-3 sm:py-12 lg:px-4">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        <section className="border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:pb-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(320px,0.65fr)] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-600">
                {translationName}
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-zinc-900 dark:text-white sm:text-6xl">
                Bible
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
                Lisez les livres bibliques, ouvrez les chapitres et recherchez
                rapidement un verset depuis les donnees locales de
                l&apos;application.
              </p>
            </div>

            <div>
              <BibleFeatureBadges />
            </div>
          </div>
        </section>

        <BiblePageClient
          oldTestamentBooks={oldTestamentBooks}
          newTestamentBooks={newTestamentBooks}
          translationName={translationName}
        />
      </main>
    </div>
  )
}
