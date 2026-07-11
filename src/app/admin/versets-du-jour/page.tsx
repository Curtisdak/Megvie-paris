import type { Metadata } from "next"
import { DailyVerseScheduler } from "@/components/bible/daily-verse-scheduler"
import { AdminPageHero } from "@/components/admin/admin-page-hero"
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
      <AdminPageHero
        eyebrow="Bible"
        title="Versets du jour"
        description="Choisissez le verset, programmez l'heure Europe/Paris et laissez le cron protégé envoyer la notification."
        action={
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[28rem]">
            {statusCards.map((card) => (
              <div key={card.key} className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15">
                <p className="text-xs text-white/65">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {data.counts[card.key]}
                </p>
              </div>
            ))}
          </div>
        }
      />

      <DailyVerseScheduler books={books} schedules={schedules} />
    </div>
  )
}
