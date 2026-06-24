const FALLBACK_NOTIFICATION_URL = "/espace-membre/notifications"

export function safeInternalPath(value: string | null | undefined) {
  const raw = typeof value === "string" ? value.trim() : ""

  if (!raw || raw.length > 500) return FALLBACK_NOTIFICATION_URL
  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return FALLBACK_NOTIFICATION_URL
  }

  try {
    const url = new URL(raw, "https://megvie.local")

    if (url.origin !== "https://megvie.local") {
      return FALLBACK_NOTIFICATION_URL
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return FALLBACK_NOTIFICATION_URL
  }
}

export function truncateForNotification(value: string, maxLength: number) {
  const cleaned = value.trim().replace(/\s+/g, " ")

  if (cleaned.length <= maxLength) return cleaned

  return `${cleaned.slice(0, Math.max(0, maxLength - 3)).trim()}...`
}

export function getChurchTimezone() {
  return process.env.CHURCH_TIMEZONE?.trim() || "Europe/Paris"
}

export function getBirthdayNotificationTime() {
  return process.env.BIRTHDAY_NOTIFICATION_TIME?.trim() || "09:00"
}

export function getPushBatchSize() {
  const parsed = Number(process.env.PUSH_BATCH_SIZE)

  if (!Number.isFinite(parsed) || parsed < 1) return 100

  return Math.min(Math.floor(parsed), 500)
}

export function getLocalDateKey(date = new Date(), timeZone = getChurchTimezone()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const year = parts.find((part) => part.type === "year")?.value ?? "1970"
  const month = parts.find((part) => part.type === "month")?.value ?? "01"
  const day = parts.find((part) => part.type === "day")?.value ?? "01"

  return `${year}-${month}-${day}`
}

export function getLocalMonthDay(
  date = new Date(),
  timeZone = getChurchTimezone(),
) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const month = Number(parts.find((part) => part.type === "month")?.value)
  const day = Number(parts.find((part) => part.type === "day")?.value)

  return { month, day }
}
