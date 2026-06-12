import "server-only"

import { getSupabaseAdminClient } from "@/lib/supabase-admin"

export type DailyBibleVerse = {
  id?: string
  day_of_year: number
  reference: string
  text: string
  translation: string
  theme?: string | null
  isFallback?: boolean
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
  const supabaseConfig = getSupabaseAdminClient()

  if ("error" in supabaseConfig) {
    return fallbackVerse
  }

  const { data, error } = await supabaseConfig.supabase
    .from("daily_bible_verses")
    .select("id, day_of_year, reference, text, translation, theme")
    .eq("day_of_year", dayOfYear)
    .maybeSingle()

  if (error || !data) {
    return fallbackVerse
  }

  return data as DailyBibleVerse
}
