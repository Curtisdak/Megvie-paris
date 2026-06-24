import type { Metadata } from "next"
import { DailyVerseScheduler } from "@/components/bible/daily-verse-scheduler"
import { getBibleBooks } from "@/lib/bible-data"
import { listDailyVerseSchedules } from "@/lib/daily-verse-admin"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Versets du jour",
}

const statusCards = [
  { key: "DRAFT", label: "Brouillons" },
  { key: "SCHEDULED", label: "Programmes" },
  { key: "SENT", label: "Envoyes" },
  { key: "FAILED", label: "Echecs" },
] as const

export default async function AdminDailyVersesPage() {
  const [data, books] = await Promise.all([
    listDailyVerseSchedules(),
    Promise.resolve(getBibleBooks()),
  ])

  const schedules = data.schedules.map((schedule) => ({
    id: schedule.id,
    localDate: schedule.localDate,
    notificationTime: schedule.notificationTime,
    status: schedule.status,
    book: schedule.book,
    chapter: schedule.chapter,
    verseStart: schedule.verseStart,
    verseEnd: schedule.verseEnd,
    reference: schedule.reference,
    verseText: schedule.verseText,
    translation: schedule.translation,
    theme: schedule.theme,
    sentAt: schedule.sentAt,
    failureCode: schedule.failureCode,
  }))

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] bg-gradient-to-br from-zinc-950 via-amber-900 to-emerald-800 p-5 text-white shadow-2xl sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-100">
          Bible
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold sm:text-5xl">
              Versets du jour
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
              Choisissez le verset, programmez l&apos;heure Europe/Paris et laissez
              le cron protege envoyer la notification.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[28rem]">
            {statusCards.map((card) => (
              <div key={card.key} className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs text-white/70">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold">
                  {data.counts[card.key]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DailyVerseScheduler books={books} schedules={schedules} />
    </div>
  )
}
