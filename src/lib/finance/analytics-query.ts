import { Prisma } from "@/generated/prisma/client"

export function financeAnalyticsQuery(liveMode: boolean) {
  return Prisma.sql`
    SELECT to_char(COALESCE(received_at, donated_at, created_at) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris', 'YYYY-MM') AS month,
      source::text AS source, '' AS category,
      SUM(amount_cents)::double precision AS "grossCents",
      SUM(CASE WHEN source = 'ONLINE' THEN refunded_amount_cents ELSE 0 END)::double precision AS "refundedCents",
      COUNT(*)::int AS count
    FROM donations
    WHERE lower(currency) = 'eur' AND (
      (source = 'DIRECT' AND direct_status = 'VERIFIED' AND status = 'SUCCEEDED') OR
      (source = 'ONLINE' AND livemode = ${liveMode} AND status IN ('SUCCEEDED', 'PARTIALLY_REFUNDED', 'REFUNDED'))
    )
    GROUP BY month, source
    UNION ALL
    SELECT to_char(occurred_at, 'YYYY-MM') AS month, 'EXPENSE' AS source, category,
      SUM(amount_cents)::double precision AS "grossCents", 0::double precision AS "refundedCents", COUNT(*)::int AS count
    FROM finance_expenses WHERE status = 'RECORDED' AND currency = 'eur'
    GROUP BY month, category
  `
}
