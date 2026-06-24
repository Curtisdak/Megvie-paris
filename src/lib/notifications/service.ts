import "server-only"

import {
  AnnouncementStatus,
  ChurchRole,
  DailyVerseScheduleStatus,
  EventStatus,
  MembershipStatus,
  MessageConfidentiality,
  NotificationAudienceType,
  NotificationCampaignStatus,
  NotificationType,
  PushDeliveryStatus,
} from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import {
  getWebPushConfig,
  isExpiredPushSubscriptionError,
  toWebPushSubscription,
  type StoredPushSubscription,
} from "@/lib/push/web-push"
import {
  getChurchTimezone,
  getLocalDateKey,
  getLocalMonthDay,
  getPushBatchSize,
  safeInternalPath,
  truncateForNotification,
} from "@/lib/notifications/safety"

const MAX_PUSH_RETRIES = 3

type SafeMetadata = Record<string, string | number | boolean | null>

type CampaignInput = {
  type: NotificationType
  title: string
  body: string
  targetUrl: string
  audienceType: NotificationAudienceType
  targetRole?: ChurchRole | null
  targetUserId?: string | null
  sourceType?: string | null
  sourceId?: string | null
  scheduledFor?: Date | null
  createdByUserId?: string | null
  dedupeKey: string
  tag?: string | null
  iconUrl?: string | null
  imageUrl?: string | null
  metadata?: SafeMetadata | null
}

type ProcessSummary = {
  attemptsProcessed: number
  accepted: number
  retrying: number
  expired: number
  failed: number
  skipped: number
}

type PushAttemptRow = {
  id: string
  attemptNumber: number
  campaignId: string
  recipientId: string | null
  campaign: {
    id: string
    type: NotificationType
    title: string
    body: string
    targetUrl: string
    tag: string | null
    iconUrl: string | null
    imageUrl: string | null
  }
  pushSubscription: StoredPushSubscription & {
    id: string
    userId: string | null
  }
}

function notificationPreferenceWhere(type: NotificationType) {
  if (type === NotificationType.DAILY_VERSE) {
    return {
      pushEnabled: true,
      dailyVerseEnabled: true,
      dailyVersePushEnabled: true,
    }
  }

  if (type === NotificationType.BIRTHDAY) {
    return {
      pushEnabled: true,
      privateBirthdayGreetingEnabled: true,
      birthdayPushEnabled: true,
    }
  }

  if (type === NotificationType.ANNOUNCEMENT) {
    return {
      pushEnabled: true,
      announcementsEnabled: true,
      announcementPushEnabled: true,
    }
  }

  if (
    type === NotificationType.EVENT_PUBLISHED ||
    type === NotificationType.EVENT_REMINDER ||
    type === NotificationType.EVENT_CANCELLED
  ) {
    return {
      pushEnabled: true,
      eventsEnabled: true,
      eventPushEnabled: true,
    }
  }

  if (
    type === NotificationType.STAFF_NEW_MESSAGE ||
    type === NotificationType.STAFF_CONFIDENTIAL_MESSAGE
  ) {
    return {
      pushEnabled: true,
      staffMessagePushEnabled: true,
    }
  }

  return {
    pushEnabled: true,
    personalPushEnabled: true,
  }
}

function recipientWhereForCampaign(campaign: {
  audienceType: NotificationAudienceType
  targetRole: ChurchRole | null
  targetUserId: string | null
}) {
  const activeMemberWhere = {
    membershipStatus: MembershipStatus.ACTIVE,
    archivedAt: null,
  }

  switch (campaign.audienceType) {
    case NotificationAudienceType.INDIVIDUAL:
      return campaign.targetUserId
        ? { id: campaign.targetUserId, archivedAt: null }
        : { id: "__missing_target__" }
    case NotificationAudienceType.ROLE:
      return {
        ...activeMemberWhere,
        role: campaign.targetRole ?? ChurchRole.MEMBER,
      }
    case NotificationAudienceType.STAFF_GENERAL:
      return {
        ...activeMemberWhere,
        role: {
          in: [ChurchRole.RESPO, ChurchRole.MASTER, ChurchRole.CREATOR],
        },
      }
    case NotificationAudienceType.STAFF_CONFIDENTIAL:
      return {
        ...activeMemberWhere,
        role: {
          in: [ChurchRole.MASTER, ChurchRole.CREATOR],
        },
      }
    case NotificationAudienceType.ALL_ACTIVE_MEMBERS:
    default:
      return activeMemberWhere
  }
}

