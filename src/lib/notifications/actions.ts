"use server"

import { revalidatePath } from "next/cache"
import { checkRateLimit } from "@/lib/auth/rate-limit"
import { requireCurrentAppUser } from "@/lib/auth/clerk-user"
import { prisma } from "@/lib/prisma"

type NotificationActionResult = {
  ok: boolean
  message: string
}

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireCurrentAppUser("/espace-membre/notifications")
  const notificationId = String(formData.get("notificationId") ?? "")

  if (!notificationId) {
    return { ok: false, message: "Notification introuvable." }
  }

  await prisma.notificationRecipient.updateMany({
    where: {
      id: notificationId,
      userId: user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  })

  revalidatePath("/espace-membre/notifications")
  return { ok: true, message: "Notification marquee comme lue." }
}

export async function markNotificationUnreadAction(
  formData: FormData,
): Promise<NotificationActionResult> {
  const user = await requireCurrentAppUser("/espace-membre/notifications")
  const notificationId = String(formData.get("notificationId") ?? "")

  if (!notificationId) {
    return { ok: false, message: "Notification introuvable." }
  }

  await prisma.notificationRecipient.updateMany({
    where: {
      id: notificationId,
      userId: user.id,
      archivedAt: null,
    },
    data: { readAt: null },
  })

  revalidatePath("/espace-membre/notifications")
  return { ok: true, message: "Notification marquee non lue." }
}

export async function markAllNotificationsReadAction(_formData?: FormData) {
  void _formData

  const user = await requireCurrentAppUser("/espace-membre/notifications")
  const rateLimit = checkRateLimit(`notifications-mark-all:${user.id}`, {
    limit: 8,
    windowMs: 60_000,
  })

  if (!rateLimit.ok) {
    return { ok: false, message: "Veuillez patienter avant de recommencer." }
  }

  await prisma.notificationRecipient.updateMany({
    where: {
      userId: user.id,
      readAt: null,
      archivedAt: null,
    },
    data: { readAt: new Date() },
  })

  revalidatePath("/espace-membre/notifications")
  return { ok: true, message: "Toutes les notifications sont lues." }
}

export async function archiveNotificationAction(formData: FormData) {
  const user = await requireCurrentAppUser("/espace-membre/notifications")
  const notificationId = String(formData.get("notificationId") ?? "")

  if (!notificationId) {
    return { ok: false, message: "Notification introuvable." }
  }

  await prisma.notificationRecipient.updateMany({
    where: {
      id: notificationId,
      userId: user.id,
    },
    data: { archivedAt: new Date() },
  })

  revalidatePath("/espace-membre/notifications")
  return { ok: true, message: "Notification archivee." }
}
