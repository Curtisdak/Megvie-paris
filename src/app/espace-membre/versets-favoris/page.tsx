import type { Metadata } from "next"
import { FavoriteVersesLibrary } from "@/components/bible/member-bible-library"
import { listCurrentUserBibleFavorites } from "@/lib/bible-data-member"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Versets favoris",
}

export default async function FavoriteVersesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; sort?: string }>
}) {
  const params = await searchParams
  const favorites = await listCurrentUserBibleFavorites({
    search: params?.q,
    sort: params?.sort,
  })

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-2.5 py-5 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-50 sm:px-4 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <section className="rounded-[1.75rem] bg-gradient-to-br from-zinc-950 via-amber-900 to-emerald-800 p-6 text-white shadow-2xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-100">
            Bible
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">
            Versets favoris
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
            Retrouvez rapidement les passages que vous souhaitez garder,
            partager ou relire.
          </p>
        </section>

        <FavoriteVersesLibrary items={favorites} />
      </div>
    </main>
  )
}
