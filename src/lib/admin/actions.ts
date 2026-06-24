"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  AnnouncementStatus,
  ChurchRole,
  ContentVisibility,
  ContactMessageSource,
  ContactMessageStatus,
  EventStatus,
  GalleryAlbumStatus,
  MembershipStatus,
  MessageDeliveryStatus,
} from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/auth/permissions"
import { requireAdminRole, requirePermission } from "@/lib/auth/clerk-user"
import {
  cleanLongText,
  cleanText,
  parseAnnouncementCategory,
  parseAnnouncementStatus,
  parseEventStatus,
  parseGalleryStatus,
  parseMessageDeliveryStatus,
  parseMessageStatus,
  parseOptionalDate,
  parseOptionalDateTime,
  parseUrl,
  parseVisibility,
  slugify,
  validateContactMessage,
  type AdminActionState,
} from "@/lib/admin/validation"
import { uploadImageFromFormData, type UploadedImage } from "@/lib/imagekit"
import {
  cancelPendingEventReminders,
  createAnnouncementNotification,
  createEventCancelledNotification,
  createEventPublishedNotification,
  createEventReminderNotification,
  createPersonalNotification,
  createStaffMessageNotification,
} from "@/lib/notifications/service"

const allowedAdminAssignments = new Set<ChurchRole>([
  ChurchRole.MEMBER,
  ChurchRole.RESPO,
  ChurchRole.FINANCE,
  ChurchRole.MASTER,
])

function formatMemberId(memberNumber: number) {
  return `Mv${String(memberNumber).padStart(5, "0")}P`
}

function memberDisplayName(user: {
  firstName: string | null
  lastName: string | null
  email: string
}) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
}

function readRole(value: FormDataEntryValue | null) {
  const role = cleanText(value, 20).toUpperCase()
  return allowedAdminAssignments.has(role as ChurchRole)
    ? (role as ChurchRole)
    : null
}

function hasCheckbox(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1"
}

function parseReminderDate(formData: FormData, startsAt: Date) {
  const preset = cleanText(formData.get("reminderPreset"), 40)
  const custom = parseOptionalDateTime(formData.get("reminderAt"))

  if (preset === "CUSTOM") return custom
  if (preset === "7_DAYS") return new Date(startsAt.getTime() - 7 * 86_400_000)
  if (preset === "24_HOURS") return new Date(startsAt.getTime() - 24 * 3_600_000)
  if (preset === "2_HOURS") return new Date(startsAt.getTime() - 2 * 3_600_000)

  return null
}

async function resolveImageUpload(
  formData: FormData,
  fieldName: string,
  folder: string,
  fileNamePrefix: string,
) {
  try {
    const image = await uploadImageFromFormData(formData, fieldName, {
      folder,
      fileNamePrefix,
    })

    return { ok: true as const, image }
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'uploader cette image.",
    }
  }
}

function imageUrlFromUploadOrField(
  image: UploadedImage | null,
  formData: FormData,
  urlFieldName: string,
) {
  return image?.url ?? parseUrl(formData.get(urlFieldName))
}

function storageKeyFromUploadOrField(
  image: UploadedImage | null,
  formData: FormData,
  keyFieldName: string,
) {
  return image?.storageKey ?? (cleanText(formData.get(keyFieldName), 240) || null)
}

async function requireMessageAccess(messageId: string, path: string) {
  const actor = await requirePermission("messages.read_general", path)
  const message = await prisma.contactMessage.findUnique({
    where: { id: messageId },
    select: { id: true, confidentiality: true },
  })

  if (!message) {
    return { actor, ok: false as const, message: "Message introuvable." }
  }

  if (
    message.confidentiality === "PASTORAL_CONFIDENTIAL" &&
    !hasPermission(actor.role, "messages.read_confidential")
  ) {
    return { actor, ok: false as const, message: "Acces non autorise." }
  }

  return { actor, ok: true as const, message }
}

