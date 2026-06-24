import "server-only"

import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient } from "@/generated/prisma/client"
import WebSocket from "ws"

neonConfig.webSocketConstructor = WebSocket

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim()

  if (!databaseUrl) {
    throw new Error("DATABASE_URL est manquant.")
  }

  return databaseUrl
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function hasCurrentPrismaDelegates(
  client: PrismaClient | undefined,
): client is PrismaClient {
  if (!client) return false

  const delegates = client as unknown as Record<string, unknown>

  return Boolean(
    delegates.notificationCampaign &&
      delegates.notificationRecipient &&
      delegates.pushDeliveryAttempt &&
      delegates.donation &&
      delegates.stripeWebhookEvent &&
      delegates.bibleFavorite &&
      delegates.bibleNote &&
      delegates.dailyVerseSchedule,
  )
}

const cachedPrisma = globalForPrisma.prisma

export const prisma = hasCurrentPrismaDelegates(cachedPrisma)
  ? cachedPrisma
  : new PrismaClient({
      adapter: new PrismaNeon({ connectionString: getDatabaseUrl() }),
    })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
