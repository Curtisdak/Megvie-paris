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
    <main className="app-page">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <section className="rounded-lg bg-[linear-gradient(110deg,#18181b,#193d38)] p-6 text-white shadow-none sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-normal text-amber-100">
            Etude personnelle
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-3xl">
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