function isDue(scheduledFor: Date | null) {
  return !scheduledFor || scheduledFor.getTime() <= Date.now()
}

function isLeapYear(year: number) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)
}

function getRetryDelay(attemptNumber: number) {
  return Math.min(60, 5 * 2 ** Math.max(0, attemptNumber - 1))
}

function getErrorStatusCode(error: unknown) {
  if (typeof error !== "object" || error === null) return null

  const value =
    (error as { statusCode?: unknown; status?: unknown }).statusCode ??
    (error as { statusCode?: unknown; status?: unknown }).status
  const statusCode = Number(value)

  return Number.isFinite(statusCode) ? statusCode : null
}

function getSafeErrorCode(error: unknown) {
  const statusCode = getErrorStatusCode(error)

  if (statusCode) return `HTTP_${statusCode}`

  if (error instanceof Error && error.name) {
    return error.name.slice(0, 80)
  }

  return "UNKNOWN_PUSH_ERROR"
}

function buildPayload(attempt: PushAttemptRow) {
  const url = safeInternalPath(attempt.campaign.targetUrl)
  const payload = {
    version: 1,
    type: attempt.campaign.type,
    title: truncateForNotification(attempt.campaign.title, 90),
    body: truncateForNotification(attempt.campaign.body, 180),
    url,
    tag:
      attempt.campaign.tag ??
      `${attempt.campaign.type.toLowerCase()}:${attempt.campaign.id}`,
    notificationId: attempt.recipientId ?? undefined,
    icon: attempt.campaign.iconUrl ?? "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    image: attempt.campaign.imageUrl ?? undefined,
  }

  const serialized = JSON.stringify(payload)

  if (serialized.length <= 3500) return serialized

  return JSON.stringify({
    ...payload,
    body: truncateForNotification(payload.body, 80),
    image: undefined,
  })
}

export async function createNotificationCampaign(input: CampaignInput) {
  const existing = await prisma.notificationCampaign.findUnique({
    where: { dedupeKey: input.dedupeKey },
  })

  if (existing) {
    return { campaign: existing, created: false }
  }

  const status =
    input.scheduledFor && input.scheduledFor.getTime() > Date.now()
      ? NotificationCampaignStatus.SCHEDULED
      : NotificationCampaignStatus.PENDING

  const campaign = await prisma.notificationCampaign.create({
    data: {
      type: input.type,
      title: truncateForNotification(input.title, 140),
      body: truncateForNotification(input.body, 500),
      targetUrl: safeInternalPath(input.targetUrl),
      audienceType: input.audienceType,
      targetRole: input.targetRole ?? null,
      targetUserId: input.targetUserId ?? null,
      sourceType: input.sourceType ?? null,
      sourceId: input.sourceId ?? null,
      scheduledFor: input.scheduledFor ?? null,
      createdByUserId: input.createdByUserId ?? null,
      dedupeKey: input.dedupeKey,
      tag: input.tag ?? null,
      iconUrl: input.iconUrl ?? null,
      imageUrl: input.imageUrl ?? null,
      metadata: input.metadata ?? undefined,
      status,
    },
  })

  if (isDue(campaign.scheduledFor)) {
    await materializeCampaign(campaign.id)
  }

  return { campaign, created: true }
}

