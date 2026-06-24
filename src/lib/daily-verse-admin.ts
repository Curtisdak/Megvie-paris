"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { DailyVerseScheduleStatus } from "@/generated/prisma/enums"
import { requirePermission } from "@/lib/auth/clerk-user"
import {
  getDefaultBibleTranslationName,
  validateBibleVerseSelection,
} from "@/lib/bible-member"
import { cleanLongText, cleanText, type AdminActionState } from "@/lib/admin/validation"
import { prisma } from "@/lib/prisma"

const activeDailyVerseStatuses: DailyVerseScheduleStatus[] = [
  DailyVerseScheduleStatus.DRAFT,
  DailyVerseScheduleStatus.SCHEDULED,
]

function parseLocalDate(value: FormDataEntryValue | null) {
  const raw = cleanText(value, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
}

function parseLocalTime(value: FormDataEntryValue | null) {
  const raw = cleanText(value, 5)
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(raw) ? raw : null
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date)
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  const asUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  )

  return asUtc - date.getTime()
}

function parisLocalDateTimeToUtc(localDate: string, localTime: string) {
  const [year, month, day] = localDate.split("-").map(Number)
  const [hour, minute] = localTime.split(":").map(Number)
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0, 0)
  const timeZone = "Europe/Paris"
  let corrected = new Date(utcGuess - getTimeZoneOffset(new Date(utcGuess), timeZone))
  corrected = new Date(utcGuess - getTimeZoneOffset(corrected, timeZone))

  return corrected
}

function actionFromIntent(intent: string) {
  return intent === "schedule"
    ? DailyVerseScheduleStatus.SCHEDULED
    : DailyVerseScheduleStatus.DRAFT
}

