import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen, Sparkles } from "lucide-react"
import { DailyVerseShareActions } from "@/components/daily-verse-share-actions"
import { getBibleReferenceHref } from "@/lib/bible-reference"
import { getDailyBibleVerse } from "@/lib/daily-verse"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const verse = await getDailyBibleVerse()

  return {
    title: "Verset du jour",
    description: `${verse.text} \u2014 ${verse.reference}`,
    openGraph: {
      title: "Verset du jour \u2014 MegVie Paris",
      description: `${verse.text} \u2014 ${verse.reference}`,
      type: "article",
      images: [
        {
          url: "/icons/icon-512x512.png",
          width: 512,
          height: 512,
          alt: "MegVie Paris",
        },
      ],
    },
  }
}

export default async function DailyVersePage() {
  const verse = await getDailyBibleVerse()

  return (
    <div className="app-edge-to-edge min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 py-5 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-50 sm:py-12">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 sm:gap-8">
        <section className="overflow-hidden rounded-[28px] border border-amber-100 bg-white/95 shadow-xl dark:border-amber-400/25 dark:bg-zinc-900/85 sm:rounded-[32px]">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex min-h-[220px] flex-col justify-between bg-gradient-to-br from-amber-700 via-amber-600 to-amber-400 p-6 text-white sm:min-h-[260px] sm:p-8">
              <div>
                <span className="inline-flex rounded-full bg-white/15 p-3">
                  <BookOpen className="h-6 w-6" />
                </span>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.35em] text-white/80">
                  MegVie Paris
                </p>
                <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                  Verset du jour
                </h1>
              </div>
              <p className="mt-8 max-w-sm text-sm leading-6 text-white/85">
                Chaque matin, recevez un verset biblique pour commencer la
                journee avec foi.
              </p>
            </div>

            <div className="p-5 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                <Sparkles className="h-4 w-4" />
                {verse.theme ?? "Encouragement"}
              </div>

              <blockquote className="mt-7 text-xl font-semibold leading-relaxed text-zinc-900 dark:text-white sm:mt-8 sm:text-3xl">
                &quot;{verse.text}&quot;
              </blockquote>

              <div className="mt-6 border-l-4 border-amber-500 pl-4">
                <Link
                  href={getBibleReferenceHref(verse.reference)}
                  className="text-lg font-semibold text-amber-700 underline-offset-4 transition hover:text-amber-600 hover:underline dark:text-amber-200"
                >
                  {verse.reference}
                </Link>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {verse.translation}
                </p>
              </div>

              {verse.isFallback && (
                <p className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                  Exemple de demarrage: remplacez cette liste par les versets
                  approuves par l&apos;eglise dans Neon/Postgres.
                </p>
              )}

              <div className="mt-8">
                <DailyVerseShareActions
                  reference={verse.reference}
                  text={verse.text}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