export async function materializeCampaign(campaignId: string) {
  const campaign = await prisma.notificationCampaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      type: true,
      audienceType: true,
      targetRole: true,
      targetUserId: true,
      status: true,
      scheduledFor: true,
    },
  })

  if (!campaign || campaign.status === NotificationCampaignStatus.CANCELLED) {
    return { recipientsCreated: 0, attemptsCreated: 0 }
  }

  if (!isDue(campaign.scheduledFor)) {
    return { recipientsCreated: 0, attemptsCreated: 0 }
  }

  if (campaign.audienceType === NotificationAudienceType.ANONYMOUS_DAILY_VERSE) {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: null,
        isActive: true,
        revokedAt: null,
        anonymousDailyVerseEnabled: true,
      },
      select: { id: true },
    })

    if (subscriptions.length > 0) {
      await prisma.pushDeliveryAttempt.createMany({
        data: subscriptions.map((subscription) => ({
          campaignId,
          pushSubscriptionId: subscription.id,
        })),
        skipDuplicates: true,
      })
    }

    await refreshCampaignStatus(campaignId)

    return { recipientsCreated: 0, attemptsCreated: subscriptions.length }
  }

  const users = await prisma.appUser.findMany({
    where: recipientWhereForCampaign(campaign),
    select: { id: true },
  })

  if (users.length > 0) {
    await prisma.notificationRecipient.createMany({
      data: users.map((user) => ({ campaignId, userId: user.id })),
      skipDuplicates: true,
    })
  }

  const recipients = await prisma.notificationRecipient.findMany({
    where: { campaignId, userId: { in: users.map((user) => user.id) } },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          notificationPreference: {
            select: {
              pushEnabled: true,
              dailyVerseEnabled: true,
              dailyVersePushEnabled: true,
              privateBirthdayGreetingEnabled: true,
              birthdayPushEnabled: true,
              announcementsEnabled: true,
              announcementPushEnabled: true,
              eventsEnabled: true,
              eventPushEnabled: true,
              personalPushEnabled: true,
              staffMessagePushEnabled: true,
            },
          },
        },
      },
    },
  })

  const preferenceFilter = notificationPreferenceWhere(campaign.type)
  const pushEligibleRecipientIds = new Map<string, string>()

  for (const recipient of recipients) {
    const preferences = recipient.user.notificationPreference
    const isEligible = Object.entries(preferenceFilter).every(
      ([key, expected]) =>
        (preferences?.[key as keyof typeof preferences] ?? true) === expected,
    )

    if (isEligible) {
      pushEligibleRecipientIds.set(recipient.userId, recipient.id)
    }
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId: { in: [...pushEligibleRecipientIds.keys()] },
      isActive: true,
      revokedAt: null,
    },
    select: { id: true, userId: true },
  })

  if (subscriptions.length > 0) {
    await prisma.pushDeliveryAttempt.createMany({
      data: subscriptions.flatMap((subscription) => {
        const recipientId = subscription.userId
          ? pushEligibleRecipientIds.get(subscription.userId)
          : null

        if (!recipientId) return []

        return [
          {
            campaignId,
            recipientId,
            pushSubscriptionId: subscription.id,
          },
        ]
      }),
      skipDuplicates: true,
    })
  }

  await refreshCampaignStatus(campaignId)

  return {
    recipientsCreated: users.length,
    attemptsCreated: subscriptions.length,
  }
}