export async function approveMemberAdminAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requirePermission(
    "members.approve",
    "/admin/demandes-adhesion",
  )
  const targetUserId = cleanText(formData.get("userId"), 80)

  if (!targetUserId) return { ok: false, message: "Membre introuvable." }

  try {
    await prisma.$transaction(async (tx) => {
      const target = await tx.appUser.findUnique({
        where: { id: targetUserId },
        include: { profile: true },
      })

      if (!target) throw new Error("Membre introuvable.")

      if (
        target.membershipStatus === MembershipStatus.ACTIVE &&
        target.profile?.memberId
      ) {
        return
      }

      let memberNumber = target.profile?.memberNumber ?? null
      let memberId = target.profile?.memberId ?? null

      if (!memberNumber || !memberId) {
        const rows = await tx.$queryRaw<Array<{ nextval: number | bigint }>>`
          SELECT nextval('member_number_seq') AS nextval
        `
        memberNumber = Number(rows[0]?.nextval)

        if (!memberNumber || memberNumber > 99999) {
          throw new Error("La plage des identifiants membre est epuisee.")
        }

        memberId = formatMemberId(memberNumber)
      }

      await tx.appUser.update({
        where: { id: target.id },
        data: { membershipStatus: MembershipStatus.ACTIVE },
      })

      await tx.memberProfile.upsert({
        where: { userId: target.id },
        update: {
          memberNumber,
          memberId,
          joinedAt: target.profile?.joinedAt ?? new Date(),
          approvedAt: new Date(),
          approvedById: actor.id,
          suspendedAt: null,
          rejectedAt: null,
        },
        create: {
          userId: target.id,
          memberNumber,
          memberId,
          joinedAt: new Date(),
          approvedAt: new Date(),
          approvedById: actor.id,
        },
      })

      await tx.adminAuditLog.create({
        data: {
          actorUserId: actor.id,
          actorMemberId: actor.profile?.memberId ?? null,
          action: "member.approved",
          entityType: "app_user",
          entityId: target.id,
          summary: `${memberDisplayName(target)} approuve.`,
          metadata: { memberId },
        },
      })
    })
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'approuver ce membre.",
    }
  }

  await createPersonalNotification({
    userId: targetUserId,
    title: "Adhesion validee",
    body: "Votre compte membre MegVie Paris est maintenant actif.",
    targetUrl: "/espace-membre",
    sourceType: "membership",
    sourceId: targetUserId,
    dedupeKey: `membership-approved:${targetUserId}`,
  })

  revalidatePath("/admin")
  revalidatePath("/admin/demandes-adhesion")
  revalidatePath("/admin/membres")

  return { ok: true, message: "Membre approuve." }
}

export async function rejectMemberAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requirePermission(
    "members.approve",
    "/admin/demandes-adhesion",
  )
  const targetUserId = cleanText(formData.get("userId"), 80)
  const reason = cleanLongText(formData.get("reason"), 800)

  if (!targetUserId || reason.length < 4) {
    return { ok: false, message: "Ajoutez une raison de refus." }
  }

  await prisma.$transaction([
    prisma.appUser.update({
      where: { id: targetUserId },
      data: { membershipStatus: MembershipStatus.REJECTED },
    }),
    prisma.memberProfile.upsert({
      where: { userId: targetUserId },
      update: { rejectedAt: new Date(), suspendedAt: null },
      create: { userId: targetUserId, rejectedAt: new Date() },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        actorMemberId: actor.profile?.memberId ?? null,
        action: "member.rejected",
        entityType: "app_user",
        entityId: targetUserId,
        summary: "Demande d'adhesion refusee.",
        metadata: { reason },
      },
    }),
  ])

  revalidatePath("/admin/demandes-adhesion")
  revalidatePath("/admin/membres")

  return { ok: true, message: "Demande refusee." }
}

