import type { Metadata } from "next"
import { Sparkles } from "lucide-react"
import { PageHeading } from "@/components/ui/page-heading"
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
    <div className="app-page">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageHeading eyebrow={translationName} title="La Bible" />
        <aside
          className="flex items-start gap-3 text-sm"
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