export async function refreshCampaignStatus(campaignId: string) {
  const campaign = await prisma.notificationCampaign.findUnique({
    where: { id: campaignId },
    select: { status: true },
  })

  if (!campaign || campaign.status === NotificationCampaignStatus.CANCELLED) {
    return
  }

  const attempts = await prisma.pushDeliveryAttempt.groupBy({
    by: ["status"],
    where: { campaignId },
    _count: { _all: true },
  })
  const recipients = await prisma.notificationRecipient.count({
    where: { campaignId },
  })
  const countByStatus = new Map(
    attempts.map((item) => [item.status, item._count._all]),
  )
  const pending =
    (countByStatus.get(PushDeliveryStatus.PENDING) ?? 0) +
    (countByStatus.get(PushDeliveryStatus.RETRY) ?? 0) +
    (countByStatus.get(PushDeliveryStatus.PROCESSING) ?? 0)
  const accepted = countByStatus.get(PushDeliveryStatus.ACCEPTED) ?? 0
  const failed =
    (countByStatus.get(PushDeliveryStatus.FAILED) ?? 0) +
    (countByStatus.get(PushDeliveryStatus.EXPIRED) ?? 0)
  const skipped = countByStatus.get(PushDeliveryStatus.SKIPPED) ?? 0
  const totalAttempts = attempts.reduce((sum, item) => sum + item._count._all, 0)

  let nextStatus: NotificationCampaignStatus
  let completedAt: Date | undefined

  if (pending > 0) {
    nextStatus = NotificationCampaignStatus.PROCESSING
  } else if (failed > 0 && accepted === 0) {
    nextStatus = NotificationCampaignStatus.FAILED
    completedAt = new Date()
  } else if (failed > 0 || skipped > 0) {
    nextStatus = NotificationCampaignStatus.PARTIAL
    completedAt = new Date()
  } else if (totalAttempts > 0 || recipients > 0) {
    nextStatus = NotificationCampaignStatus.COMPLETED
    completedAt = new Date()
  } else {
    nextStatus = NotificationCampaignStatus.COMPLETED
    completedAt = new Date()
  }

  await prisma.notificationCampaign.update({
    where: { id: campaignId },
    data: {
      status: nextStatus,
      completedAt,
      processingStartedAt:
        nextStatus === NotificationCampaignStatus.PROCESSING
          ? new Date()
          : undefined,
    },
  })
}

