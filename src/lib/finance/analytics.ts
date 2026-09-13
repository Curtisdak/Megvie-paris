import "server-only"

import { financeAnalyticsQuery } from "@/lib/finance/analytics-query"
import { prisma } from "@/lib/prisma"
import { requireFinancePermission } from "@/lib/finance/data"
import {
  summarizeFinances,
  type FinanceAggregate,
} from "@/lib/finance/analytics-summary"

export async function getFinanceAnalytics() {
  await requireFinancePermission("donations.stats", "/admin/finance")
  const liveMode =
    process.env.STRIPE_SECRET_KEY?.trim().startsWith("sk_live_") ?? false
  // Aggregate in PostgreSQL: no full ledger download, and both flows share one snapshot.
  const rows = await prisma.$queryRaw<FinanceAggregate[]>(
    financeAnalyticsQuery(liveMode),
  )
  const currentMonth = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
  }).format(new Date())
  return { ...summarizeFinances(rows, currentMonth), liveMode }
}
