export type FinanceAggregate = {
  month: string
  source: "ONLINE" | "DIRECT" | "EXPENSE"
  category: string
  grossCents: number
  refundedCents: number
  count: number
}

export function summarizeFinances(
  rows: FinanceAggregate[],
  currentMonth: string,
) {
  const totals = {
    directCents: 0,
    stripeCents: 0,
    expenseCents: 0,
    refundedCents: 0,
    incomeCents: 0,
    balanceCents: 0,
  }
  const categories: Record<string, number> = {}
  const [year, month] = currentMonth.split("-").map(Number)
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(Date.UTC(year, month - 12 + i, 1))
    return {
      month: date.toISOString().slice(0, 7),
      directCents: 0,
      stripeCents: 0,
      expenseCents: 0,
      netCents: 0,
    }
  })
  for (const row of rows) {
    const net = row.grossCents - row.refundedCents
    const point = months.find((item) => item.month === row.month)
    if (row.source === "EXPENSE") {
      totals.expenseCents += net
      categories[row.category] = (categories[row.category] ?? 0) + net
      if (point) point.expenseCents += net
    } else if (row.source === "DIRECT") {
      totals.directCents += net
      if (point) point.directCents += net
    } else {
      totals.stripeCents += net
      totals.refundedCents += row.refundedCents
      if (point) point.stripeCents += net
    }
  }
  totals.incomeCents = totals.directCents + totals.stripeCents
  totals.balanceCents = totals.incomeCents - totals.expenseCents
  for (const point of months)
    point.netCents = point.directCents + point.stripeCents - point.expenseCents
  return {
    totals,
    months,
    categories: Object.entries(categories).sort((a, b) => b[1] - a[1]),
  }
}
