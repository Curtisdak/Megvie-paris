import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import test from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import { tsImport } from "tsx/esm/api"

const require = createRequire(import.meta.url)
const { MembershipStatus } = await tsImport(
  "../src/generated/prisma/enums.ts",
  import.meta.url,
)
const source = readFileSync(
  new URL("../src/lib/bible-assistant/rate-limit.ts", import.meta.url),
  "utf8",
)
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
const activeMember = { id: "member-one", membershipStatus: "ACTIVE" }

// Run the real limiter with isolated auth/storage so tests never consume live quotas.
function fixture(member = null, vercel = true) {
  const state = {
    userId: member ? `clerk-${member.id}` : null,
    member,
    now: 0,
    counts: new Map(),
    lookups: [],
    authError: null,
    lookupError: null,
    storageError: null,
  }
  const prisma = {
    appUser: {
      async findUnique(args) {
        state.lookups.push(structuredClone(args))
        if (state.lookupError) throw state.lookupError
        return state.member
      },
    },
    async $transaction(callback) {
      if (state.storageError) throw state.storageError
      const working = new Map(state.counts)
      const result = await callback({
        async $queryRaw(_strings, key, seconds) {
          const previous = working.get(key)
          const row =
            previous && previous.expires > state.now
              ? { count: previous.count + 1, expires: previous.expires }
              : { count: 1, expires: state.now + seconds }
          working.set(key, row)
          return [{ count: row.count, retryAfter: row.expires - state.now }]
        },
        async $executeRaw() {
          for (const [key, row] of working) {
            if (row.expires < state.now) working.delete(key)
          }
        },
      })
      state.counts = working
      return result
    },
  }
  const loadedModule = { exports: {} }
  runInNewContext(compiled, {
    module: loadedModule,
    exports: loadedModule.exports,
    process: {
      env: { VERCEL: vercel ? "1" : "", GEMINI_API_KEY: "test-only" },
    },
    require(id) {
      if (id === "server-only") return {}
      if (id === "@clerk/nextjs/server")
        return {
          async auth() {
            if (state.authError) throw state.authError
            return { userId: state.userId }
          },
        }
      if (id === "@/lib/prisma") return { prisma }
      if (id === "@/generated/prisma/enums") return { MembershipStatus }
      if (id === "node:crypto" || id === "node:net") return require(id)
      throw new Error(`Unexpected limiter dependency: ${id}`)
    },
  })
  return {
    state,
    request(headers = {}, path = "") {
      return loadedModule.exports.limitBibleAssistant(
        new Request(`https://megvieparis.com/api/bible/assistant${path}`, {
          headers: { "x-vercel-forwarded-for": "192.0.2.1", ...headers },
        }),
      )
    },
  }
}

test("active members can ask 32 text/voice questions per 10 minutes", async () => {
  const { state, request } = fixture(activeMember)
  for (let index = 0; index < 32; index++) {
    assert.equal((await request({}, index % 2 ? "/audio" : "")).allowed, true)
  }
  const blocked = await request()
  assert.equal(blocked.allowed, false)
  assert.equal(blocked.retryAfter, 600)
  assert.equal(state.counts.get("bible:global:day").count, 32)
  assert.deepEqual(state.lookups[0], {
    where: { clerkUserId: "clerk-member-one" },
    select: { id: true, membershipStatus: true },
  })
  state.now += 600
  assert.equal((await request()).allowed, true)
})

test("active members have 120 questions per 24-hour window, then reset", async () => {
  const { state, request } = fixture(activeMember)
  for (let index = 0; index < 120; index++) {
    if (index && index % 30 === 0) state.now += 600
    assert.equal((await request()).allowed, true)
  }
  const blocked = await request()
  assert.equal(blocked.allowed, false)
  assert.equal(blocked.retryAfter, 86400 - state.now)
  assert.equal(state.counts.get("bible:global:day").count, 120)
  const shortWindow = [...state.counts].find(([key]) =>
    key.includes(":10m:"),
  )[1]
  assert.equal(shortWindow.count, 30)
  state.now = 86400
  assert.equal((await request()).allowed, true)
})

