import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Bell, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listMemberAnnouncements } from "@/lib/admin/data"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Annonces",
}

const categoryLabels: Record<string, string> = {
  GENERAL: "General",
  EMPLOI: "Emploi",
  MARIAGE: "Mariage",
  BAPTEME: "Bapteme",
  EVENEMENT: "Evenement",
  BON_PLAN: "Bon plan",
  URGENT: "Urgent",
}

function formatDate(date: Date | null) {
  if (!date) return "Annonce publiee"

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date)
}

export default async function MemberAnnouncementsPage() {
  const announcements = await listMemberAnnouncements()

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-3 py-5 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-50 sm:px-5 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-zinc-950 via-amber-900 to-emerald-800 p-6 text-white shadow-2xl sm:p-8">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-white/15 p-3">
              <Bell className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-100">
                Espace membre
              </p>
              <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">
                Annonces MegVie.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
                Retrouvez les informations publiees pour la communaute et les
                membres.
              </p>
            </div>
          </div>
        </section>

        {announcements.length === 0 ? (
          <section className="rounded-[28px] border border-zinc-200 bg-white/95 p-6 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
            Aucune annonce publiee pour le moment.
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {announcements.map((announcement) => {
              const wasRead = announcement.reads.length > 0

              return (
                <article
                  key={announcement.id}
                  className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white/95 shadow-sm transition hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80"
                >
                  {announcement.coverImageUrl ? (
                    <div className="aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={announcement.coverImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-800 dark:bg-amber-400/15 dark:text-amber-100">
                        {categoryLabels[announcement.category] ?? announcement.category}
                      </span>
                      {announcement.visibility === "MEMBERS_ONLY" ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-100">
                          Membres
                        </span>
                      ) : null}
                      {wasRead ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                          Lu
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-4 text-xl font-semibold leading-tight">
                      {announcement.title}
                    </h2>
                    {announcement.summary ? (
                      <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {announcement.summary}
                      </p>
                    ) : null}
                    <p className="mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {formatDate(announcement.publishedAt)}
                    </p>
                    <Button asChild className="mt-5 rounded-full">
                      <Link href={`/espace-membre/annonces/${announcement.id}`}>
                        Ouvrir
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </Button>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </div>
    </main>
  )
}
