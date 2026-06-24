import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMemberAnnouncementDetail } from "@/lib/admin/data"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Annonce",
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

function paragraphs(value: string) {
  return value
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export default async function MemberAnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const announcement = await getMemberAnnouncementDetail(id)

  if (!announcement) notFound()

  const authorName =
    [announcement.author.firstName, announcement.author.lastName]
      .filter(Boolean)
      .join(" ") || "MegVie Paris"

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-3 py-5 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-50 sm:px-5 sm:py-10">
      <article className="mx-auto w-full max-w-4xl overflow-hidden rounded-[30px] border border-zinc-200 bg-white/95 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/85">
        {announcement.coverImageUrl ? (
          <div className="aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={announcement.coverImageUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
        ) : null}

        <div className="p-5 sm:p-8">
          <Button asChild variant="ghost" className="-ml-3 rounded-full">
            <Link href="/espace-membre/annonces">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Toutes les annonces
            </Link>
          </Button>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-800 dark:bg-amber-400/15 dark:text-amber-100">
              {categoryLabels[announcement.category] ?? announcement.category}
            </span>
            {announcement.visibility === "MEMBERS_ONLY" ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-100">
                Membres
              </span>
            ) : null}
          </div>

          <h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-5xl">
            {announcement.title}
          </h1>
          {announcement.summary ? (
            <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
              {announcement.summary}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Publie par {authorName} - {formatDate(announcement.publishedAt)}
          </p>

          <div className="mt-8 space-y-5 text-base leading-8 text-zinc-700 dark:text-zinc-200">
            {paragraphs(announcement.body).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {announcement.externalUrl ? (
            <Button asChild className="mt-8 rounded-full">
              <a
                href={announcement.externalUrl}
                target="_blank"
                rel="noreferrer"
              >
                Ouvrir le lien
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
            </Button>
          ) : null}
        </div>
      </article>
    </main>
  )
}