export async function updateMemberStatusAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requirePermission("members.suspend", "/admin/membres")
  const targetUserId = cleanText(formData.get("userId"), 80)
  const status = cleanText(formData.get("status"), 20).toUpperCase()
  const reason = cleanLongText(formData.get("reason"), 800)

  if (!targetUserId) return { ok: false, message: "Membre introuvable." }
  if (!["ACTIVE", "SUSPENDED", "ARCHIVED"].includes(status)) {
    return { ok: false, message: "Statut invalide." }
  }
  if ((status === "SUSPENDED" || status === "ARCHIVED") && reason.length < 4) {
    return { ok: false, message: "Ajoutez une raison." }
  }

  const target = await prisma.appUser.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true },
  })

  if (!target) return { ok: false, message: "Membre introuvable." }

  if (target.role === ChurchRole.CREATOR && status !== "ACTIVE") {
    const creatorCount = await prisma.appUser.count({
      where: { role: ChurchRole.CREATOR, archivedAt: null },
    })
    if (creatorCount <= 1) {
      return { ok: false, message: "Impossible de bloquer le dernier Creator." }
    }
  }

  await prisma.$transaction([
    prisma.appUser.update({
      where: { id: target.id },
      data: {
        membershipStatus: status as MembershipStatus,
        archivedAt: status === "ARCHIVED" ? new Date() : null,
      },
    }),
    prisma.memberProfile.upsert({
      where: { userId: target.id },
      update: {
        suspendedAt: status === "SUSPENDED" ? new Date() : null,
      },
      create: {
        userId: target.id,
        suspendedAt: status === "SUSPENDED" ? new Date() : null,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        actorMemberId: actor.profile?.memberId ?? null,
        action: `member.${status.toLowerCase()}`,
        entityType: "app_user",
        entityId: target.id,
        summary: `Statut membre: ${status}.`,
        metadata: reason ? { reason } : undefined,
      },
    }),
  ])

  if (status === "SUSPENDED" || status === "ARCHIVED") {
    await createPersonalNotification({
      userId: target.id,
      title: "Mise a jour de votre compte",
      body: "Une information importante est disponible dans votre espace membre.",
      targetUrl: "/espace-membre/notifications",
      sourceType: "membership_status",
      sourceId: target.id,
      dedupeKey: `membership-status:${target.id}:${status}`,
    })
  }

  revalidatePath("/admin/membres")
  return { ok: true, message: "Statut mis a jour." }
}

export async function updateRoleAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requirePermission("roles.manage", "/admin/membres")
  const targetUserId = cleanText(formData.get("userId"), 80)
  const role = readRole(formData.get("role"))
  const reason = cleanLongText(formData.get("reason"), 800)

  if (!targetUserId || !role) return { ok: false, message: "Role invalide." }
  if (reason.length < 4) {
    return { ok: false, message: "Ajoutez une raison de changement." }
  }

  const target = await prisma.appUser.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      role: true,
      membershipStatus: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!target) return { ok: false, message: "Membre introuvable." }
  if (target.id === actor.id) {
    return { ok: false, message: "Vous ne pouvez pas modifier votre propre role." }
  }
  if (target.role === ChurchRole.CREATOR) {
    return { ok: false, message: "Le Creator ne peut pas etre modifie ici." }
  }
  if (target.membershipStatus !== MembershipStatus.ACTIVE) {
    return { ok: false, message: "Le membre doit etre actif." }
  }

  await prisma.$transaction([
    prisma.appUser.update({ where: { id: target.id }, data: { role } }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        actorMemberId: actor.profile?.memberId ?? null,
        action: "member.role_changed",
        entityType: "app_user",
        entityId: target.id,
        summary: `${memberDisplayName(target)} devient ${role}.`,
        metadata: { from: target.role, to: role, reason },
      },
    }),
  ])

  await createPersonalNotification({
    userId: target.id,
    title: "Mise a jour de votre role",
    body: "Votre role dans l'application MegVie Paris a ete mis a jour.",
    targetUrl: "/espace-membre/notifications",
    sourceType: "role",
    sourceId: target.id,
    dedupeKey: `role:${target.id}:${role}`,
  })

  revalidatePath("/admin/membres")
  return { ok: true, message: "Role mis a jour." }
}

