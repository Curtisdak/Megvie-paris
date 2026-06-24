import { NextRequest, NextResponse } from "next/server"
import { DailyVerseScheduleStatus } from "@/generated/prisma/enums"
import { getParisDayOfYear } from "@/lib/daily-verse"
import { getLocalDateKey } from "@/lib/notifications/safety"
import { prisma } from "@/lib/prisma"
import { validateRequestSecret } from "@/lib/request-auth"
import {
  createDailyVerseCampaigns,
  processScheduledDailyVerseCampaigns,
  processDuePushAttempts,
} from "@/lib/notifications/service"
import { getPushBatchSize } from "@/lib/notifications/safety"

export const dynamic = "force-dynamic"

async function handleDailyVerse(request: NextRequest) {
  const auth = validateRequestSecret(request, ["CRON_SECRET"])

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const dayOfYear = getParisDayOfYear()
  const scheduled = await processScheduledDailyVerseCampaigns()
  const localDate = getLocalDateKey(new Date(), "Europe/Paris")
  const sentSchedule = await prisma.dailyVerseSchedule.findFirst({
    where: {
      localDate,
      status: DailyVerseScheduleStatus.SENT,
    },
    orderBy: { sentAt: "desc" },
    select: { reference: true, verseText: true },
  })
  const verse =
    sentSchedule ??
    (await prisma.dailyBibleVerse
      .findUnique({
        where: { dayOfYear },
        select: { id: true, reference: true, text: true, translation: true },
      })
      .catch((error) => {
        console.error("Daily verse fetch error", error)
        return null
      }))

  if (!verse) {
    return NextResponse.json(
      { error: `Aucun verset configure pour le jour ${dayOfYear}.` },
      { status: 404 },
    )
  }

  const campaigns = await createDailyVerseCampaigns({
    reference: verse.reference,
    text: "verseText" in verse ? verse.verseText : verse.text,
  })
  const delivery = await processDuePushAttempts(getPushBatchSize())

  return NextResponse.json({
    dayOfYear,
    verse: verse.reference,
    scheduledMatched: scheduled.schedulesMatched,
    scheduledSent: scheduled.schedulesSent,
    scheduledFailed: scheduled.schedulesFailed,
    campaignsCreated: Number(campaigns.members.created) + Number(campaigns.anonymous.created),
    attemptsProcessed: delivery.attemptsProcessed,
    accepted: delivery.accepted,
    retrying: delivery.retrying,
    expired: delivery.expired,
    failed: delivery.failed,
  })
}

export async function GET(request: NextRequest) {
  return handleDailyVerse(request)
}

export async function POST(request: NextRequest) {
  return handleDailyVerse(request)
}
