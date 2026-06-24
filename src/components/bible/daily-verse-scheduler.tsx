"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { CalendarClock, Loader2, Pencil, Search, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  cancelDailyVerseScheduleAction,
  saveDailyVerseScheduleAction,
} from "@/lib/daily-verse-admin"
import type { AdminActionState } from "@/lib/admin/validation"
import type { BibleBook, BibleVerse } from "@/lib/bible-data"

type ScheduleStatus = "DRAFT" | "SCHEDULED" | "SENT" | "CANCELLED" | "FAILED"

type ScheduleItem = {
  id: string
  localDate: string
  notificationTime: string
  status: ScheduleStatus
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
  reference: string
  verseText: string
  translation: string
  theme: string | null
  sentAt: Date | null
  failureCode: string | null
}

const initialState: AdminActionState = { ok: false, message: "" }

function todayParis() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())

  return `${parts.find((part) => part.type === "year")?.value ?? "2026"}-${
    parts.find((part) => part.type === "month")?.value ?? "01"
  }-${parts.find((part) => part.type === "day")?.value ?? "01"}`
}

function isEditable(status: ScheduleStatus) {
  return status === "DRAFT" || status === "SCHEDULED"
}

export function DailyVerseScheduler({
  books,
  schedules,
}: {
  books: BibleBook[]
  schedules: ScheduleItem[]
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr),minmax(0,1.1fr)]">
      <DailyVerseScheduleForm books={books} />
      <section className="space-y-3">
        {schedules.length === 0 ? (
          <div className="rounded-[1.35rem] border border-dashed border-zinc-300 bg-white/80 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400">
            Aucun verset programme pour le moment.
          </div>
        ) : (
          schedules.map((schedule) => (
            <article
              key={schedule.id}
              className="rounded-[1.35rem] border border-zinc-200 bg-white/95 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-800 dark:bg-amber-400/15 dark:text-amber-100">
                      {schedule.status.toLowerCase()}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {schedule.localDate} a {schedule.notificationTime}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">
                    {schedule.reference}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {schedule.verseText}
                  </p>
                  {schedule.failureCode ? (
                    <p className="mt-2 text-sm font-semibold text-red-600">
                      Echec: {schedule.failureCode}
                    </p>
                  ) : null}
                </div>
                {isEditable(schedule.status) ? (
                  <div className="flex shrink-0 gap-2">
                    <details className="group">
                      <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-zinc-200 px-4 text-sm font-semibold dark:border-zinc-800">
                        <Pencil className="h-4 w-4" aria-hidden />
                        Modifier
                      </summary>
                      <div className="mt-3 w-full min-w-[min(88vw,28rem)] rounded-[1.25rem] border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/70">
                        <DailyVerseScheduleForm books={books} initial={schedule} compact />
                      </div>
                    </details>
                    <DailyVerseCancelForm scheduleId={schedule.id} />
                  </div>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  )
}

function DailyVerseScheduleForm({
  books,
  compact = false,
  initial,
}: {
  books: BibleBook[]
  compact?: boolean
  initial?: ScheduleItem
}) {
  const [state, formAction, isPending] = useActionState(
    saveDailyVerseScheduleAction,
    initialState,
  )
  const [book, setBook] = useState(initial?.book ?? books[0]?.id ?? "")
  const [chapter, setChapter] = useState(initial?.chapter ?? 1)
  const [verseStart, setVerseStart] = useState(initial?.verseStart ?? 1)
  const [verseEnd, setVerseEnd] = useState(initial?.verseEnd ?? initial?.verseStart ?? 1)
  const [preview, setPreview] = useState<BibleVerse[]>([])
  const selectedBook = useMemo(
    () => books.find((item) => item.id === book) ?? books[0],
    [book, books],
  )
  const maxChapter = selectedBook?.chapter_count ?? 1
  const selectedPreview = preview.filter(
    (verse) => verse.verse >= verseStart && verse.verse <= verseEnd,
  )

  useEffect(() => {
    if (!book) return
    const controller = new AbortController()

    async function loadPreview() {
      const response = await fetch(
        `/api/bible/chapter?bookId=${encodeURIComponent(book)}&chapter=${chapter}`,
        { signal: controller.signal },
      )
      if (!response.ok) {
        setPreview([])
        return
      }
      const data = (await response.json()) as { verses: BibleVerse[] }
      setPreview(data.verses)
    }

    void loadPreview()

    return () => controller.abort()
  }, [book, chapter])

  useEffect(() => {
    if (state.message) {
      if (state.ok) toast.success(state.message)
      else toast.error(state.message)
    }
  }, [state])

  return (
    <form
      action={formAction}
      className={
        compact
          ? "space-y-3"
          : "rounded-[1.35rem] border border-zinc-200 bg-white/95 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
      }
    >
      <input type="hidden" name="id" value={initial?.id ?? ""} />
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-2xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-400/15 dark:text-amber-100">
            <CalendarClock className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold">
              {compact ? "Modifier le verset" : "Programmer un verset"}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Fuseau horaire Europe/Paris.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold">
          Date
          <Input
            name="localDate"
            type="date"
            defaultValue={initial?.localDate ?? todayParis()}
            className="h-11 rounded-full"
          />
        </label>
        <label className="space-y-1 text-sm font-semibold">
          Heure
          <Input
            name="notificationTime"
            type="time"
            defaultValue={initial?.notificationTime ?? "08:00"}
            className="h-11 rounded-full"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold">
          Livre
          <select
            name="book"
            value={book}
            onChange={(event) => {
              setBook(event.target.value)
              setChapter(1)
              setVerseStart(1)
              setVerseEnd(1)
            }}
            className="h-11 w-full rounded-full border border-zinc-200 bg-white px-4 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            {books.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-semibold">
          Chapitre
          <Input
            name="chapter"
            type="number"
            min={1}
            max={maxChapter}
            value={chapter}
            onChange={(event) => setChapter(Number(event.target.value) || 1)}
            className="h-11 rounded-full"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold">
          Verset debut
          <Input
            name="verseStart"
            type="number"
            min={1}
            value={verseStart}
            onChange={(event) => {
              const next = Number(event.target.value) || 1
              setVerseStart(next)
              if (verseEnd < next) setVerseEnd(next)
            }}
            className="h-11 rounded-full"
          />
        </label>
        <label className="space-y-1 text-sm font-semibold">
          Verset fin
          <Input
            name="verseEnd"
            type="number"
            min={verseStart}
            value={verseEnd}
            onChange={(event) => setVerseEnd(Number(event.target.value) || verseStart)}
            className="h-11 rounded-full"
          />
        </label>
      </div>

      <label className="space-y-1 text-sm font-semibold">
        Theme
        <Input
          name="theme"
          defaultValue={initial?.theme ?? ""}
          placeholder="Paix, courage, foi..."
          className="h-11 rounded-full"
        />
      </label>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Search className="h-4 w-4 text-amber-600" aria-hidden />
          Apercu
        </div>
        {selectedPreview.length > 0 ? (
          <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-200">
            {selectedPreview.map((verse) => `${verse.verse} ${verse.text}`).join(" ")}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">Selectionnez un verset valide.</p>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="submit"
          name="intent"
          value="draft"
          variant="outline"
          disabled={isPending}
          className="rounded-full"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enregistrer brouillon
        </Button>
        <Button
          type="submit"
          name="intent"
          value="schedule"
          disabled={isPending}
          className="rounded-full bg-amber-600 text-white hover:bg-amber-500"
        >
          Programmer
        </Button>
      </div>
    </form>
  )
}

function DailyVerseCancelForm({ scheduleId }: { scheduleId: string }) {
  const [state, formAction, isPending] = useActionState(
    cancelDailyVerseScheduleAction,
    initialState,
  )

  useEffect(() => {
    if (state.message) {
      if (state.ok) toast.success(state.message)
      else toast.error(state.message)
    }
  }, [state])

  return (
    <form action={formAction} className="flex gap-2">
      <input type="hidden" name="id" value={scheduleId} />
      <input type="hidden" name="reason" value="Annule depuis l'administration" />
      <Button
        type="submit"
        size="icon"
        variant="ghost"
        className="rounded-full text-red-600"
        disabled={isPending}
        aria-label="Annuler ce verset programme"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <XCircle className="h-4 w-4" aria-hidden />
        )}
      </Button>
    </form>
  )
}