test("visitors and inactive members retain 8 questions per 10 minutes", async () => {
  for (const status of [
    null,
    ...Object.values(MembershipStatus).filter((s) => s !== "ACTIVE"),
  ]) {
    const { state, request } = fixture(
      status ? { id: "inactive", membershipStatus: status } : null,
    )
    for (let index = 0; index < 8; index++)
      assert.equal((await request()).allowed, true)
    assert.equal((await request()).allowed, false, String(status))
    assert.equal(state.counts.get("bible:global:day").count, 8)
  }
})

test("the visitor daily limit remains 30 and legacy bucket keys are preserved", async () => {
  const { state, request } = fixture()
  for (let index = 0; index < 30; index++) {
    if (index && index % 6 === 0) state.now += 600
    assert.equal((await request()).allowed, true)
  }
  assert.equal((await request()).allowed, false)
  const identity = createHmac("sha256", "test-only")
    .update("192.0.2.1")
    .digest("hex")
  assert.equal(state.counts.get(`bible:day:${identity}`).count, 30)
  assert.equal(state.lookups.length, 0)
})

test("member allowances are per verified account, not browser or IP", async () => {
  const { state, request } = fixture(activeMember)
  for (let index = 0; index < 32; index++) await request()
  assert.equal(
    (await request({ "x-vercel-forwarded-for": "198.51.100.5" })).allowed,
    false,
  )
  state.userId = "clerk-member-two"
  state.member = { ...activeMember, id: "member-two" }
  assert.equal((await request()).allowed, true)
  assert.equal(state.counts.size, 5)
  assert.equal(
    [...state.counts.keys()].some((key) => key.includes("member-one")),
    false,
  )
})

test("client headers cannot grant membership or split local visitor buckets", async () => {
  const { state, request } = fixture(null, false)
  for (let index = 0; index < 8; index++) await request()
  assert.equal(
    (
      await request({
        "x-vercel-forwarded-for": "198.51.100.6",
        "x-forwarded-for": "198.51.100.7",
        "x-user-id": activeMember.id,
        "x-membership-status": "ACTIVE",
      })
    ).allowed,
    false,
  )
  state.userId = "clerk-without-local-member"
  assert.equal((await request()).allowed, false)
})

test("membership suspension removes the higher allowance on the next request", async () => {
  const { state, request } = fixture(activeMember)
  await request()
  state.member = { ...activeMember, membershipStatus: "SUSPENDED" }
  for (let index = 0; index < 8; index++)
    assert.equal((await request()).allowed, true)
  assert.equal((await request()).allowed, false)
})

test("the global 1000-question cap remains shared across members and visitors", async () => {
  const { state, request } = fixture(activeMember)
  state.counts.set("bible:global:day", { count: 999, expires: 86400 })
  assert.equal((await request()).allowed, true)
  assert.equal((await request()).allowed, false)
  state.userId = null
  state.member = null
  assert.equal((await request()).allowed, false)
  assert.equal(state.counts.get("bible:global:day").count, 1000)
  assert.equal(state.counts.size, 3)
})

test("auth, membership lookup and storage failures fail closed", async () => {
  for (const field of ["authError", "lookupError", "storageError"]) {
    const { state, request } = fixture(activeMember)
    const failure = new Error(field)
    state[field] = failure
    await assert.rejects(request(), (error) => error === failure)
    assert.equal(state.counts.size, 0)
  }
})

test("both API routes enforce the shared member-aware limiter", () => {
  for (const path of ["route.ts", "audio/route.ts"]) {
    const route = readFileSync(
      new URL(`../src/app/api/bible/assistant/${path}`, import.meta.url),
      "utf8",
    )
    assert.match(route, /await limitBibleAssistant\(request\)/)
    assert.match(route, /"Retry-After"/)
  }
})
