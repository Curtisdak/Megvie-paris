import "dotenv/config"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import WebSocket from "ws"
import { PrismaClient, type Prisma } from "../src/generated/prisma/client"
import { financeAnalyticsQuery } from "../src/lib/finance/analytics-query"
import {
  summarizeFinances,
  type FinanceAggregate,
} from "../src/lib/finance/analytics-summary"

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim()
  if (!databaseUrl) throw new Error("DATABASE_URL manquant")
  neonConfig.webSocketConstructor = WebSocket
  const db = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl }),
  })
  const token = `expense-smoke-${randomUUID()}`
  const rollback = new Error("Rollback of smoke fixtures")
  try {
    await db
      .$transaction(
        async (tx) => {
          const totals = async (live: boolean) =>
            summarizeFinances(
              await tx.$queryRaw<FinanceAggregate[]>(
                financeAnalyticsQuery(live),
              ),
              "2026-09",
            ).totals
          const before = await totals(true)
          const beforeTest = await totals(false)
          const actor = await tx.appUser.create({
            data: {
              clerkUserId: token,
              email: "smoke@example.invalid",
              role: "FINANCE",
              membershipStatus: "ACTIVE",
            },
          })
          const category = await tx.donationCategory.create({
            data: { slug: token, label: "Smoke fixture" },
          })
          const base = {
            categoryId: category.id,
            frequency: "ONE_TIME" as const,
            donatedAt: new Date("2026-09-01T10:00:00Z"),
            currency: "eur",
            livemode: true,
          }
          const donations: Prisma.DonationCreateManyInput[] = [
            {
              ...base,
              source: "ONLINE",
              status: "SUCCEEDED",
              amountCents: 10000,
            },
            {
              ...base,
              source: "ONLINE",
              status: "PARTIALLY_REFUNDED",
              amountCents: 20000,
              refundedAmountCents: 5000,
            },
            {
              ...base,
              source: "ONLINE",
              status: "REFUNDED",
              amountCents: 10000,
              refundedAmountCents: 10000,
            },
            {
              ...base,
              source: "ONLINE",
              status: "PENDING",
              amountCents: 900000,
            },
            {
              ...base,
              source: "ONLINE",
              status: "DISPUTED",
              amountCents: 900000,
            },
            {
              ...base,
              source: "ONLINE",
              status: "SUCCEEDED",
              amountCents: 3000,
              livemode: false,
            },
            {
              ...base,
              source: "ONLINE",
              status: "SUCCEEDED",
              amountCents: 900000,
              currency: "usd",
            },
            {
              ...base,
              source: "DIRECT",
              directStatus: "VERIFIED",
              status: "SUCCEEDED",
              amountCents: 5000,
              receivedAt: base.donatedAt,
            },
            {
              ...base,
              source: "DIRECT",
              directStatus: "RECORDED",
              status: "PENDING",
              amountCents: 7000,
            },
            {
              ...base,
              source: "DIRECT",
              directStatus: "CANCELLED",
              status: "CANCELLED",
              amountCents: 9000,
            },
          ]
          await tx.donation.createMany({
            data: donations.map((donation) =>
              donation.source === "DIRECT"
                ? {
                    ...donation,
                    directKind: "ANONYMOUS_COLLECTION",
                    receivedAt: base.donatedAt,
                    enteredByUserId: actor.id,
                    collectionLabel: "Smoke fixture",
                  }
                : donation,
            ),
          })
          const expense = {
            title: "Smoke fixture",
            category: "PREMISES",
            amountCents: 4000,
            occurredAt: new Date("2026-09-01T00:00:00Z"),
            createdByUserId: actor.id,
            entryRequestId: randomUUID(),
          }
          const [created] = await tx.financeExpense.createManyAndReturn({
            data: expense,
            skipDuplicates: true,
          })
          const duplicate = await tx.financeExpense.createManyAndReturn({
            data: expense,
            skipDuplicates: true,
          })
          assert.equal(duplicate.length, 0)
          await tx.financeExpense.create({
            data: {
              ...expense,
              entryRequestId: randomUUID(),
              status: "CANCELLED",
              amountCents: 6000,
            },
          })
          const after = await totals(true)
          assert.equal(after.stripeCents - before.stripeCents, 25000)
          assert.equal(after.directCents - before.directCents, 5000)
          assert.equal(after.expenseCents - before.expenseCents, 4000)
          assert.equal(after.refundedCents - before.refundedCents, 15000)
          assert.equal(after.balanceCents - before.balanceCents, 26000)
          assert.equal(
            (await totals(false)).stripeCents - beforeTest.stripeCents,
            3000,
          )
          const updated = await tx.financeExpense.updateMany({
            where: { id: created.id, version: 1, status: "RECORDED" },
            data: { amountCents: 4500, version: { increment: 1 } },
          })
          assert.equal(updated.count, 1)
          const stale = await tx.financeExpense.updateMany({
            where: { id: created.id, version: 1, status: "RECORDED" },
            data: { amountCents: 9999 },
          })
          assert.equal(stale.count, 0)
          assert.equal(
            (await totals(true)).balanceCents - before.balanceCents,
            25500,
          )
          await tx.financeExpense.update({
            where: { id: created.id },
            data: {
              status: "CANCELLED",
              cancellationReason: "Smoke fixture cancellation",
              cancelledAt: new Date(),
            },
          })
          assert.equal(
            (await totals(true)).balanceCents - before.balanceCents,
            30000,
          )
          throw rollback
        },
        { isolationLevel: "RepeatableRead", timeout: 30000, maxWait: 10000 },
      )
      .catch((error) => {
        if (error !== rollback) throw error
      })
    assert.equal(await db.appUser.count({ where: { clerkUserId: token } }), 0)
    assert.equal(await db.donationCategory.count({ where: { slug: token } }), 0)
    console.log(
      "PASS: SQL totals, refunds, currencies, Stripe modes, idempotency, concurrent edits and cancellation. All fixtures rolled back.",
    )
  } finally {
    await db.$disconnect()
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Finance smoke test failed",
  )
  process.exitCode = 1
})
