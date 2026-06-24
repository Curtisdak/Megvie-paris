"use server"

import { revalidatePath } from "next/cache"
import {
  NotificationAudienceType,
  NotificationCampaignStatus,
  NotificationType,
  PushDeliveryStatus,
} from "@/generated/prisma/enums"
import { checkRateLimit } from "@/lib/auth/rate-limit"
import { requirePermission } from "@/lib/auth/clerk-user"
import { prisma } from "@/lib/prisma"
import {
  createNotificationCampaign,
  processDuePushAttempts,
} from "@/lib/notifications/service"

export async function cancelNotificationCampaignAction(formData: FormData) {
  const actor = await requirePermission(
    "notifications.manage",
    "/admin/notifications",
  )
  const campaignId = String(formData.get("campaignId") ?? "")

  if (!campaignId) {
    return
  }

  const campaign = await prisma.notificationCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true, title: true },
  })

  if (!campaign) {
    return
  }

  const terminalStatuses: NotificationCampaignStatus[] = [
      NotificationCampaignStatus.COMPLETED,
      NotificationCampaignStatus.PARTIAL,
      NotificationCampaignStatus.FAILED,
      NotificationCampaignStatus.CANCELLED,
  ]

  if (terminalStatuses.includes(campaign.status)) {
    return
  }

  await prisma.$transaction([
    prisma.notificationCampaign.update({
      where: { id: campaign.id },
      data: {
        status: NotificationCampaignStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    }),
    prisma.pushDeliveryAttempt.updateMany({
      where: {
        campaignId: campaign.id,
        status: {
          in: [
            PushDeliveryStatus.PENDING,
            PushDeliveryStatus.RETRY,
            PushDeliveryStatus.PROCESSING,
          ],
        },
      },
      data: { status: PushDeliveryStatus.SKIPPED },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        actorMemberId: actor.profile?.memberId ?? null,
        action: "notification.campaign_cancelled",
        entityType: "notification_campaign",
        entityId: campaign.id,
        summary: campaign.title,
      },
    }),
  ])

  revalidatePath("/admin/notifications")
}

export async function deleteNotificationCampaignAction(formData: FormData) {
  const actor = await requirePermission(
    "notifications.manage",
    "/admin/notifications",
  )
  const campaignId = String(formData.get("campaignId") ?? "")

  if (!campaignId) {
    return
  }

  const campaign = await prisma.notificationCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true, title: true, type: true },
  })

  if (!campaign) {
    return
  }

  await prisma.$transaction([
    prisma.pushDeliveryAttempt.deleteMany({
      where: { campaignId: campaign.id },
    }),
    prisma.notificationRecipient.deleteMany({
      where: { campaignId: campaign.id },
    }),
    prisma.notificationCampaign.delete({
      where: { id: campaign.id },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        actorMemberId: actor.profile?.memberId ?? null,
        action: "notification.campaign_deleted",
        entityType: "notification_campaign",
        entityId: campaign.id,
        summary: campaign.title,
        metadata: { previousStatus: campaign.status, type: campaign.type },
      },
    }),
  ])

  revalidatePath("/admin/notifications")
  revalidatePath("/espace-membre/notifications")
}

export async function retryNotificationCampaignAction(formData: FormData) {
  const actor = await requirePermission(
    "notifications.manage",
    "/admin/notifications",
  )
  const campaignId = String(formData.get("campaignId") ?? "")

  if (!campaignId) {
    return
  }

  const updated = await prisma.pushDeliveryAttempt.updateMany({
    where: {
      campaignId,
      status: PushDeliveryStatus.FAILED,
      safeErrorCode: { notIn: ["HTTP_404", "HTTP_410"] },
    },
    data: {
      status: PushDeliveryStatus.RETRY,
      nextAttemptAt: new Date(),
      failedAt: null,
    },
  })

  if (updated.count === 0) {
    return
  }

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: actor.id,
      actorMemberId: actor.profile?.memberId ?? null,
      action: "notification.campaign_retry_requested",
      entityType: "notification_campaign",
      entityId: campaignId,
      summary: `${updated.count} tentative(s) relancee(s).`,
    },
  })

  await processDuePushAttempts()

  revalidatePath("/admin/notifications")
}

export async function sendAdminTestNotificationAction(_formData?: FormData) {
  void _formData

  const actor = await requirePermission(
    "notifications.manage",
    "/admin/notifications",
  )
  const rateLimit = checkRateLimit(`admin-test-action:${actor.id}`, {
    limit: 5,
    windowMs: 60_000,
  })

  if (!rateLimit.ok) {
    return
  }

  const subscriptionCount = await prisma.pushSubscription.count({
    where: { userId: actor.id, isActive: true, revokedAt: null },
  })

  if (subscriptionCount === 0) {
    return
  }

  const result = await createNotificationCampaign({
    type: NotificationType.TEST,
    title: "Test notification - MegVie Paris",
    body: "Ceci est une notification de test MegVie Paris.",
    targetUrl: "/espace-membre/notifications",
    audienceType: NotificationAudienceType.INDIVIDUAL,
    targetUserId: actor.id,
    createdByUserId: actor.id,
    sourceType: "admin_test",
    sourceId: actor.id,
    dedupeKey: `admin-test:${actor.id}:${Date.now()}`,
    tag: `admin-test:${actor.id}`,
  })
  const summary = await processDuePushAttempts(10)

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: actor.id,
      actorMemberId: actor.profile?.memberId ?? null,
      action: "notification.test_push_sent",
      entityType: "notification_campaign",
      entityId: result.campaign.id,
      summary: "Notification de test envoyee.",
      metadata: { accepted: summary.accepted, failed: summary.failed },
    },
  })

  revalidatePath("/admin/notifications")
}