export async function listDailyVerseSchedules() {
  const actor = await requirePermission(
    "daily_verses.manage",
    "/admin/versets-du-jour",
  )
  const schedules = await prisma.dailyVerseSchedule.findMany({
    orderBy: [{ localDate: "desc" }, { updatedAt: "desc" }],
    take: 80,
    include: {
      createdBy: {
        select: { firstName: true, lastName: true, email: true },
      },
      updatedBy: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  })
  const counts = await prisma.dailyVerseSchedule.groupBy({
    by: ["status"],
    _count: { _all: true },
  })

  return {
    actor,
    schedules,
    counts: Object.fromEntries(
      Object.values(DailyVerseScheduleStatus).map((status) => [
        status,
        counts.find((item) => item.status === status)?._count._all ?? 0,
      ]),
    ) as Record<DailyVerseScheduleStatus, number>,
  }
}

export async function saveDailyVerseScheduleAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requirePermission(
    "daily_verses.manage",
    "/admin/versets-du-jour",
  )
  const id = cleanText(formData.get("id"), 80)
  const localDate = parseLocalDate(formData.get("localDate"))
  const notificationTime = parseLocalTime(formData.get("notificationTime"))
  const intent = cleanText(formData.get("intent"), 20)
  const status = actionFromIntent(intent)
  const theme = cleanText(formData.get("theme"), 80) || null

  if (!localDate || !notificationTime) {
    return { ok: false, message: "Date et heure de notification obligatoires." }
  }

  let selection: ReturnType<typeof validateBibleVerseSelection>

  try {
    selection = validateBibleVerseSelection({
      book: cleanText(formData.get("book"), 16),
      chapter: Number(formData.get("chapter") ?? 0),
      verseStart: Number(formData.get("verseStart") ?? 0),
      verseEnd: Number(formData.get("verseEnd") ?? formData.get("verseStart") ?? 0),
      translation: getDefaultBibleTranslationName(),
    })
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Reference biblique invalide.",
    }
  }

  const duplicate = await prisma.dailyVerseSchedule.findFirst({
    where: {
      localDate,
      status: { in: activeDailyVerseStatuses },
      id: id ? { not: id } : undefined,
    },
    select: { id: true, reference: true },
  })

  if (duplicate) {
    return {
      ok: false,
      message: `Un verset est deja actif pour cette date (${duplicate.reference}).`,
    }
  }

  const existing = id
    ? await prisma.dailyVerseSchedule.findUnique({
        where: { id },
        select: { id: true, status: true, dedupeKey: true },
      })
    : null

  if (id && !existing) {
    return { ok: false, message: "Programme introuvable." }
  }

  if (
    existing &&
    !activeDailyVerseStatuses.includes(existing.status)
  ) {
    return {
      ok: false,
      message: "Ce programme ne peut plus etre modifie.",
    }
  }

  const scheduledFor = parisLocalDateTimeToUtc(localDate, notificationTime)
  const dedupeKey =
    existing?.dedupeKey ?? `daily-verse-schedule:${localDate}:${randomUUID()}`
  const saved = id
    ? await prisma.dailyVerseSchedule.update({
        where: { id },
        data: {
          localDate,
          notificationTime,
          scheduledFor,
          status,
          book: selection.book,
          chapter: selection.chapter,
          verseStart: selection.verseStart,
          verseEnd: selection.verseEnd,
          reference: selection.reference,
          verseText: selection.text,
          translation: selection.translation,
          theme,
          failureCode: null,
          updatedByUserId: actor.id,
        },
      })
    : await prisma.dailyVerseSchedule.create({
        data: {
          localDate,
          notificationTime,
          scheduledFor,
          status,
          book: selection.book,
          chapter: selection.chapter,
          verseStart: selection.verseStart,
          verseEnd: selection.verseEnd,
          reference: selection.reference,
          verseText: selection.text,
          translation: selection.translation,
          theme,
          dedupeKey,
          createdByUserId: actor.id,
          updatedByUserId: actor.id,
        },
      })

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: actor.id,
      actorMemberId: actor.profile?.memberId ?? null,
      action: id ? "daily_verse.updated" : "daily_verse.created",
      entityType: "daily_verse_schedule",
      entityId: saved.id,
      summary: `${saved.reference} - ${saved.localDate}`,
      metadata: {
        status: saved.status,
        localDate: saved.localDate,
        notificationTime: saved.notificationTime,
        reference: saved.reference,
      },
    },
  })

  revalidatePath("/admin/versets-du-jour")
  revalidatePath("/verset-du-jour")

  return {
    ok: true,
    message:
      status === DailyVerseScheduleStatus.SCHEDULED
        ? "Verset programme."
        : "Brouillon enregistre.",
  }
}

export async function cancelDailyVerseScheduleAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requirePermission(
    "daily_verses.manage",
    "/admin/versets-du-jour",
  )
  const id = cleanText(formData.get("id"), 80)
  const reason = cleanLongText(formData.get("reason"), 400)

  if (!id) return { ok: false, message: "Programme introuvable." }

  const schedule = await prisma.dailyVerseSchedule.findUnique({
    where: { id },
    select: { id: true, status: true, reference: true, localDate: true },
  })

  if (!schedule) return { ok: false, message: "Programme introuvable." }
  if (!activeDailyVerseStatuses.includes(schedule.status)) {
    return { ok: false, message: "Ce programme ne peut pas etre annule." }
  }

  await prisma.$transaction([
    prisma.dailyVerseSchedule.update({
      where: { id },
      data: {
        status: DailyVerseScheduleStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledByUserId: actor.id,
        updatedByUserId: actor.id,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        actorMemberId: actor.profile?.memberId ?? null,
        action: "daily_verse.cancelled",
        entityType: "daily_verse_schedule",
        entityId: id,
        summary: `${schedule.reference} annule.`,
        metadata: {
          localDate: schedule.localDate,
          reason: reason || null,
        },
      },
    }),
  ])

  revalidatePath("/admin/versets-du-jour")
  revalidatePath("/verset-du-jour")

  return { ok: true, message: "Programme annule." }
}
