import {
  AnnouncementCategory,
  AnnouncementStatus,
  ContactMessageStatus,
  ContentVisibility,
  EventStatus,
  GalleryAlbumStatus,
  MessageConfidentiality,
  MessageDeliveryStatus,
  MembershipStatus,
} from "@/generated/prisma/enums"

export type AdminActionState = {
  ok: boolean
  message: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const httpUrlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i

export function cleanText(
  value: FormDataEntryValue | string | null | undefined,
  maxLength = 160,
) {
  if (typeof value !== "string") return ""
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength)
}

export function cleanLongText(
  value: FormDataEntryValue | string | null | undefined,
  maxLength = 5000,
) {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, maxLength)
}

export function cleanEmail(value: FormDataEntryValue | null) {
  return cleanText(value, 254).toLowerCase()
}

export function hasValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

export function parseOptionalDateTime(value: FormDataEntryValue | null) {
  const raw = cleanText(value, 32)
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

export function parseOptionalDate(value: FormDataEntryValue | null) {
  const raw = cleanText(value, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const date = new Date(`${raw}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function parseUrl(value: FormDataEntryValue | null, maxLength = 500) {
  const raw = cleanText(value, maxLength)
  if (!raw) return null
  return httpUrlPattern.test(raw) ? raw : null
}

export function slugify(value: string) {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)

  return base || `contenu-${Date.now()}`
}

export function parseEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: FormDataEntryValue | null,
  fallback: T[keyof T],
) {
  const raw = cleanText(value, 80).toUpperCase()
  const values = new Set(Object.values(enumObject))

  return values.has(raw as T[keyof T]) ? (raw as T[keyof T]) : fallback
}

export function parseMembershipStatus(value: FormDataEntryValue | null) {
  return parseEnumValue(MembershipStatus, value, MembershipStatus.ACTIVE)
}

export function parseEventStatus(value: FormDataEntryValue | null) {
  return parseEnumValue(EventStatus, value, EventStatus.DRAFT)
}

export function parseVisibility(value: FormDataEntryValue | null) {
  return parseEnumValue(ContentVisibility, value, ContentVisibility.PUBLIC)
}

export function parseGalleryStatus(value: FormDataEntryValue | null) {
  return parseEnumValue(GalleryAlbumStatus, value, GalleryAlbumStatus.DRAFT)
}

export function parseMessageStatus(value: FormDataEntryValue | null) {
  return parseEnumValue(ContactMessageStatus, value, ContactMessageStatus.NEW)
}

export function parseMessageConfidentiality(value: FormDataEntryValue | null) {
  return parseEnumValue(
    MessageConfidentiality,
    value,
    MessageConfidentiality.GENERAL,
  )
}

export function parseMessageDeliveryStatus(value: FormDataEntryValue | null) {
  return parseEnumValue(
    MessageDeliveryStatus,
    value,
    MessageDeliveryStatus.DRAFT,
  )
}

export function parseAnnouncementCategory(value: FormDataEntryValue | null) {
  return parseEnumValue(AnnouncementCategory, value, AnnouncementCategory.GENERAL)
}

export function parseAnnouncementStatus(value: FormDataEntryValue | null) {
  return parseEnumValue(AnnouncementStatus, value, AnnouncementStatus.DRAFT)
}

export function validateContactMessage(formData: FormData) {
  const senderName = cleanText(formData.get("senderName") ?? formData.get("name"), 120)
  const senderEmail = cleanEmail(formData.get("senderEmail") ?? formData.get("email"))
  const senderPhone = cleanText(formData.get("senderPhone") ?? formData.get("phone"), 32)
  const subject = cleanText(formData.get("subject"), 180) || "Message depuis le site"
  const category = cleanText(formData.get("category"), 80) || "GENERAL"
  const body = cleanLongText(formData.get("body") ?? formData.get("message"), 3000)
  const honeypot = cleanText(formData.get("website"), 80)

  if (honeypot) {
    return { ok: false, message: "Message refuse." } as const
  }

  if (senderName.length < 2 || !emailPattern.test(senderEmail) || body.length < 10) {
    return {
      ok: false,
      message: "Indiquez votre nom, un email valide et un message detaille.",
    } as const
  }

  return {
    ok: true,
    data: {
      senderName,
      senderEmail,
      senderPhone: senderPhone || null,
      subject,
      category,
      body,
      confidentiality: parseMessageConfidentiality(formData.get("confidentiality")),
    },
  } as const
}
