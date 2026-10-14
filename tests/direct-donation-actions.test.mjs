import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import test from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import { tsImport } from "tsx/esm/api"

const require = createRequire(import.meta.url)
const enums = await tsImport(
  "../src/generated/prisma/enums.ts",
  import.meta.url,
)
const permissions = await tsImport(
  "../src/lib/auth/permissions.ts",
  import.meta.url,
)
const { summarizeFinances } = await tsImport(
  "../src/lib/finance/analytics-summary.ts",
  import.meta.url,
)
const compiled = ts.transpileModule(
  readFileSync(
    new URL("../src/lib/finance/direct.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText

const manual = {
  id: "direct-one",
  source: "DIRECT",
  directStatus: "VERIFIED",
  status: "SUCCEEDED",
  directKind: "ANONYMOUS_COLLECTION",
  amountCents: 10000,
  refundedAmountCents: 0,
  currency: "eur",
  categoryId: "category",
  userId: null,
  memberIdSnapshot: null,
  receivedAt: new Date("2026-10-01T10:00:00Z"),
  replacesDonationId: null,
  checkoutId: null,
  recurringDonationId: null,
  stripeCustomerId: null,
  stripePaymentIntentId: null,
  stripeChargeId: null,
  stripeCheckoutSessionId: null,
  stripeInvoiceId: null,
  stripeReceiptUrl: null,
  stripeHostedInvoiceUrl: null,
  stripeInvoicePdfUrl: null,
}
const online = {
  ...manual,
  id: "online-one",
  source: "ONLINE",
  directStatus: null,
  amountCents: 36500,
  stripePaymentIntentId: "pi_preserve",
}

// Isolated transaction storage exercises the actual server actions without touching the live ledger.
function fixture(role = "MASTER", records = [manual, online]) {
  const state = {
    rows: new Map(records.map((row) => [row.id, structuredClone(row)])),
    audit: [],
    paths: [],
    permissions: [],
    queries: 0,
    auditFails: false,
    refunds: [],
  }
  const dbFor = (storage) => ({
    async $queryRaw(_strings, id) {
      state.queries++
      assert.match(_strings.join(""), /FOR UPDATE/)
      const row = storage.rows.get(id)
      return row?.source === "DIRECT" ? [{ id }] : []
    },
    donation: {
      async findFirst({ where }) {
        const row = storage.rows.get(where.id)
        return row?.source === where.source ? row : null
      },
      async findUnique({ where }) {
        return where.id
          ? (storage.rows.get(where.id) ?? null)
          : ([...storage.rows.values()].find(
              (row) => row.directEntryRequestId === where.directEntryRequestId,
            ) ?? null)
      },
      async findMany({ where }) {
        return [...storage.rows.values()].filter(
          (row) => row.replacesDonationId === where.replacesDonationId,
        )
      },
      async deleteMany({ where }) {
        assert.equal(where.source, "DIRECT")
        const row = storage.rows.get(where.id)
        if (!row || row.source !== where.source) return { count: 0 }
        storage.rows.delete(where.id)
        return { count: 1 }
      },
      async create({ data }) {
        const row = { ...data, id: "direct-created" }
        storage.rows.set(row.id, row)
        return row
      },
    },
    donationCategory: {
      async findFirst() {
        return { id: "category", label: "Offrande", slug: "offrande" }
      },
    },
    donationRefund: {
      async count({ where }) {
        return state.refunds.filter((id) => id === where.donationId).length
      },
    },
    adminAuditLog: {
      async create({ data }) {
        if (state.auditFails) throw new Error("Audit unavailable")
        storage.audit.push(structuredClone(data))
        return data
      },
    },
  })
  const prisma = {
    ...dbFor(state),
    async $transaction(callback) {
      const working = {
        rows: structuredClone(state.rows),
        audit: structuredClone(state.audit),
      }
      const result = await callback(dbFor(working))
      state.rows = working.rows
      state.audit = working.audit
      return result
    },
  }
  const loaded = { exports: {} }
  runInNewContext(compiled, {
    module: loaded,
    exports: loaded.exports,
    Promise,
    Date,
    require(id) {
      if (id === "server-only") return {}
      if (id === "next/cache")
        return { revalidatePath: (path) => state.paths.push(path) }
      if (id === "next/navigation")
        return {
          redirect: () => {
            throw new Error("Redirect")
          },
        }
      if (id === "@/generated/prisma/enums") return enums
      if (id === "@/lib/auth/permissions") return permissions
      if (id === "@/lib/prisma") return { prisma }
      if (id === "@/lib/finance/data")
        return {
          async requireFinancePermission(permission) {
            state.permissions.push(permission)
            if (!permissions.hasPermission(role, permission))
              throw new Error("Forbidden")
            return { id: "actor", role, profile: { memberId: "Mv00001P" } }
          },
        }
      if (id === "@/lib/finance/notifications")
        return {
          createDirectDonationRecordedNotification: async () => {},
          createDirectDonationVerifiedNotification: async () => {},
          createDirectDonationCorrectionNotification: async () => {},
        }
      return require(id)
    },
  })
  const remove = async (id = manual.id, reason = "Doublon de saisie") => {
    const form = new FormData()
    form.set("id", id)
    form.set("reason", reason)
    return loaded.exports.deleteDirectDonationAction(
      { ok: false, message: "" },
      form,
    )
  }
  return { state, actions: loaded.exports, remove }
}

test("Master and Creator can delete manual donations; other roles cannot", async () => {
  for (const role of ["MASTER", "CREATOR"]) {
    const { state, remove } = fixture(role)
    assert.equal((await remove()).ok, true)
    assert.equal(state.rows.has(manual.id), false)
    assert.equal(state.permissions[0], "donations.delete_direct")
  }
  for (const role of ["MEMBER", "RESPO", "FINANCE"]) {
    const { state, remove } = fixture(role)
    await assert.rejects(remove(), /Forbidden/)
    assert.equal(state.queries, 0)
    assert.equal(state.rows.size, 2)
  }
})

test("Master can add a manual collection through the existing trusted action", async () => {
  const { state, actions } = fixture()
  const form = new FormData()
  for (const [key, value] of Object.entries({
    kind: "ANONYMOUS_COLLECTION",
    amount: "25,50",
    categoryId: "category",
    receivedAt: "2026-10-01T10:00",
    collectionLabel: "Collecte du dimanche",
    directEntryRequestId: "new-entry",
  }))
    form.set(key, value)
  const result = await actions.createDirectDonationAction(
    { ok: false, message: "" },
    form,
  )
  assert.equal(result.ok, true)
  const created = state.rows.get(result.donationId)
  assert.equal(created.amountCents, 2550)
  assert.equal(created.source, "DIRECT")
  assert.equal(created.directStatus, "RECORDED")
  assert.equal(created.enteredByUserId, "actor")
  assert.equal(state.permissions[0], "donations.create_direct")
  assert.equal(state.audit.length, 1)
})

test("deleting a verified donation preserves Stripe and updates the balance", async () => {
  const { state, remove } = fixture()
  const protectedBefore = JSON.stringify(state.rows.get(online.id))
  assert.equal((await remove()).ok, true)
  assert.equal(JSON.stringify(state.rows.get(online.id)), protectedBefore)
  assert.equal(state.audit[0].action, "direct_donation.deleted")
  assert.equal(state.audit[0].actorUserId, "actor")
  assert.equal(state.audit[0].metadata.amountCents, 10000)
  assert.equal(state.audit[0].metadata.reason, "Doublon de saisie")
  const rows = [...state.rows.values()].map((row) => ({
    month: "2026-10",
    source: row.source,
    category: "",
    grossCents: row.amountCents,
    refundedCents: row.refundedAmountCents,
    count: 1,
  }))
  assert.equal(summarizeFinances(rows, "2026-10").totals.balanceCents, 36500)
  for (const path of [
    "/admin",
    "/admin/finance",
    "/admin/dons/directs",
    "/espace-membre/dons",
  ])
    assert.ok(state.paths.includes(path))
})

test("a forged online donation ID cannot delete a Stripe donation", async () => {
  const { state, remove } = fixture()
  assert.equal((await remove(online.id)).ok, false)
  assert.equal(state.rows.size, 2)
  assert.equal(state.audit.length, 0)
})

test("Stripe links and refunds on a manual row prevent deletion", async () => {
  for (const changes of [
    { stripePaymentIntentId: "pi_existing" },
    { stripeReceiptUrl: "https://example.invalid/receipt" },
    { checkoutId: "checkout" },
    { recurringDonationId: "subscription" },
    { refundedAmountCents: 1 },
  ]) {
    const { state, remove } = fixture("MASTER", [
      { ...manual, ...changes },
      online,
    ])
    assert.equal((await remove()).ok, false)
    assert.equal(state.rows.size, 2)
  }
  const { state, remove } = fixture()
  state.refunds.push(manual.id)
  assert.equal((await remove()).ok, false)
  assert.equal(state.audit.length, 0)
})

test("deletion cannot change an online donation linked as a replacement", async () => {
  const { state, remove } = fixture("MASTER", [
    manual,
    { ...online, replacesDonationId: manual.id },
  ])
  assert.equal((await remove()).ok, false)
  assert.equal(state.rows.get(online.id).replacesDonationId, manual.id)
})

test("audit failure rolls back deletion", async () => {
  const { state, remove } = fixture()
  state.auditFails = true
  assert.equal((await remove()).ok, false)
  assert.equal(state.rows.has(manual.id), true)
  assert.equal(state.audit.length, 0)
  assert.equal(state.paths.length, 0)
})

test("missing reasons and duplicate deletes cannot alter other records", async () => {
  const { state, remove } = fixture()
  assert.equal((await remove(manual.id, " ")).ok, false)
  assert.equal(state.queries, 0)
  assert.equal((await remove()).ok, true)
  assert.equal((await remove()).ok, false)
  assert.equal(state.audit.length, 1)
  assert.equal(state.rows.has(online.id), true)
})
