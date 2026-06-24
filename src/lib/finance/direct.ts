"use server"

import "server-only"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  ChurchRole,
  DirectDonationKind,
  DirectDonationStatus,
  DonationFrequency,
  DonationSource,
  DonationStatus,
  EventStatus,
  MembershipStatus,
} from "@/generated/prisma/enums"
import type { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { requireFinancePermission } from "@/lib/finance/data"
import {
  createDirectDonationCorrectionNotification,
  createDirectDonationRecordedNotification,
  createDirectDonationVerifiedNotification,
} from "@/lib/finance/notifications"

export type DirectDonationActionState = {
  ok: boolean
  message: string
  donationId?: string
}

const directPageSize = 12
const allowedDirectRoles = new Set<ChurchRole>([
  ChurchRole.FINANCE,
  ChurchRole.MASTER,
  ChurchRole.CREATOR,
])
const correctionRoles = new Set<ChurchRole>([ChurchRole.MASTER, ChurchRole.CREATOR])

type DirectFilters = {
  q?: string
  kind?: string
  directStatus?: string
  category?: string
  from?: string
  to?: string
  page?: string | number
}

function cleanText(value: FormDataEntryValue | null, maxLength = 240) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, maxLength)
    : ""
}

function nullableText(value: FormDataEntryValue | null, maxLength = 240) {
  return cleanText(value, maxLength) || null
}

function parseDateTime(value: FormDataEntryValue | null) {
  const raw = cleanText(value, 40)
  const date = raw ? new Date(raw) : new Date()

  if (Number.isNaN(date.getTime())) return null
  return date
}