export async function saveEventAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requirePermission("events.manage", "/admin/evenements")
  const id = cleanText(formData.get("id"), 80)
  const title = cleanText(formData.get("title"), 160)
  const startsAt = parseOptionalDateTime(formData.get("startsAt"))
  const endsAt = parseOptionalDateTime(formData.get("endsAt"))
  const status = parseEventStatus(formData.get("status"))
  const publishAt = parseOptionalDateTime(formData.get("publishAt"))

  if (title.length < 3 || !startsAt) {
    return { ok: false, message: "Titre et date de debut obligatoires." }
  }
  if (endsAt && endsAt <= startsAt) {
    return { ok: false, message: "La fin doit etre apres le debut." }
  }

  const imageUpload = await resolveImageUpload(
    formData,
    "coverImageFile",
    "events",
    title,
  )

  if (!imageUpload.ok) return { ok: false, message: imageUpload.message }

  const data = {
    title,
    slug: `${slugify(title)}-${Date.now()}`,
    shortDescription: cleanText(formData.get("shortDescription"), 240) || null,
    description: cleanLongText(formData.get("description"), 5000) || null,
    startsAt,
    endsAt,
    timezone: cleanText(formData.get("timezone"), 80) || "Europe/Paris",
    locationName: cleanText(formData.get("locationName"), 160) || null,
    address: cleanText(formData.get("address"), 240) || null,
    mapUrl: parseUrl(formData.get("mapUrl")),
    registrationUrl: parseUrl(formData.get("registrationUrl")),
    coverImageUrl: imageUrlFromUploadOrField(
      imageUpload.image,
      formData,
      "coverImageUrl",
    ),
    coverImageStorageKey: storageKeyFromUploadOrField(
      imageUpload.image,
      formData,
      "coverImageStorageKey",
    ),
    visibility: ContentVisibility.PUBLIC,
    status,
    publishAt,
    publishedAt: status === EventStatus.PUBLISHED ? new Date() : null,
    archivedAt: status === EventStatus.ARCHIVED ? new Date() : null,
    updatedByUserId: actor.id,
  }

  const previousEvent = id
    ? await prisma.churchEvent.findUnique({
        where: { id },
        select: { startsAt: true },
      })
    : null

  const saved = id
    ? await prisma.churchEvent.update({
        where: { id },
        data: { ...data, slug: undefined },
      })
    : await prisma.churchEvent.create({
        data: { ...data, createdByUserId: actor.id },
      })

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: actor.id,
      actorMemberId: actor.profile?.memberId ?? null,
      action: id ? "event.updated" : "event.created",
      entityType: "church_event",
      entityId: saved.id,
      summary: saved.title,
      metadata: { status: saved.status },
    },
  })

  if (
    previousEvent &&
    previousEvent.startsAt.getTime() !== saved.startsAt.getTime()
  ) {
    await cancelPendingEventReminders(saved.id)
  }

  if (saved.status === EventStatus.CANCELLED) {
    await cancelPendingEventReminders(saved.id)

    if (hasCheckbox(formData.get("notifyCancellation"))) {
      await createEventCancelledNotification({
        eventId: saved.id,
        title: saved.title,
        createdByUserId: actor.id,
      })
    }
  } else if (
    hasCheckbox(formData.get("notifyEventPush")) &&
    (saved.status === EventStatus.PUBLISHED ||
      (saved.status === EventStatus.SCHEDULED && saved.publishAt))
  ) {
    await createEventPublishedNotification({
      eventId: saved.id,
      title: saved.title,
      startsAt: saved.startsAt,
      scheduledFor:
        saved.status === EventStatus.SCHEDULED ? saved.publishAt : null,
      createdByUserId: actor.id,
    })
  }

  const reminderAt = hasCheckbox(formData.get("notifyEventReminder"))
    ? parseReminderDate(formData, saved.startsAt)
    : null

  if (
    reminderAt &&
    reminderAt.getTime() > Date.now() &&
    saved.status !== EventStatus.CANCELLED &&
    saved.status !== EventStatus.ARCHIVED
  ) {
    await createEventReminderNotification({
      eventId: saved.id,
      title: saved.title,
      scheduledFor: reminderAt,
      createdByUserId: actor.id,
    })
  }

  revalidatePath("/admin/evenements")
  revalidatePath("/")
  if (id) revalidatePath(`/admin/evenements/${id}`)

  if (!id && cleanText(formData.get("stayOnPage"), 10) !== "true") {
    redirect(`/admin/evenements/${saved.id}`)
  }
  return { ok: true, message: "Evenement enregistre." }
}

