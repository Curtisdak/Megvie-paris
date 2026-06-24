import "server-only"

import { DailyVerseScheduleStatus } from "@/generated/prisma/enums"
import { getLocalDateKey } from "@/lib/notifications/safety"
import { prisma } from "@/lib/prisma"

export type DailyBibleVerse = {
  id?: string
  day_of_year: number
  book?: string
  chapter?: number
  verseStart?: number
  verseEnd?: number
  reference: string
  text: string
  translation: string
  theme?: string | null
  isFallback?: boolean
  isScheduled?: boolean
  localDate?: string
}

const fallbackVerses: DailyBibleVerse[] = [
  {
    day_of_year: 1,
    reference: "Psaume 118:24",
    text: "C'est ici la journee que l'Eternel a faite: qu'elle soit pour nous un sujet d'allegresse et de joie.",
    translation: "Louis Segond 1910",
    theme: "Joie",
    isFallback: true,
  },
  {
    day_of_year: 2,
    reference: "Jean 14:27",
    text: "Je vous laisse la paix, je vous donne ma paix.",
    translation: "Louis Segond 1910",
    theme: "Paix",
    isFallback: true,
  },
  {
    day_of_year: 3,
    reference: "Philippiens 4:13",
    text: "Je puis tout par celui qui me fortifie.",
    translation: "Louis Segond 1910",
    theme: "Force",
    isFallback: true,
  },
  {
    day_of_year: 4,
    reference: "Psaume 23:1",
    text: "L'Eternel est mon berger: je ne manquerai de rien.",
    translation: "Louis Segond 1910",
    theme: "Confiance",
    isFallback: true,
  },
  {
    day_of_year: 5,
    reference: "Romains 8:31",
    text: "Si Dieu est pour nous, qui sera contre nous?",
    translation: "Louis Segond 1910",
    theme: "Assurance",
    isFallback: true,
  },
  {
    day_of_year: 6,
    reference: "Esaie 41:10",
    text: "Ne crains rien, car je suis avec toi.",
    translation: "Louis Segond 1910",
    theme: "Courage",
    isFallback: true,
  },
  {
    day_of_year: 7,
    reference: "Matthieu 5:14",
    text: "Vous etes la lumiere du monde.",
    translation: "Louis Segond 1910",
    theme: "Temoignage",
    isFallback: true,
  },
]

function getParisDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const year = Number(parts.find((part) => part.type === "year")?.value)
  const month = Number(parts.find((part) => part.type === "month")?.value)
  const day = Number(parts.find((part) => part.type === "day")?.value)

  return { year, month, day }
}

export function getParisDayOfYear(date = new Date()) {
  const { year, month, day } = getParisDateParts(date)
  const startOfYear = Date.UTC(year, 0, 0)
  const currentDay = Date.UTC(year, month - 1, day)

  return Math.floor((currentDay - startOfYear) / 86_400_000)
}

export function getFallbackVerse(dayOfYear = getParisDayOfYear()) {
  const index = (dayOfYear - 1) % fallbackVerses.length

  return {
    ...fallbackVerses[index],
    day_of_year: dayOfYear,
  }
}

export async function getDailyBibleVerse(date = new Date()) {
  const dayOfYear = getParisDayOfYear(date)
  const fallbackVerse = getFallbackVerse(dayOfYear)
  const localDate = getLocalDateKey(date, "Europe/Paris")

  try {
    const scheduled = await prisma.dailyVerseSchedule.findFirst({
      where: {
        localDate,
        status: {
          in: [DailyVerseScheduleStatus.SCHEDULED, DailyVerseScheduleStatus.SENT],
        },
      },
      orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        book: true,
        chapter: true,
        verseStart: true,
        verseEnd: true,
        reference: true,
        verseText: true,
        translation: true,
        theme: true,
        localDate: true,
      },
    })

    if (scheduled) {
      return {
        id: scheduled.id,
        day_of_year: dayOfYear,
        book: scheduled.book,
        chapter: scheduled.chapter,
        verseStart: scheduled.verseStart,
        verseEnd: scheduled.verseEnd,
        reference: scheduled.reference,
        text: scheduled.verseText,
        translation: scheduled.translation,
        theme: scheduled.theme,
        isScheduled: true,
        localDate: scheduled.localDate,
      } satisfies DailyBibleVerse
    }

    const verse = await prisma.dailyBibleVerse.findUnique({
      where: { dayOfYear },
      select: {
        id: true,
        dayOfYear: true,
        reference: true,
        text: true,
        translation: true,
        theme: true,
      },
    })

    if (!verse) {
      return fallbackVerse
    }

    return {
      id: verse.id,
      day_of_year: verse.dayOfYear,
      reference: verse.reference,
      text: verse.text,
      translation: verse.translation,
      theme: verse.theme,
    } satisfies DailyBibleVerse
  } catch {
    return fallbackVerse
  }
}

export async function getAdjacentSentDailyVerses(date = new Date()) {
  const localDate = getLocalDateKey(date, "Europe/Paris")
  const select = {
    id: true,
    localDate: true,
    reference: true,
    verseText: true,
    translation: true,
  }

  try {
    const [previous, next] = await Promise.all([
      prisma.dailyVerseSchedule.findFirst({
        where: {
          status: DailyVerseScheduleStatus.SENT,
          localDate: { lt: localDate },
        },
        orderBy: { localDate: "desc" },
        select,
      }),
      prisma.dailyVerseSchedule.findFirst({
        where: {
          status: DailyVerseScheduleStatus.SENT,
          localDate: { gt: localDate },
        },
        orderBy: { localDate: "asc" },
        select,
      }),
    ])

    return { previous, next }
  } catch {
    return { previous: null, next: null }
  }
}
