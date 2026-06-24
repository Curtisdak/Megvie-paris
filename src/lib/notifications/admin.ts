import "server-only"

import {
  NotificationCampaignStatus,
  NotificationType,
  PushDeliveryStatus,
} from "@/generated/prisma/enums"
import { requirePermission } from "@/lib/auth/clerk-user"
import { prisma } from "@/lib/prisma"

const notificationAdminPageSize = 12

function contains(value: string | null) {
  return value ? { contains: value, mode: "insensitive" as const } : undefined
}

function enumValue<T extends Record<string, string>>(
  enumObject: T,
  value: string | null | undefined,
) {
  const raw = String(value ?? "").toUpperCase()
  const values = new Set(Object.values(enumObject))

  return values.has(raw as T[keyof T]) ? (raw as T[keyof T]) : undefined
}

function parseDate(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export async function listNotificationCampaigns(options: {
  type?: string
  status?: string
  source?: string
  from?: string
  to?: string
  page?: string | number
} = {}) {
  await requirePermission("notifications.manage", "/admin/notifications")
  const requestedPage = Math.max(1, Number(options.page) || 1)
  const type = enumValue(NotificationType, options.type)
  const status = enumValue(NotificationCampaignStatus, options.status)
  const from = parseDate(options.from)
  const to = parseDate(options.to)
  const sourceFilter = contains(options.source?.trim() || null)
  const createdAt =
    from || to
      ? {
          gte: from,
          lt: to ? new Date(to.getTime() + 86_400_000) : undefined,
        }
      : undefined
  const where = {
    type,
    status,
    createdAt,
    OR: sourceFilter
      ? [
          { sourceType: sourceFilter },
          { sourceId: sourceFilter },
          { title: sourceFilter },
        ]
      : undefined,
  }
  const [total, pending, completed, partial, failed, campaigns] =
    await Promise.all([
      prisma.notificationCampaign.count(),
      prisma.notificationCampaign.count({
        where: {
          status: {
            in: [
              NotificationCampaignStatus.SCHEDULED,
              NotificationCampaignStatus.PENDING,
              NotificationCampaignStatus.PROCESSING,
            ],
          },
        },
      }),
      prisma.notificationCampaign.count({
        where: { status: NotificationCampaignStatus.COMPLETED },
      }),
      prisma.notificationCampaign.count({
        where: { status: NotificationCampaignStatus.PARTIAL },
      }),
      prisma.notificationCampaign.count({
        where: { status: NotificationCampaignStatus.FAILED },
      }),
      prisma.notificationCampaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (requestedPage - 1) * notificationAdminPageSize,
        take: notificationAdminPageSize,
        select: {
          id: true,
          title: true,
          body: true,
          type: true,
          audienceType: true,
          sourceType: true,
          sourceId: true,
          status: true,
          scheduledFor: true,
          processingStartedAt: true,
          completedAt: true,
          cancelledAt: true,
          createdAt: true,
          createdBy: {
            select: { firstName: true, lastName: true, email: true },
          },
          recipients: {
            select: { readAt: true },
          },
          deliveryAttempts: {
            select: { status: true, safeErrorCode: true },
          },
        },
      }),
    ])
  const filtered = await prisma.notificationCampaign.count({ where })
  const totalPages = Math.max(1, Math.ceil(filtered / notificationAdminPageSize))
  const page = Math.min(requestedPage, totalPages)

  return {
    counts: { total, pending, completed, partial, failed },
    campaigns: campaigns.map((campaign) => {
      const deliveryCounts = {
        accepted: 0,
        failed: 0,
        expired: 0,
        skipped: 0,
        retrying: 0,
      }
      const errorSummary = new Map<string, number>()

      for (const attempt of campaign.deliveryAttempts) {
        if (attempt.status === PushDeliveryStatus.ACCEPTED) {
          deliveryCounts.accepted += 1
        } else if (attempt.status === PushDeliveryStatus.EXPIRED) {
          deliveryCounts.expired += 1
        } else if (attempt.status === PushDeliveryStatus.SKIPPED) {
          deliveryCounts.skipped += 1
        } else if (attempt.status === PushDeliveryStatus.RETRY) {
          deliveryCounts.retrying += 1
        } else if (attempt.status === PushDeliveryStatus.FAILED) {
          deliveryCounts.failed += 1
        }

        if (attempt.safeErrorCode) {
          errorSummary.set(
            attempt.safeErrorCode,
            (errorSummary.get(attempt.safeErrorCode) ?? 0) + 1,
          )
        }
      }

      return {
        ...campaign,
        recipientCount: campaign.recipients.length,
        readCount: campaign.recipients.filter((recipient) => recipient.readAt)
          .length,
        deliveryCounts,
        errorSummary: [...errorSummary.entries()],
      }
    }),
    pagination: {
      page,
      pageSize: notificationAdminPageSize,
      filtered,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  }
}
