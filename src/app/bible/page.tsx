import type { Metadata } from "next"
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

        <BiblePageClient
          oldTestamentBooks={oldTestamentBooks}
          newTestamentBooks={newTestamentBooks}
          translationName={translationName}
        />
      </main>
    </div>
  )
}
