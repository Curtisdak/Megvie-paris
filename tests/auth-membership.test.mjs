import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const migration = readFileSync(
  "prisma/migrations/202606220003_clerk_neon_membership/migration.sql",
  "utf8",
)
const schema = readFileSync("prisma/schema.prisma", "utf8")
const permissions = readFileSync("src/lib/auth/permissions.ts", "utf8")
const actions = readFileSync("src/lib/auth/actions.ts", "utf8")
const prismaClient = readFileSync("src/lib/prisma.ts", "utf8")
const proxy = readFileSync("src/proxy.ts", "utf8")
const webhook = readFileSync("src/app/api/clerk/webhook/route.ts", "utf8")
const serviceWorker = readFileSync("public/sw.js", "utf8")

test("member ID format is exact", () => {
  const pattern = /^Mv[0-9]{5}P$/
  assert.equal(pattern.test("Mv00001P"), true)
  assert.equal(pattern.test("Mv00042P"), true)
  assert.equal(pattern.test("Mv99999P"), true)
  assert.equal(pattern.test("MV00001P"), false)
  assert.equal(pattern.test("Mv100000P"), false)
  assert.equal(pattern.test("Mv0001P"), false)
})

test("member ID generation is database-owned and bounded", () => {
  assert.match(migration, /create sequence if not exists member_number_seq/i)
  assert.match(migration, /maxvalue 99999/i)
  assert.match(migration, /no cycle/i)
  assert.match(migration, /member_profiles_member_id_format/i)
  assert.match(actions, /nextval\('member_number_seq'\)/)
  assert.doesNotMatch(schema, /member_id\s+String\s+@default/i)
})

test("signup and onboarding cannot choose an admin role", () => {
  assert.doesNotMatch(readFileSync("src/lib/auth/validation.ts", "utf8"), /role:/i)
  assert.match(schema, /role\s+ChurchRole\s+@default\(MEMBER\)/)
})

test("approval is idempotent and assigns absent IDs only", () => {
  assert.match(actions, /MembershipStatus\.ACTIVE/)
  assert.match(actions, /target\.profile\?\.memberId/)
  assert.match(actions, /if \(!memberNumber \|\| !memberId\)/)
})

test("role and privileged membership changes are guarded", () => {
  assert.match(permissions, /roles\.manage/)
  assert.match(actions, /requirePermission\("members\.approve"/)
  assert.match(actions, /requirePermission\("members\.suspend"/)
  assert.match(actions, /requirePermission\("roles\.manage"/)
  assert.match(actions, /Impossible de retirer le dernier compte Creator/)
})

test("Clerk middleware protects private routes", () => {
  assert.match(proxy, /clerkMiddleware/)
  assert.match(proxy, /\/espace-membre\(\.\*\)/)
  assert.match(proxy, /\/admin\(\.\*\)/)
  assert.match(proxy, /auth\.protect/)
})

test("Clerk webhook syncs identity but not authorization metadata", () => {
  assert.match(webhook, /verifyWebhook/)
  assert.match(webhook, /user\.created/)
  assert.match(webhook, /user\.updated/)
  assert.match(webhook, /user\.deleted/)
  assert.doesNotMatch(webhook, /publicMetadata|unsafeMetadata|privateMetadata/)
})

test("server-only Prisma helper cannot enter client bundle", () => {
  assert.match(prismaClient, /import "server-only"/)
  assert.match(prismaClient, /PrismaNeon/)
})

test("service worker does not statically cache private routes", () => {
  assert.doesNotMatch(serviceWorker, /caches\.open|cache\.put|addAll/)
  assert.doesNotMatch(serviceWorker, /espace-membre|admin/)
})

test("Supabase active app artifacts were removed", () => {
  assert.equal(existsSync("src/lib/supabase-admin.ts"), false)
  assert.equal(existsSync("src/lib/supabase"), false)
  assert.equal(existsSync("supabase/migrations/202606220001_auth_membership_rbac.sql"), false)
})