function parseDate(value: string | null | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}T00:00:00.000`)
  if (Number.isNaN(date.getTime())) return undefined
  if (endOfDay) date.setHours(23, 59, 59, 999)
  return date
}

function parseAmountCents(value: FormDataEntryValue | null) {
  const raw = cleanText(value, 30).replace(",", ".")
  const numeric = Number(raw)

  if (!Number.isFinite(numeric) || numeric <= 0) return null
  return Math.round(numeric * 100)
}

function enumValue<T extends Record<string, string>>(
  enumObject: T,
  value: string | null | undefined,
) {
  const raw = String(value ?? "").toUpperCase()
  const values = new Set(Object.values(enumObject))

  return values.has(raw as T[keyof T]) ? (raw as T[keyof T]) : undefined
}

function contains(value: string | null) {
  return value ? { contains: value, mode: "insensitive" as const } : undefined
}

function fullName(user: {
  firstName: string | null
  lastName: string | null
  email: string
  profile: { displayName: string | null } | null
}) {
  return (
    user.profile?.displayName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email
  )
}

function assertDirectRole(role: ChurchRole, path: string) {
  if (!allowedDirectRoles.has(role)) {
    redirect(path === "/admin/dons/directs" ? "/admin/finance" : "/admin")
  }
}

async function requireDirectDonationAdmin(path = "/admin/dons/directs") {
  const actor = await requireFinancePermission("donations.read_all", path)
  assertDirectRole(actor.role, path)
  return actor
}

async function getActiveCategory(categoryId: string) {
  if (!categoryId) return null

  return prisma.donationCategory.findFirst({
    where: { id: categoryId, isActive: true },
    select: { id: true, label: true, slug: true },
  })
}

async function getTrustedActiveMember(userId: string) {
  if (!userId) return null

  return prisma.appUser.findFirst({
    where: {
      id: userId,
      membershipStatus: MembershipStatus.ACTIVE,
      archivedAt: null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      profile: {
        select: {
          displayName: true,
          memberId: true,
          avatarUrl: true,
        },
      },
    },
  })
}

async function ensureEvent(eventId: string | null) {
  if (!eventId) return null

  return prisma.churchEvent.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, startsAt: true },
  })
}

async function createAudit(input: {
  actorUserId: string
  actorMemberId: string | null
  action: string
  donationId: string
  summary: string
  metadata?: Prisma.InputJsonValue
}) {
  await prisma.adminAuditLog.create({
    data: {
      actorUserId: input.actorUserId,
      actorMemberId: input.actorMemberId,
      action: input.action,
      entityType: "donation",
      entityId: input.donationId,
      summary: input.summary,
      metadata: input.metadata ?? {},
    },
  })
}

function directStatusToDonationStatus(status: DirectDonationStatus) {
  if (status === DirectDonationStatus.VERIFIED) return DonationStatus.SUCCEEDED
  if (status === DirectDonationStatus.CANCELLED) return DonationStatus.CANCELLED
  return DonationStatus.PENDING
}

function buildDirectWhere(filters: DirectFilters) {
  const q = filters.q?.trim() || null
  const kind = enumValue(DirectDonationKind, filters.kind)
  const directStatus = enumValue(DirectDonationStatus, filters.directStatus)
  const gte = parseDate(filters.from)
  const lte = parseDate(filters.to, true)

  const where: Prisma.DonationWhereInput = {
    source: DonationSource.DIRECT,
    directKind: kind,
    directStatus,
    categoryId: filters.category || undefined,
    receivedAt: gte || lte ? { gte, lte } : undefined,
    OR: q
      ? [
          { donorNameSnapshot: contains(q) },
          { memberIdSnapshot: contains(q) },
          { donorEmailSnapshot: contains(q) },
          { collectionLabel: contains(q) },
          { manualReference: contains(q) },
          { event: { title: contains(q) } },
        ]
      : undefined,
  }

  return where
}

export async function searchFinanceMembers(query: string) {
  await requireDirectDonationAdmin("/admin/dons/directs/nouveau")
  const q = query.trim().slice(0, 80)

  if (q.length < 2) return []

  const members = await prisma.appUser.findMany({
    where: {
      membershipStatus: MembershipStatus.ACTIVE,
      archivedAt: null,
      OR: [
        { firstName: contains(q) },
        { lastName: contains(q) },
        { email: contains(q) },
        { profile: { memberId: contains(q) } },
        { profile: { displayName: contains(q) } },
      ],
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: 8,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      membershipStatus: true,
      profile: {
        select: {
          displayName: true,
          memberId: true,
          avatarUrl: true,
        },
      },
    },
  })

  return members.map((member) => ({
    id: member.id,
    name: fullName(member),
    email: member.email,
    imageUrl: member.profile?.avatarUrl ?? member.imageUrl,
    memberId: member.profile?.memberId,
    membershipStatus: member.membershipStatus,
  }))
}

export async function getDirectDonationFormData() {
  await requireDirectDonationAdmin("/admin/dons/directs/nouveau")
  const [categories, events] = await Promise.all([
    prisma.donationCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
    prisma.churchEvent.findMany({
      where: { status: { in: [EventStatus.PUBLISHED, EventStatus.SCHEDULED] } },
      orderBy: { startsAt: "desc" },
      take: 30,
      select: { id: true, title: true, startsAt: true },
    }),
  ])

  return { categories, events }
}

export async function listDirectDonations(filters: DirectFilters = {}) {
  await requireDirectDonationAdmin("/admin/dons/directs")
  const requestedPage = Math.max(1, Number(filters.page) || 1)
  const where = buildDirectWhere(filters)

  const [total, categories, statusCounts] = await Promise.all([
    prisma.donation.count({ where }),
    prisma.donationCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
    prisma.donation.groupBy({
      by: ["directStatus"],
      where,
      _count: { _all: true },
    }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / directPageSize))
  const page = Math.min(requestedPage, totalPages)
  const donations = await prisma.donation.findMany({
    where,
    orderBy: [{ receivedAt: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * directPageSize,
    take: directPageSize,
    include: {
      category: { select: { label: true, slug: true } },
      event: { select: { title: true, startsAt: true } },
      enteredBy: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          profile: { select: { displayName: true, memberId: true } },
        },
      },
      verifiedBy: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          profile: { select: { displayName: true, memberId: true } },
        },
      },
    },
  })

  return {
    donations,
    categories,
    statusCounts: {
      recorded:
        statusCounts.find(
          (item) => item.directStatus === DirectDonationStatus.RECORDED,
        )?._count._all ?? 0,
      verified:
        statusCounts.find(
          (item) => item.directStatus === DirectDonationStatus.VERIFIED,
        )?._count._all ?? 0,
      cancelled:
        statusCounts.find(
          (item) => item.directStatus === DirectDonationStatus.CANCELLED,
        )?._count._all ?? 0,
    },
    pagination: {
      page,
      totalPages,
      total,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  }
}

export async function getDirectDonationDetail(id: string) {
  const actor = await requireDirectDonationAdmin(`/admin/dons/directs/${id}`)
  const donation = await prisma.donation.findFirst({
    where: { id, source: DonationSource.DIRECT },
    include: {
      category: true,
      event: { select: { id: true, title: true, startsAt: true } },
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          profile: { select: { memberId: true, displayName: true, avatarUrl: true } },
        },
      },
      enteredBy: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          profile: { select: { displayName: true, memberId: true } },
        },
      },
      verifiedBy: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          profile: { select: { displayName: true, memberId: true } },
        },
      },
      cancelledBy: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          profile: { select: { displayName: true, memberId: true } },
        },
      },
      replacesDonation: {
        select: { id: true, amountCents: true, directStatus: true },
      },
      replacedByDonations: {
        select: { id: true, amountCents: true, directStatus: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!donation) redirect("/admin/dons/directs")

  const auditLogs = await prisma.adminAuditLog.findMany({
    where: { entityType: "donation", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      actor: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          profile: { select: { displayName: true, memberId: true } },
        },
      },
    },
  })

  return {
    actor,
    donation,
    auditLogs,
    canCancelVerified:
      donation.directStatus === DirectDonationStatus.VERIFIED &&
      correctionRoles.has(actor.role),
    canCorrect:
      donation.directStatus === DirectDonationStatus.VERIFIED &&
      correctionRoles.has(actor.role),
  }
}

export async function createDirectDonationAction(
  _previous: DirectDonationActionState,
  formData: FormData,
): Promise<DirectDonationActionState> {
  const actor = await requireDirectDonationAdmin("/admin/dons/directs/nouveau")
  const kind = enumValue(DirectDonationKind, cleanText(formData.get("kind"), 40))
  const amountCents = parseAmountCents(formData.get("amount"))
  const categoryId = cleanText(formData.get("categoryId"), 100)
  const receivedAt = parseDateTime(formData.get("receivedAt"))
  const eventId = nullableText(formData.get("eventId"), 100)
  const collectionLabel = nullableText(formData.get("collectionLabel"), 180)
  const internalNote = nullableText(formData.get("internalNote"), 500)
  const manualReference = nullableText(formData.get("manualReference"), 120)
  const requestId = cleanText(formData.get("directEntryRequestId"), 120)

  if (!kind || !amountCents || !receivedAt || !requestId) {
    return { ok: false, message: "Informations de don direct invalides." }
  }

  const existingByRequest = await prisma.donation.findUnique({
    where: { directEntryRequestId: requestId },
    select: { id: true },
  })

  if (existingByRequest) {
    return {
      ok: true,
      message: "Ce don direct existe deja.",
      donationId: existingByRequest.id,
    }
  }

  const [category, event] = await Promise.all([
    getActiveCategory(categoryId),
    ensureEvent(eventId),
  ])

  if (!category) return { ok: false, message: "Categorie indisponible." }
  if (eventId && !event) return { ok: false, message: "Evenement introuvable." }

  const selectedMember =
    kind === DirectDonationKind.IDENTIFIED
      ? await getTrustedActiveMember(cleanText(formData.get("memberUserId"), 100))
      : null

  if (kind === DirectDonationKind.IDENTIFIED && !selectedMember) {
    return { ok: false, message: "Selectionnez un membre actif valide." }
  }

  if (
    kind === DirectDonationKind.IDENTIFIED &&
    !selectedMember?.profile?.memberId
  ) {
    return {
      ok: false,
      message: "Ce membre n'a pas encore d'identifiant MegVie valide.",
    }
  }

  if (
    kind === DirectDonationKind.ANONYMOUS_COLLECTION &&
    !collectionLabel &&
    !event
  ) {
    return {
      ok: false,
      message: "Ajoutez un libelle de collecte ou choisissez un evenement.",
    }
  }

  const donation = await prisma.donation.create({
    data: {
      source: DonationSource.DIRECT,
      directKind: kind,
      directStatus: DirectDonationStatus.RECORDED,
      status: DonationStatus.PENDING,
      frequency: DonationFrequency.ONE_TIME,
      amountCents,
      currency: "eur",
      categoryId: category.id,
      userId: selectedMember?.id ?? null,
      memberIdSnapshot: selectedMember?.profile?.memberId ?? null,
      donorNameSnapshot: selectedMember
        ? fullName(selectedMember)
        : "Donateurs anonymes",
      donorEmailSnapshot: selectedMember?.email ?? null,
      receivedAt,
      eventId: event?.id ?? null,
      collectionLabel: collectionLabel ?? event?.title ?? null,
      internalNote,
      manualReference,
      enteredByUserId: actor.id,
      directEntryRequestId: requestId,
    },
  })

  await createAudit({
    actorUserId: actor.id,
    actorMemberId: actor.profile?.memberId ?? null,
    action:
      kind === DirectDonationKind.ANONYMOUS_COLLECTION
        ? "direct_donation.anonymous_collection_recorded"
        : "direct_donation.identified_recorded",
    donationId: donation.id,
    summary: "Don direct enregistre.",
    metadata: {
      source: DonationSource.DIRECT,
      directKind: kind,
      directStatus: DirectDonationStatus.RECORDED,
      amountCents,
      categoryId: category.id,
      memberIdSnapshot: donation.memberIdSnapshot,
      eventId: event?.id ?? null,
    },
  })

  if (selectedMember) {
    await createDirectDonationRecordedNotification({
      userId: selectedMember.id,
      donationId: donation.id,
    })
  }

  revalidateDirectPaths()
  return { ok: true, message: "Don direct enregistre.", donationId: donation.id }
}

export async function verifyDirectDonationAction(
  _previous: DirectDonationActionState,
  formData: FormData,
): Promise<DirectDonationActionState> {
  const actor = await requireDirectDonationAdmin("/admin/dons/directs")
  const id = cleanText(formData.get("id"), 100)
  const donation = await prisma.donation.findUnique({ where: { id } })

  if (!donation || donation.source !== DonationSource.DIRECT) {
    return { ok: false, message: "Don direct introuvable." }
  }

  if (donation.directStatus === DirectDonationStatus.VERIFIED) {
    return { ok: true, message: "Don direct deja verifie.", donationId: id }
  }

  if (donation.directStatus !== DirectDonationStatus.RECORDED) {
    return { ok: false, message: "Ce don direct ne peut pas etre verifie." }
  }

  await prisma.donation.update({
    where: { id },
    data: {
      directStatus: DirectDonationStatus.VERIFIED,
      status: directStatusToDonationStatus(DirectDonationStatus.VERIFIED),
      verifiedAt: new Date(),
      verifiedByUserId: actor.id,
      donatedAt: donation.receivedAt ?? new Date(),
    },
  })

  await createAudit({
    actorUserId: actor.id,
    actorMemberId: actor.profile?.memberId ?? null,
    action: "direct_donation.verified",
    donationId: id,
    summary: "Don direct verifie.",
    metadata: {
      previousStatus: donation.directStatus,
      newStatus: DirectDonationStatus.VERIFIED,
      amountCents: donation.amountCents,
      categoryId: donation.categoryId,
      memberIdSnapshot: donation.memberIdSnapshot,
    },
  })

  await createDirectDonationVerifiedNotification({
    userId: donation.userId,
    donationId: id,
  })

  revalidateDirectPaths(id)
  return { ok: true, message: "Don direct verifie.", donationId: id }
}

export async function cancelDirectDonationAction(
  _previous: DirectDonationActionState,
  formData: FormData,
): Promise<DirectDonationActionState> {
  const actor = await requireDirectDonationAdmin("/admin/dons/directs")
  const id = cleanText(formData.get("id"), 100)
  const reason = cleanText(formData.get("reason"), 500)
  const donation = await prisma.donation.findUnique({ where: { id } })

  if (!reason || reason.length < 4) {
    return { ok: false, message: "Motif obligatoire pour annuler." }
  }

  if (!donation || donation.source !== DonationSource.DIRECT) {
    return { ok: false, message: "Don direct introuvable." }
  }

  if (donation.directStatus === DirectDonationStatus.CANCELLED) {
    return { ok: true, message: "Don direct deja annule.", donationId: id }
  }

  if (
    donation.directStatus === DirectDonationStatus.VERIFIED &&
    !correctionRoles.has(actor.role)
  ) {
    return {
      ok: false,
      message: "Seuls Master et Creator peuvent annuler un don verifie.",
    }
  }

  await prisma.donation.update({
    where: { id },
    data: {
      directStatus: DirectDonationStatus.CANCELLED,
      status: directStatusToDonationStatus(DirectDonationStatus.CANCELLED),
      cancelledAt: new Date(),
      cancelledByUserId: actor.id,
      cancellationReason: reason,
    },
  })

  await createAudit({
    actorUserId: actor.id,
    actorMemberId: actor.profile?.memberId ?? null,
    action: "direct_donation.cancelled",
    donationId: id,
    summary: "Don direct annule.",
    metadata: {
      previousStatus: donation.directStatus,
      newStatus: DirectDonationStatus.CANCELLED,
      amountCents: donation.amountCents,
      categoryId: donation.categoryId,
      reason,
    },
  })

  revalidateDirectPaths(id)
  return { ok: true, message: "Don direct annule.", donationId: id }
}

export async function correctVerifiedDirectDonationAction(
  _previous: DirectDonationActionState,
  formData: FormData,
): Promise<DirectDonationActionState> {
  const actor = await requireDirectDonationAdmin("/admin/dons/directs")

  if (!correctionRoles.has(actor.role)) {
    return { ok: false, message: "Correction reservee a Master et Creator." }
  }

  const originalId = cleanText(formData.get("id"), 100)
  const reason = cleanText(formData.get("reason"), 500)
  const amountCents = parseAmountCents(formData.get("amount"))
  const categoryId = cleanText(formData.get("categoryId"), 100)
  const requestId = cleanText(formData.get("directEntryRequestId"), 120)
  const receivedAt = parseDateTime(formData.get("receivedAt"))

  if (!reason || reason.length < 4 || !amountCents || !requestId || !receivedAt) {
    return { ok: false, message: "Correction invalide ou motif manquant." }
  }

  const original = await prisma.donation.findUnique({
    where: { id: originalId },
  })

  if (
    !original ||
    original.source !== DonationSource.DIRECT ||
    original.directStatus !== DirectDonationStatus.VERIFIED
  ) {
    return { ok: false, message: "Seul un don direct verifie peut etre corrige." }
  }

  const category = await getActiveCategory(categoryId || original.categoryId)
  if (!category) return { ok: false, message: "Categorie indisponible." }

  const existingByRequest = await prisma.donation.findUnique({
    where: { directEntryRequestId: requestId },
    select: { id: true },
  })

  if (existingByRequest) {
    return {
      ok: true,
      message: "Correction deja creee.",
      donationId: existingByRequest.id,
    }
  }

  const replacement = await prisma.$transaction(async (tx) => {
    await tx.donation.update({
      where: { id: original.id },
      data: {
        directStatus: DirectDonationStatus.CANCELLED,
        status: DonationStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledByUserId: actor.id,
        correctionReason: reason,
        cancellationReason: reason,
      },
    })

    return tx.donation.create({
      data: {
        source: DonationSource.DIRECT,
        directKind: original.directKind,
        directStatus: DirectDonationStatus.RECORDED,
        status: DonationStatus.PENDING,
        frequency: DonationFrequency.ONE_TIME,
        amountCents,
        currency: "eur",
        categoryId: category.id,
        userId: original.userId,
        memberIdSnapshot: original.memberIdSnapshot,
        donorNameSnapshot: original.donorNameSnapshot,
        donorEmailSnapshot: original.donorEmailSnapshot,
        receivedAt,
        eventId: original.eventId,
        collectionLabel: original.collectionLabel,
        internalNote: original.internalNote,
        manualReference: original.manualReference,
        enteredByUserId: actor.id,
        correctionReason: reason,
        replacesDonationId: original.id,
        directEntryRequestId: requestId,
      },
    })
  })

  await createAudit({
    actorUserId: actor.id,
    actorMemberId: actor.profile?.memberId ?? null,
    action: "direct_donation.corrected",
    donationId: original.id,
    summary: "Don direct corrige avec remplacement.",
    metadata: {
      replacementDonationId: replacement.id,
      previousAmountCents: original.amountCents,
      replacementAmountCents: replacement.amountCents,
      reason,
    },
  })

  await createAudit({
    actorUserId: actor.id,
    actorMemberId: actor.profile?.memberId ?? null,
    action: "direct_donation.replacement_created",
    donationId: replacement.id,
    summary: "Remplacement de don direct cree.",
    metadata: {
      originalDonationId: original.id,
      amountCents: replacement.amountCents,
      categoryId: replacement.categoryId,
      reason,
    },
  })

  await createDirectDonationCorrectionNotification({
    userId: original.userId,
    donationId: replacement.id,
  })

  revalidateDirectPaths(original.id)
  revalidateDirectPaths(replacement.id)
  return {
    ok: true,
    message: "Correction creee. Le remplacement est enregistre.",
    donationId: replacement.id,
  }
}

function revalidateDirectPaths(id?: string) {
  revalidatePath("/admin/finance")
  revalidatePath("/admin/dons/directs")
  revalidatePath("/espace-membre/dons")
  if (id) revalidatePath(`/admin/dons/directs/${id}`)
}
