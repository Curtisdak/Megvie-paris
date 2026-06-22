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

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString: getDatabaseUrl() }),
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