export async function deleteEventAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requirePermission("events.manage", "/admin/evenements")
  const id = cleanText(formData.get("id"), 80)

  if (!id) return { ok: false, message: "Evenement introuvable." }

  const event = await prisma.churchEvent.findUnique({
    where: { id },
    select: { id: true, title: true, status: true },
  })

  if (!event) return { ok: false, message: "Evenement introuvable." }

  await cancelPendingEventReminders(event.id)

  await prisma.$transaction([
    prisma.churchEvent.update({
      where: { id: event.id },
      data: {
        status: EventStatus.ARCHIVED,
        archivedAt: new Date(),
        updatedByUserId: actor.id,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        actorMemberId: actor.profile?.memberId ?? null,
        action: "event.deleted",
        entityType: "church_event",
        entityId: event.id,
        summary: event.title,
        metadata: { previousStatus: event.status },
      },
    }),
  ])

  revalidatePath("/admin/evenements")
  revalidatePath(`/admin/evenements/${event.id}`)
  revalidatePath("/")
  return { ok: true, message: "Evenement supprime." }
}

export async function saveGalleryAlbumAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requirePermission("gallery.manage", "/admin/galerie")
  const title = cleanText(formData.get("title"), 160)

  if (title.length < 3) return { ok: false, message: "Titre obligatoire." }

  const imageUpload = await resolveImageUpload(
    formData,
    "coverImageFile",
    "gallery/albums",
    title,
  )

  if (!imageUpload.ok) return { ok: false, message: imageUpload.message }

  const album = await prisma.galleryAlbum.create({
    data: {
      title,
      slug: `${slugify(title)}-${Date.now()}`,
      description: cleanLongText(formData.get("description"), 2000) || null,
      coverImageUrl: imageUrlFromUploadOrField(
        imageUpload.image,
        formData,
        "coverImageUrl",
      ),
      coverImageStorageKey: storageKeyFromUploadOrField(
        imageUpload.image,
        formData,
        "coverImageStorageKey",
      ),
      status: parseGalleryStatus(formData.get("status")),
      eventDate: parseOptionalDate(formData.get("eventDate")),
      createdByUserId: actor.id,
    },
  })

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: actor.id,
      actorMemberId: actor.profile?.memberId ?? null,
      action: "gallery.album_created",
      entityType: "gallery_album",
      entityId: album.id,
      summary: album.title,
    },
  })

  revalidatePath("/admin/galerie")
  revalidatePath("/")
  return { ok: true, message: "Album cree." }
}

