import "server-only"

import { requireCurrentAppUser } from "@/lib/auth/clerk-user"
import { prisma } from "@/lib/prisma"

const memberNotificationPageSize = 10

export async function getUnreadNotificationCountForCurrentUser() {
  const user = await requireCurrentAppUser("/espace-membre/notifications")

  return prisma.notificationRecipient.count({
    where: {
      userId: user.id,
      readAt: null,
      archivedAt: null,
    },
  })
}

export async function getMemberNotificationCenterData(options: {
  page?: string | number
  markReadId?: string | null
} = {}) {
  const user = await requireCurrentAppUser("/espace-membre/notifications")
  const requestedPage = Math.max(1, Number(options.page) || 1)

  if (options.markReadId) {
    await prisma.notificationRecipient.updateMany({
      where: {
        id: options.markReadId,
        userId: user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    })
  }

  const where = {
    userId: user.id,
    archivedAt: null,
  }

  const [total, unread, activeDevices, notifications] = await Promise.all([
    prisma.notificationRecipient.count({ where }),
    prisma.notificationRecipient.count({ where: { ...where, readAt: null } }),
    prisma.pushSubscription.count({
      where: { userId: user.id, isActive: true, revokedAt: null },
    }),
    prisma.notificationRecipient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (requestedPage - 1) * memberNotificationPageSize,
      take: memberNotificationPageSize,
      select: {
        id: true,
        readAt: true,
        archivedAt: true,
        createdAt: true,
        campaign: {
          select: {
            id: true,
            type: true,
            title: true,
            body: true,
            targetUrl: true,
            sourceType: true,
            sourceId: true,
            createdAt: true,
          },
        },
      },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / memberNotificationPageSize))
  const page = Math.min(requestedPage, totalPages)

  return {
    user,
    unread,
    total,
    activeDevices,
    notifications,
    pagination: {
      page,
      pageSize: memberNotificationPageSize,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  }
}