async function claimDueAttempts(limit: number) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    WITH due AS (
      SELECT "id"
      FROM "push_delivery_attempts"
      WHERE "status" IN ('PENDING'::"push_delivery_status", 'RETRY'::"push_delivery_status")
        AND ("next_attempt_at" IS NULL OR "next_attempt_at" <= NOW())
      ORDER BY "created_at" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE "push_delivery_attempts"
    SET "status" = 'PROCESSING'::"push_delivery_status",
        "updated_at" = NOW()
    WHERE "id" IN (SELECT "id" FROM due)
    RETURNING "id"
  `

  return rows.map((row) => row.id)
}

async function handlePushFailure(
  attempt: PushAttemptRow,
  error: unknown,
): Promise<"retrying" | "expired" | "failed"> {
  const statusCode = getErrorStatusCode(error)
  const safeErrorCode = getSafeErrorCode(error)
  const now = new Date()

  if (isExpiredPushSubscriptionError(error)) {
    await prisma.$transaction([
      prisma.pushDeliveryAttempt.update({
        where: { id: attempt.id },
        data: {
          status: PushDeliveryStatus.EXPIRED,
          failedAt: now,
          responseStatusCode: statusCode,
          safeErrorCode,
        },
      }),
      prisma.pushSubscription.update({
        where: { id: attempt.pushSubscription.id },
        data: {
          isActive: false,
          revokedAt: now,
          failureCount: { increment: 1 },
        },
      }),
    ])

    return "expired"
  }

  const shouldRetry =
    (statusCode === 429 || (statusCode !== null && statusCode >= 500)) &&
    attempt.attemptNumber < MAX_PUSH_RETRIES

  if (shouldRetry) {
    await prisma.pushDeliveryAttempt.update({
      where: { id: attempt.id },
      data: {
        status: PushDeliveryStatus.RETRY,
        attemptNumber: { increment: 1 },
        nextAttemptAt: new Date(
          Date.now() + getRetryDelay(attempt.attemptNumber) * 1000,
        ),
        responseStatusCode: statusCode,
        safeErrorCode,
      },
    })

    return "retrying"
  }

  await prisma.pushDeliveryAttempt.update({
    where: { id: attempt.id },
    data: {
      status: PushDeliveryStatus.FAILED,
      failedAt: now,
      responseStatusCode: statusCode,
      safeErrorCode,
    },
  })

  return "failed"
}

export async function processDuePushAttempts(limit = getPushBatchSize()) {
  const ids = await claimDueAttempts(limit)
  const summary: ProcessSummary = {
    attemptsProcessed: 0,
    accepted: 0,
    retrying: 0,
    expired: 0,
    failed: 0,
    skipped: 0,
  }

  if (ids.length === 0) return summary

  const webPushConfig = getWebPushConfig()

  if ("error" in webPushConfig) {
    await prisma.pushDeliveryAttempt.updateMany({
      where: { id: { in: ids } },
      data: {
        status: PushDeliveryStatus.RETRY,
        nextAttemptAt: new Date(Date.now() + 5 * 60 * 1000),
        safeErrorCode: "WEB_PUSH_MISCONFIGURED",
      },
    })

    return { ...summary, retrying: ids.length }
  }

  const attempts = (await prisma.pushDeliveryAttempt.findMany({
    where: { id: { in: ids } },
    include: {
      campaign: {
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          targetUrl: true,
          tag: true,
          iconUrl: true,
          imageUrl: true,
        },
      },
      pushSubscription: {
        select: {
          id: true,
          userId: true,
          endpoint: true,
          p256dh: true,
          auth: true,
        },
      },
    },
  })) as PushAttemptRow[]

  const touchedCampaigns = new Set<string>()

  for (const attempt of attempts) {
    touchedCampaigns.add(attempt.campaignId)
    summary.attemptsProcessed += 1

    try {
      await webPushConfig.push.sendNotification(
        toWebPushSubscription(attempt.pushSubscription),
        buildPayload(attempt),
      )

      const now = new Date()
      await prisma.$transaction([
        prisma.pushDeliveryAttempt.update({
          where: { id: attempt.id },
          data: {
            status: PushDeliveryStatus.ACCEPTED,
            acceptedAt: now,
            responseStatusCode: 201,
          },
        }),
        prisma.pushSubscription.update({
          where: { id: attempt.pushSubscription.id },
          data: {
            lastSentAt: now,
            lastSuccessAt: now,
            failureCount: 0,
          },
        }),
      ])

      summary.accepted += 1
    } catch (error) {
      const result = await handlePushFailure(attempt, error)
      summary[result] += 1
    }
  }

  for (const campaignId of touchedCampaigns) {
    await refreshCampaignStatus(campaignId)
  }

  return summary
}

export async function createDailyVerseCampaigns(input: {
  reference: string
  text: string
  date?: Date
}) {
  const dateKey = getLocalDateKey(input.date)
  const body = `${input.text} - ${input.reference}`

  const members = await createNotificationCampaign({
    type: NotificationType.DAILY_VERSE,
    title: "Verset du jour - MegVie Paris",
    body,
    targetUrl: "/verset-du-jour",
    audienceType: NotificationAudienceType.ALL_ACTIVE_MEMBERS,
    sourceType: "daily_bible_verse",
    sourceId: dateKey,
    dedupeKey: `daily-verse:${dateKey}:members`,
    tag: `daily-verse:${dateKey}`,
    metadata: { reference: input.reference },
  })

  const anonymous = await createNotificationCampaign({
    type: NotificationType.DAILY_VERSE,
    title: "Verset du jour - MegVie Paris",
    body,
    targetUrl: "/verset-du-jour",
    audienceType: NotificationAudienceType.ANONYMOUS_DAILY_VERSE,
    sourceType: "daily_bible_verse",
    sourceId: dateKey,
    dedupeKey: `daily-verse:${dateKey}:anonymous`,
    tag: `daily-verse:${dateKey}`,
    metadata: { reference: input.reference },
  })

  return { members, anonymous }
}

export async function processScheduledDailyVerseCampaigns(date = new Date()) {
  const dueSchedules = await prisma.dailyVerseSchedule.findMany({
    where: {
      status: DailyVerseScheduleStatus.SCHEDULED,
      scheduledFor: { lte: date },
    },
    orderBy: { scheduledFor: "asc" },
    take: 20,
    select: {
      id: true,
      reference: true,
      verseText: true,
      scheduledFor: true,
      localDate: true,
    },
  })

  let sent = 0
  let failed = 0

  for (const schedule of dueSchedules) {
    try {
      const campaigns = await createDailyVerseCampaigns({
        reference: schedule.reference,
        text: schedule.verseText,
        date: schedule.scheduledFor ?? date,
      })

      await prisma.$transaction([
        prisma.dailyVerseSchedule.updateMany({
          where: {
            id: schedule.id,
            status: DailyVerseScheduleStatus.SCHEDULED,
          },
          data: {
            status: DailyVerseScheduleStatus.SENT,
            sentAt: new Date(),
            failureCode: null,
          },
        }),
        prisma.adminAuditLog.create({
          data: {
            action: "daily_verse.sent",
            entityType: "daily_verse_schedule",
            entityId: schedule.id,
            summary: `${schedule.reference} envoye.`,
            metadata: {
              localDate: schedule.localDate,
              reference: schedule.reference,
              memberCampaignCreated: campaigns.members.created,
              anonymousCampaignCreated: campaigns.anonymous.created,
            },
          },
        }),
      ])
      sent += 1
    } catch (error) {
      failed += 1
      await prisma.dailyVerseSchedule.updateMany({
        where: {
          id: schedule.id,
          status: DailyVerseScheduleStatus.SCHEDULED,
        },
        data: {
          status: DailyVerseScheduleStatus.FAILED,
          failureCode:
            error instanceof Error
              ? error.name.slice(0, 80)
              : "DAILY_VERSE_SEND_FAILED",
        },
      })
    }
  }

  return {
    schedulesMatched: dueSchedules.length,
    schedulesSent: sent,
    schedulesFailed: failed,
  }
}

export async function createAnnouncementNotification(input: {
  announcementId: string
  title: string
  visibility: "PUBLIC" | "MEMBERS_ONLY"
  scheduledFor?: Date | null
  createdByUserId: string
}) {
  return createNotificationCampaign({
    type: NotificationType.ANNOUNCEMENT,
    title: "Nouvelle annonce - MegVie Paris",
    body: input.title,
    targetUrl: `/espace-membre/annonces/${input.announcementId}`,
    audienceType: NotificationAudienceType.ALL_ACTIVE_MEMBERS,
    sourceType: "announcement",
    sourceId: input.announcementId,
    scheduledFor: input.scheduledFor ?? null,
    createdByUserId: input.createdByUserId,
    dedupeKey: `announcement:${input.announcementId}:published`,
    tag: `announcement:${input.announcementId}`,
    metadata: { visibility: input.visibility },
  })
}

export async function createEventPublishedNotification(input: {
  eventId: string
  title: string
  startsAt: Date
  scheduledFor?: Date | null
  createdByUserId: string
}) {
  const formattedDate = input.startsAt.toLocaleDateString("fr-FR", {
    dateStyle: "long",
  })

  return createNotificationCampaign({
    type: NotificationType.EVENT_PUBLISHED,
    title: "Nouvel evenement - MegVie Paris",
    body: `${input.title} - ${formattedDate}`,
    targetUrl: "/espace-membre",
    audienceType: NotificationAudienceType.ALL_ACTIVE_MEMBERS,
    sourceType: "church_event",
    sourceId: input.eventId,
    scheduledFor: input.scheduledFor ?? null,
    createdByUserId: input.createdByUserId,
    dedupeKey: `event:${input.eventId}:published`,
    tag: `event:${input.eventId}`,
  })
}

export async function createEventReminderNotification(input: {
  eventId: string
  title: string
  scheduledFor: Date
  createdByUserId: string
}) {
  return createNotificationCampaign({
    type: NotificationType.EVENT_REMINDER,
    title: "Rappel d'evenement - MegVie Paris",
    body: `${input.title} commence bientot.`,
    targetUrl: "/espace-membre",
    audienceType: NotificationAudienceType.ALL_ACTIVE_MEMBERS,
    sourceType: "church_event",
    sourceId: input.eventId,
    scheduledFor: input.scheduledFor,
    createdByUserId: input.createdByUserId,
    dedupeKey: `event:${input.eventId}:reminder:${input.scheduledFor.toISOString()}`,
    tag: `event-reminder:${input.eventId}`,
  })
}

export async function createEventCancelledNotification(input: {
  eventId: string
  title: string
  createdByUserId: string
}) {
  await cancelPendingEventReminders(input.eventId)

  return createNotificationCampaign({
    type: NotificationType.EVENT_CANCELLED,
    title: "Evenement annule",
    body: `${input.title} a ete annule. Consultez l'application pour plus d'informations.`,
    targetUrl: "/espace-membre",
    audienceType: NotificationAudienceType.ALL_ACTIVE_MEMBERS,
    sourceType: "church_event",
    sourceId: input.eventId,
    createdByUserId: input.createdByUserId,
    dedupeKey: `event:${input.eventId}:cancelled`,
    tag: `event-cancelled:${input.eventId}`,
  })
}

export async function cancelPendingEventReminders(eventId: string) {
  await prisma.notificationCampaign.updateMany({
    where: {
      type: NotificationType.EVENT_REMINDER,
      sourceType: "church_event",
      sourceId: eventId,
      status: {
        in: [
          NotificationCampaignStatus.SCHEDULED,
          NotificationCampaignStatus.PENDING,
          NotificationCampaignStatus.PROCESSING,
        ],
      },
    },
    data: {
      status: NotificationCampaignStatus.CANCELLED,
      cancelledAt: new Date(),
    },
  })
}

export async function createStaffMessageNotification(input: {
  messageId: string
  confidentiality: MessageConfidentiality
}) {
  const isConfidential =
    input.confidentiality === MessageConfidentiality.PASTORAL_CONFIDENTIAL

  return createNotificationCampaign({
    type: isConfidential
      ? NotificationType.STAFF_CONFIDENTIAL_MESSAGE
      : NotificationType.STAFF_NEW_MESSAGE,
    title: isConfidential
      ? "Nouveau message confidentiel"
      : "Nouveau message recu",
    body: isConfidential
      ? "Un message pastoral confidentiel attend votre attention."
      : "Un nouveau message general attend une reponse.",
    targetUrl: `/admin/messages/${input.messageId}`,
    audienceType: isConfidential
      ? NotificationAudienceType.STAFF_CONFIDENTIAL
      : NotificationAudienceType.STAFF_GENERAL,
    sourceType: "contact_message",
    sourceId: input.messageId,
    dedupeKey: `message:${input.messageId}:${isConfidential ? "confidential" : "general"}`,
    tag: `message:${input.messageId}`,
  })
}

export async function createPersonalNotification(input: {
  userId: string
  title?: string
  body?: string
  targetUrl?: string
  sourceType?: string
  sourceId?: string
  dedupeKey: string
}) {
  return createNotificationCampaign({
    type: NotificationType.PERSONAL,
    title: input.title ?? "Mise a jour de votre compte",
    body:
      input.body ??
      "Une information importante est disponible dans votre espace membre.",
    targetUrl: input.targetUrl ?? "/espace-membre/notifications",
    audienceType: NotificationAudienceType.INDIVIDUAL,
    targetUserId: input.userId,
    sourceType: input.sourceType ?? "app_user",
    sourceId: input.sourceId ?? input.userId,
    dedupeKey: input.dedupeKey,
  })
}

export async function createBirthdayCampaigns(date = new Date()) {
  const timezone = getChurchTimezone()
  const dateKey = getLocalDateKey(date, timezone)
  const [yearText] = dateKey.split("-")
  const year = Number(yearText)
  const { month, day } = getLocalMonthDay(date, timezone)
  const shouldIncludeLeapDayFallback =
    month === 2 && day === 28 && !isLeapYear(year)

  const members = await prisma.$queryRaw<
    Array<{ id: string; first_name: string | null; email: string }>
  >`
    SELECT u."id", u."first_name", u."email"
    FROM "app_users" u
    INNER JOIN "member_private_details" d ON d."user_id" = u."id"
    INNER JOIN "notification_preferences" p ON p."user_id" = u."id"
    WHERE u."membership_status" = 'ACTIVE'::"membership_status"
      AND u."archived_at" IS NULL
      AND d."date_of_birth" IS NOT NULL
      AND p."push_enabled" = true
      AND p."birthday_push_enabled" = true
      AND p."private_birthday_greeting_enabled" = true
      AND (
        (
          EXTRACT(MONTH FROM d."date_of_birth") = ${month}
          AND EXTRACT(DAY FROM d."date_of_birth") = ${day}
        )
        OR (
          ${shouldIncludeLeapDayFallback}
          AND EXTRACT(MONTH FROM d."date_of_birth") = 2
          AND EXTRACT(DAY FROM d."date_of_birth") = 29
        )
      )
  `

  let created = 0

  for (const member of members) {
    const firstName = member.first_name?.trim() || "cher membre"
    const result = await createNotificationCampaign({
      type: NotificationType.BIRTHDAY,
      title: `Joyeux anniversaire, ${firstName}`,
      body:
        "Que cette nouvelle annee soit remplie de grace, de paix et de benedictions.",
      targetUrl: "/espace-membre/notifications",
      audienceType: NotificationAudienceType.INDIVIDUAL,
      targetUserId: member.id,
      sourceType: "birthday",
      sourceId: member.id,
      dedupeKey: `birthday:${member.id}:${dateKey}`,
      tag: `birthday:${dateKey}:${member.id}`,
    })

    if (result.created) created += 1
  }

  return { birthdaysMatched: members.length, campaignsCreated: created }
}

export async function publishDueContentAndCampaigns() {
  const now = new Date()

  const [announcements, events, campaigns] = await Promise.all([
    prisma.announcement.updateMany({
      where: {
        status: AnnouncementStatus.SCHEDULED,
        publishAt: { lte: now },
      },
      data: {
        status: AnnouncementStatus.PUBLISHED,
        publishedAt: now,
      },
    }),
    prisma.churchEvent.updateMany({
      where: {
        status: EventStatus.SCHEDULED,
        publishAt: { lte: now },
      },
      data: {
        status: EventStatus.PUBLISHED,
        publishedAt: now,
      },
    }),
    prisma.notificationCampaign.findMany({
      where: {
        status: NotificationCampaignStatus.SCHEDULED,
        scheduledFor: { lte: now },
      },
      select: { id: true },
      take: 100,
    }),
  ])

  for (const campaign of campaigns) {
    await prisma.notificationCampaign.updateMany({
      where: {
        id: campaign.id,
        status: NotificationCampaignStatus.SCHEDULED,
      },
      data: { status: NotificationCampaignStatus.PENDING },
    })
    await materializeCampaign(campaign.id)
  }

  return {
    announcementsPublished: announcements.count,
    eventsPublished: events.count,
    campaignsMaterialized: campaigns.length,
  }
}

export async function runNotificationScheduler() {
  const [content, birthdays, dailyVerses] = await Promise.all([
    publishDueContentAndCampaigns(),
    createBirthdayCampaigns(),
    processScheduledDailyVerseCampaigns(),
  ])
  const delivery = await processDuePushAttempts(getPushBatchSize())

  return {
    campaignsCreated: birthdays.campaignsCreated,
    dailyVerseSchedulesMatched: dailyVerses.schedulesMatched,
    dailyVerseSchedulesSent: dailyVerses.schedulesSent,
    dailyVerseSchedulesFailed: dailyVerses.schedulesFailed,
    attemptsProcessed: delivery.attemptsProcessed,
    accepted: delivery.accepted,
    retrying: delivery.retrying,
    expired: delivery.expired,
    failed: delivery.failed,
    skipped: delivery.skipped,
    announcementsPublished: content.announcementsPublished,
    eventsPublished: content.eventsPublished,
    campaignsMaterialized: content.campaignsMaterialized,
  }
}