export async function addGalleryItemAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requirePermission("gallery.manage", "/admin/galerie")
  const albumId = cleanText(formData.get("albumId"), 80)
  const imageUpload = await resolveImageUpload(
    formData,
    "imageFile",
    "gallery/items",
    cleanText(formData.get("caption"), 80) || "photo",
  )

  if (!imageUpload.ok) return { ok: false, message: imageUpload.message }

  const imageUrl = imageUrlFromUploadOrField(
    imageUpload.image,
    formData,
    "imageUrl",
  )

  if (!albumId || !imageUrl) {
    return { ok: false, message: "Ajoutez une image valide." }
  }

  const item = await prisma.galleryItem.create({
    data: {
      albumId,
      imageUrl,
      storageKey: storageKeyFromUploadOrField(
        imageUpload.image,
        formData,
        "storageKey",
      ),
      caption: cleanText(formData.get("caption"), 180) || null,
      altText: cleanText(formData.get("altText"), 180) || null,
      uploadedByUserId: actor.id,
    },
  })

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: actor.id,
      actorMemberId: actor.profile?.memberId ?? null,
      action: "gallery.item_added",
      entityType: "gallery_item",
      entityId: item.id,
      summary: "Photo ajoutee a la galerie.",
    },
  })

  revalidatePath("/admin/galerie")
  revalidatePath("/")
  return { ok: true, message: "Photo ajoutee." }
}

export async function updateGalleryAlbumStatusAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requirePermission("gallery.manage", "/admin/galerie")
  const albumId = cleanText(formData.get("albumId"), 80)
  const status = parseGalleryStatus(formData.get("status"))

  if (!albumId) return { ok: false, message: "Album introuvable." }

  const album = await prisma.galleryAlbum.update({
    where: { id: albumId },
    data: {
      status,
      archivedAt: status === GalleryAlbumStatus.ARCHIVED ? new Date() : null,
    },
  })

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: actor.id,
      actorMemberId: actor.profile?.memberId ?? null,
      action: "gallery.album_status_changed",
      entityType: "gallery_album",
      entityId: album.id,
      summary: `${album.title}: ${status}.`,
    },
  })

  revalidatePath("/admin/galerie")
  revalidatePath("/")
  return { ok: true, message: "Statut de l'album mis a jour." }
}

export async function updateMessageStatusAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const messageId = cleanText(formData.get("messageId"), 80)
  const status = parseMessageStatus(formData.get("status"))
  const result = await requireMessageAccess(messageId, `/admin/messages/${messageId}`)

  if (!result.ok) return { ok: false, message: result.message }

  await prisma.$transaction([
    prisma.contactMessage.update({
      where: { id: messageId },
      data: {
        status,
        answeredAt: status === ContactMessageStatus.ANSWERED ? new Date() : undefined,
        archivedAt: status === ContactMessageStatus.ARCHIVED ? new Date() : null,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: result.actor.id,
        actorMemberId: result.actor.profile?.memberId ?? null,
        action: "message.status_changed",
        entityType: "contact_message",
        entityId: messageId,
        summary: `Statut message: ${status}.`,
      },
    }),
  ])

  revalidatePath("/admin/messages")
  revalidatePath(`/admin/messages/${messageId}`)
  return { ok: true, message: "Message mis a jour." }
}

export async function deleteMessageAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const messageId = cleanText(formData.get("messageId"), 80)
  const result = await requireMessageAccess(messageId, "/admin/messages")

  if (!result.ok) return { ok: false, message: result.message }

  await prisma.$transaction([
    prisma.contactMessage.update({
      where: { id: result.message.id },
      data: {
        status: ContactMessageStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: result.actor.id,
        actorMemberId: result.actor.profile?.memberId ?? null,
        action: "message.deleted",
        entityType: "contact_message",
        entityId: result.message.id,
        summary: "Message supprime.",
      },
    }),
  ])

  revalidatePath("/admin/messages")
  revalidatePath(`/admin/messages/${result.message.id}`)
  return { ok: true, message: "Message supprime." }
}

