import assert from "node:assert/strict"
import test from "node:test"
import { tsImport } from "tsx/esm/api"

const { parseExpenseAmount, parseExpenseDate, validateExpense } =
  await tsImport("../src/lib/finance/expense-validation.ts", import.meta.url)
const { summarizeFinances } = await tsImport(
  "../src/lib/finance/analytics-summary.ts",
  import.meta.url,
)
const { hasPermission } = await tsImport(
  "../src/lib/auth/permissions.ts",
  import.meta.url,
)

test("expense amounts preserve cents without floating point rounding", () => {
  for (const [value, expected] of [
    ["10,01", 1001],
    ["0.29", 29],
    ["12.3", 1230],
    ["0,01", 1],
    [" 100 ", 10000],
  ])
    assert.equal(parseExpenseAmount(value), expected)
  for (const value of [
    "0",
    "-1",
    "1.999",
    "Infinity",
    "1e3",
    "100000000",
    "21474836.48",
    "",
    null,
  ])
    assert.equal(parseExpenseAmount(value), null)
})

test("expense dates reject rollover dates and preserve the calendar day", () => {
  assert.equal(
    parseExpenseDate("2024-02-29").toISOString(),
    "2024-02-29T00:00:00.000Z",
  )
  for (const value of [
    "2025-02-29",
    "2026-04-31",
    "2026-13-01",
    "0000-01-01",
    "30/06/2026",
    undefined,
  ])
    assert.equal(parseExpenseDate(value), null)
})

test("expense validation accepts optional details but rejects invalid categories and future payments", () => {
  const form = new FormData()
  form.set("title", "  Location salle  ")
  form.set("category", "PREMISES")
  form.set("amount", "150,25")
  form.set("occurredAt", "2020-06-20")
  const expense = validateExpense(form)
  assert.equal(expense.amountCents, 15025)
  assert.equal(expense.title, "Location salle")
  assert.equal(expense.payee, null)
  form.set("category", "__proto__")
  assert.throws(() => validateExpense(form))
  form.set("category", "PREMISES")
  form.set("occurredAt", "2999-01-01")
  assert.throws(() => validateExpense(form))
})

test("only finance administrators can manage expenses", () => {
  for (const role of ["FINANCE", "MASTER", "CREATOR"])
    assert.equal(hasPermission(role, "expenses.manage"), true)
  for (const role of ["MEMBER", "RESPO", undefined, null])
    assert.equal(hasPermission(role, "expenses.manage"), false)
})

test("financial summary deducts refunds and expenses and keeps negative balances", () => {
  const rows = [
    {
      month: "2026-09",
      source: "ONLINE",
      category: "",
      grossCents: 10000,
      refundedCents: 2500,
      count: 2,
    },
    {
      month: "2026-09",
      source: "DIRECT",
      category: "",
      grossCents: 5000,
      refundedCents: 0,
      count: 1,
    },
    {
      month: "2026-09",
      source: "EXPENSE",
      category: "PREMISES",
      grossCents: 15000,
      refundedCents: 0,
      count: 1,
    },
  ]
  const summary = summarizeFinances(rows, "2026-09")
  assert.deepEqual(summary.totals, {
    directCents: 5000,
    stripeCents: 7500,
    expenseCents: 15000,
    refundedCents: 2500,
    incomeCents: 12500,
    balanceCents: -2500,
  })
  assert.equal(summary.months.at(-1).netCents, -2500)
  assert.deepEqual(summary.categories, [["PREMISES", 15000]])
})

test("monthly series includes empty months and crosses years while all-time totals keep older entries", () => {
  const summary = summarizeFinances(
    [
      {
        month: "2020-01",
        source: "DIRECT",
        category: "",
        grossCents: 999,
        refundedCents: 0,
        count: 1,
      },
    ],
    "2026-01",
  )
  assert.equal(summary.months.length, 12)
  assert.equal(summary.months[0].month, "2025-02")
  assert.equal(summary.months.at(-1).month, "2026-01")
  assert.equal(summary.totals.balanceCents, 999)
  assert.ok(summary.months.every((month) => month.netCents === 0))
  assert.equal(summarizeFinances([], "2026-09").totals.balanceCents, 0)
})
