import type { Metadata } from "next"
import { BibleNotesLibrary } from "@/components/bible/member-bible-library"
import { listCurrentUserBibleNotes } from "@/lib/bible-data-member"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Notes bibliques",
}

export default async function BibleNotesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; sort?: string }>
}) {
  const params = await searchParams
  const notes = await listCurrentUserBibleNotes({
    search: params?.q,
    sort: params?.sort,
  })

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-2.5 py-5 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-50 sm:px-4 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <section className="rounded-[1.75rem] bg-gradient-to-br from-zinc-950 via-amber-900 to-emerald-800 p-6 text-white shadow-2xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-100">
            Etude personnelle
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">
            Notes bibliques
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
            Vos notes sont privees et rattachees aux versets que vous meditez.
          </p>
        </section>

        <BibleNotesLibrary items={notes} />
      </div>
    </main>
  )
}
