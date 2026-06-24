import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { Bell, BookOpen, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { BibleVerseActions, type VerseActionState } from "@/components/bible/verse-actions"
import { VerseShareDialog } from "@/components/bible/verse-share-dialog"
import { Button } from "@/components/ui/button"
import { getBibleReferenceHref, getBibleVerseHref } from "@/lib/bible-reference"
import { searchVerses } from "@/lib/bible-data"
import {
  getAdjacentSentDailyVerses,
  getDailyBibleVerse,
} from "@/lib/daily-verse"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const verse = await getDailyBibleVerse()

  return {
    title: "Verset du jour",
    description: `${verse.text} - ${verse.reference}`,
    openGraph: {
      title: "Verset du jour - MegVie Paris",
      description: `${verse.text} - ${verse.reference}`,
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

async function getCurrentUserVerseState(input: {
  book: string
  chapter: number
  verse: number
  translation: string
}) {
  const authState = await auth()

  if (!authState.userId) {
    return {
      authenticated: false,
      activeDevices: 0,
      state: { favoriteId: null, note: null } satisfies VerseActionState,
    }
  }

  const user = await prisma.appUser.findUnique({
    where: { clerkUserId: authState.userId },
    select: { id: true },
  })

  if (!user) {
    return {
      authenticated: true,
      activeDevices: 0,
      state: { favoriteId: null, note: null } satisfies VerseActionState,
    }
  }

  const [favorite, note, activeDevices] = await Promise.all([
    prisma.bibleFavorite.findFirst({
      where: {
        userId: user.id,
        book: input.book,
        chapter: input.chapter,
        verseStart: input.verse,
        verseEnd: input.verse,
        translation: input.translation,
      },
      select: { id: true },
    }),
    prisma.bibleNote.findFirst({
      where: {
        userId: user.id,
        book: input.book,
        chapter: input.chapter,
        verseStart: input.verse,
        verseEnd: input.verse,
        translation: input.translation,
      },
      select: { id: true, content: true },
    }),
    prisma.pushSubscription.count({
      where: { userId: user.id, isActive: true, revokedAt: null },
    }),
  ])

  return {
    authenticated: true,
    activeDevices,
    state: {
      favoriteId: favorite?.id ?? null,
      note: note ? { id: note.id, content: note.content } : null,
    } satisfies VerseActionState,
  }
}

function resolveStructuredVerse(reference: string) {
  const result = searchVerses(reference, 1).results[0]

  if (!result) return null

  return {
    book: result.book_id,
    chapter: result.chapter,
    verse: result.verse,
    href: getBibleVerseHref({
      book_id: result.book_id,
      chapter: result.chapter,
      verse: result.verse,
    }),
  }
}

export default async function DailyVersePage() {
  const [verse, adjacent] = await Promise.all([
    getDailyBibleVerse(),
    getAdjacentSentDailyVerses(),
  ])
  const structured =
    verse.book && verse.chapter && verse.verseStart
      ? {
          book: verse.book,
          chapter: verse.chapter,
          verse: verse.verseStart,
          href: getBibleVerseHref({
            book_id: verse.book,
            chapter: verse.chapter,
            verse: verse.verseStart,
          }),
        }
      : resolveStructuredVerse(verse.reference)
  const memberState = structured
    ? await getCurrentUserVerseState({
        book: structured.book,
        chapter: structured.chapter,
        verse: structured.verse,
        translation: verse.translation,
      })
    : {
        authenticated: false,
        activeDevices: 0,
        state: { favoriteId: null, note: null } satisfies VerseActionState,
      }
  const shareHref = structured?.href ?? getBibleReferenceHref(verse.reference)

  return (
    <div className="app-edge-to-edge min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 py-4 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-50 sm:py-8">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-2.5 sm:gap-6 sm:px-4">
        <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-zinc-950 via-amber-900 to-emerald-800 p-5 text-white shadow-2xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-white/15 p-3">
                <BookOpen className="h-6 w-6" aria-hidden />
              </span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.35em] text-amber-100">
                MegVie Paris
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-6xl">
                Verset du jour
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/80">
                Un passage biblique pour nourrir la foi, la priere et la
                journee.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs text-white/70">Notifications</p>
              <p className="mt-1 text-2xl font-semibold">
                {memberState.activeDevices > 0
                  ? `${memberState.activeDevices} appareil`
                  : "A configurer"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-zinc-200 bg-white/95 p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/85 sm:p-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            <Sparkles className="h-4 w-4" aria-hidden />
            {verse.theme ?? "Encouragement"}
          </div>

          <blockquote className="mt-6 text-2xl font-semibold leading-relaxed text-zinc-950 dark:text-white sm:text-4xl">
            &quot;{verse.text}&quot;
          </blockquote>

          <div className="mt-6 flex flex-col gap-4 border-l-4 border-amber-500 pl-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link
                href={shareHref}
                className="text-lg font-semibold text-amber-700 underline-offset-4 transition hover:text-amber-600 hover:underline dark:text-amber-200"
              >
                {verse.reference}
              </Link>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {verse.translation}
                {verse.localDate ? ` - ${verse.localDate}` : ""}
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href={shareHref}>
                Ouvrir dans la Bible
                <BookOpen className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {structured ? (
              <BibleVerseActions
                authenticated={memberState.authenticated}
                book={structured.book}
                chapter={structured.chapter}
                href={structured.href}
                reference={verse.reference}
                state={memberState.state}
                text={verse.text}
                translation={verse.translation}
                verse={structured.verse}
              />
            ) : (
              <VerseShareDialog
                href={shareHref}
                reference={verse.reference}
                text={verse.text}
                translation={verse.translation}
              />
            )}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <Link
            href="/espace-membre/notifications"
            className="rounded-[1.35rem] border border-zinc-200 bg-white/90 p-4 transition hover:border-amber-200 hover:bg-amber-50 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-900"
          >
            <Bell className="h-5 w-5 text-amber-600" aria-hidden />
            <p className="mt-3 font-semibold">Recevoir les versets</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Verifiez vos preferences et vos appareils actifs.
            </p>
          </Link>
          <AdjacentVerseCard label="Precedent" item={adjacent.previous} icon="left" />
          <AdjacentVerseCard label="Suivant" item={adjacent.next} icon="right" />
        </section>
      </main>
    </div>
  )
}

function AdjacentVerseCard({
  icon,
  item,
  label,
}: {
  icon: "left" | "right"
  item: {
    localDate: string
    reference: string
    verseText: string
    translation: string
  } | null
  label: string
}) {
  const Icon = icon === "left" ? ChevronLeft : ChevronRight

  return (
    <div className="rounded-[1.35rem] border border-zinc-200 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
        <Icon className="h-4 w-4" aria-hidden />
        {label}
      </div>
      {item ? (
        <>
          <p className="mt-3 font-semibold">{item.reference}</p>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {item.verseText}
          </p>
          <p className="mt-2 text-xs text-zinc-400">{item.localDate}</p>
        </>
      ) : (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Aucun verset envoye disponible.
        </p>
      )}
    </div>
  )
}