export async function addMessageNoteAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const messageId = cleanText(formData.get("messageId"), 80)
  const body = cleanLongText(formData.get("body"), 2000)
  const result = await requireMessageAccess(messageId, `/admin/messages/${messageId}`)

  if (!result.ok) return { ok: false, message: result.message }
  if (body.length < 3) return { ok: false, message: "Note vide." }

  await prisma.$transaction([
    prisma.messageInternalNote.create({
      data: {
        messageId,
        authorUserId: result.actor.id,
        body,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: result.actor.id,
        actorMemberId: result.actor.profile?.memberId ?? null,
        action: "message.note_added",
        entityType: "contact_message",
        entityId: messageId,
        summary: "Note interne ajoutee.",
      },
    }),
  ])

  revalidatePath(`/admin/messages/${messageId}`)
  return { ok: true, message: "Note ajoutee." }
}

export async function addMessageReplyDraftAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const messageId = cleanText(formData.get("messageId"), 80)
  const body = cleanLongText(formData.get("body"), 3000)
  const deliveryStatus = parseMessageDeliveryStatus(formData.get("deliveryStatus"))
  const result = await requireMessageAccess(messageId, `/admin/messages/${messageId}`)

  if (!result.ok) return { ok: false, message: result.message }
  if (body.length < 10) return { ok: false, message: "Reponse trop courte." }

  await prisma.$transaction([
    prisma.messageReply.create({
      data: {
        messageId,
        authorUserId: result.actor.id,
        body,
        deliveryStatus:
          deliveryStatus === MessageDeliveryStatus.SENT
            ? MessageDeliveryStatus.DRAFT
            : deliveryStatus,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: result.actor.id,
        actorMemberId: result.actor.profile?.memberId ?? null,
        action: "message.reply_drafted",
        entityType: "contact_message",
        entityId: messageId,
        summary: "Reponse enregistree sans envoi email.",
      },
    }),
  ])

  revalidatePath(`/admin/messages/${messageId}`)
  return { ok: true, message: "Reponse enregistree comme brouillon." }
}

export async function saveAnnouncementAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requirePermission("announcements.manage", "/admin/annonces")
  const id = cleanText(formData.get("id"), 80)
  const title = cleanText(formData.get("title"), 160)
  const body = cleanLongText(formData.get("body"), 6000)
  const status = parseAnnouncementStatus(formData.get("status"))

  if (title.length < 3 || body.length < 10) {
    return { ok: false, message: "Titre et contenu obligatoires." }
  }

  const imageUpload = await resolveImageUpload(
    formData,
    "coverImageFile",
    "announcements",
    title,
  )

  if (!imageUpload.ok) return { ok: false, message: imageUpload.message }

  const data = {
    title,
    slug: `${slugify(title)}-${Date.now()}`,
    summary: cleanText(formData.get("summary"), 240) || null,
    body,
    category: parseAnnouncementCategory(formData.get("category")),
    coverImageUrl: imageUrlFromUploadOrField(
      imageUpload.image,
      formData,
      "coverImageUrl",
    ),
    coverImageStorageKey: storageKeyFromUploadOrField(
      imageUpload.image,
      formData,
      "coverImageStorageKey",
    ),
    externalUrl: parseUrl(formData.get("externalUrl")),
    visibility: parseVisibility(formData.get("visibility")),
    status,
    publishAt: parseOptionalDateTime(formData.get("publishAt")),
    publishedAt: status === AnnouncementStatus.PUBLISHED ? new Date() : null,
    expiresAt: parseOptionalDateTime(formData.get("expiresAt")),
    archivedAt: status === AnnouncementStatus.ARCHIVED ? new Date() : null,
    updatedByUserId: actor.id,
  }

  const announcement = id
    ? await prisma.announcement.update({
        where: { id },
        data: { ...data, slug: undefined },
      })
    : await prisma.announcement.create({
        data: { ...data, authorUserId: actor.id },
      })

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: actor.id,
      actorMemberId: actor.profile?.memberId ?? null,
      action: id ? "announcement.updated" : "announcement.created",
      entityType: "announcement",
      entityId: announcement.id,
      summary: announcement.title,
      metadata: { status: announcement.status },
    },
  })

  if (
    hasCheckbox(formData.get("notifyPush")) &&
    (announcement.status === AnnouncementStatus.PUBLISHED ||
      (announcement.status === AnnouncementStatus.SCHEDULED &&
        announcement.publishAt))
  ) {
    await createAnnouncementNotification({
      announcementId: announcement.id,
      title: announcement.title,
      visibility: announcement.visibility,
      scheduledFor:
        announcement.status === AnnouncementStatus.SCHEDULED
          ? announcement.publishAt
          : null,
      createdByUserId: actor.id,
    })
  }

  revalidatePath("/admin/annonces")
  revalidatePath("/")
  revalidatePath("/espace-membre")
  revalidatePath("/espace-membre/annonces")
  return { ok: true, message: "Annonce enregistree." }
}

export async function updateAnnouncementStatusAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requirePermission("announcements.manage", "/admin/annonces")
  const id = cleanText(formData.get("id"), 80)
  const status = parseAnnouncementStatus(formData.get("status"))

  if (!id) return { ok: false, message: "Annonce introuvable." }

  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      status,
      publishedAt: status === AnnouncementStatus.PUBLISHED ? new Date() : undefined,
      archivedAt: status === AnnouncementStatus.ARCHIVED ? new Date() : null,
    },
  })

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: actor.id,
      actorMemberId: actor.profile?.memberId ?? null,
      action: "announcement.status_changed",
      entityType: "announcement",
      entityId: announcement.id,
      summary: `${announcement.title}: ${status}.`,
      metadata: { status },
    },
  })

  if (status === AnnouncementStatus.PUBLISHED && hasCheckbox(formData.get("notifyPush"))) {
    await createAnnouncementNotification({
      announcementId: announcement.id,
      title: announcement.title,
      visibility: announcement.visibility,
      createdByUserId: actor.id,
    })
  }

  revalidatePath("/admin/annonces")
  revalidatePath("/")
  revalidatePath("/espace-membre")
  revalidatePath("/espace-membre/annonces")

  return { ok: true, message: "Statut de l'annonce mis a jour." }
}

export async function deleteAnnouncementAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requirePermission("announcements.manage", "/admin/annonces")
  const id = cleanText(formData.get("id"), 80)

  if (!id) return { ok: false, message: "Annonce introuvable." }

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    select: { id: true, title: true, status: true },
  })

  if (!announcement) return { ok: false, message: "Annonce introuvable." }

  await prisma.$transaction([
    prisma.announcement.update({
      where: { id: announcement.id },
      data: {
        status: AnnouncementStatus.ARCHIVED,
        archivedAt: new Date(),
        updatedByUserId: actor.id,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        actorMemberId: actor.profile?.memberId ?? null,
        action: "announcement.deleted",
        entityType: "announcement",
        entityId: announcement.id,
        summary: announcement.title,
        metadata: { previousStatus: announcement.status },
      },
    }),
  ])

  revalidatePath("/admin/annonces")
  revalidatePath("/")
  revalidatePath("/espace-membre")
  revalidatePath("/espace-membre/annonces")
  return { ok: true, message: "Annonce supprimee." }
}

export async function createContactMessageAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = validateContactMessage(formData)

  if (!parsed.ok) return { ok: false, message: parsed.message }

  const message = await prisma.contactMessage.create({
    data: {
      ...parsed.data,
      source: ContactMessageSource.PUBLIC_CONTACT,
    },
  })

  await createStaffMessageNotification({
    messageId: message.id,
    confidentiality: message.confidentiality,
  })

  revalidatePath("/admin/messages")
  return {
    ok: true,
    message: "Message enregistre. L'equipe MegVie Paris le traitera rapidement.",
  }
}

export async function assertAdminRouteAccess(path: string) {
  await requireAdminRole(path)
}
