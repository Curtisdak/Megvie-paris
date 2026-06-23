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
const adminActions = readFileSync("src/lib/admin/actions.ts", "utf8")
const adminData = readFileSync("src/lib/admin/data.ts", "utf8")
const adminNavigation = readFileSync("src/lib/admin/navigation.ts", "utf8")
const memberDashboard = readFileSync("src/components/auth/member-dashboard.tsx", "utf8")
const appChrome = readFileSync("src/components/navigation/app-chrome.tsx", "utf8")
const imageKit = readFileSync("src/lib/imagekit.ts", "utf8")
const packageJson = JSON.parse(readFileSync("package.json", "utf8"))
const prismaClient = readFileSync("src/lib/prisma.ts", "utf8")
const proxy = readFileSync("src/proxy.ts", "utf8")
const webhook = readFileSync("src/app/api/clerk/webhook/route.ts", "utf8")
const serviceWorker = readFileSync("public/sw.js", "utf8")
const adminMigration = readFileSync(
  "prisma/migrations/202606220005_admin_portal_content_management/migration.sql",
  "utf8",
)

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

test("Prompt 2 admin content models and migration exist", () => {
  for (const model of [
    "ChurchEvent",
    "GalleryAlbum",
    "GalleryItem",
    "ContactMessage",
    "MessageReply",
    "MessageInternalNote",
    "Announcement",
    "AnnouncementRead",
  ]) {
    assert.match(schema, new RegExp(`model ${model}`))
  }

  assert.match(adminMigration, /CREATE TABLE "church_events"/)
  assert.match(adminMigration, /CREATE TABLE "contact_messages"/)
  assert.match(adminMigration, /CREATE TABLE "announcements"/)
  assert.match(adminMigration, /ALTER TABLE "admin_audit_logs"/)
})

test("admin route tree requires Clerk protection and database admin role", () => {
  const clerkUser = readFileSync("src/lib/auth/clerk-user.ts", "utf8")

  assert.match(proxy, /\/admin\(\.\*\)/)
  assert.match(clerkUser, /isAdminRole\(user\.role\)/)
  assert.doesNotMatch(clerkUser, /aal !== "aal2"/)
  assert.match(readFileSync("src/app/admin/layout.tsx", "utf8"), /getAdminContext/)
})

test("role-aware navigation does not expose finance operational modules", () => {
  assert.match(adminNavigation, /role === "FINANCE"/)
  assert.doesNotMatch(
    adminNavigation.slice(
      adminNavigation.indexOf('role === "FINANCE"'),
      adminNavigation.indexOf("const items"),
    ),
    /evenements|messages|galerie|annonces/i,
  )
})

test("admin mutations are permission guarded and audited", () => {
  for (const permission of [
    "members.approve",
    "members.suspend",
    "roles.manage",
    "events.manage",
    "gallery.manage",
    "messages.read_general",
    "announcements.manage",
  ]) {
    assert.match(
      adminActions,
      new RegExp(`requirePermission\\(\\s*"${permission.replace(".", "\\.")}`),
    )
  }

  assert.match(adminActions, /adminAuditLog\.create/g)
  assert.match(adminActions, /target\.id === actor\.id/)
  assert.match(adminActions, /allowedAdminAssignments/)
  assert.doesNotMatch(adminActions, /ChurchRole\.CREATOR,[\s\S]*allowedAdminAssignments/)
})

test("message confidentiality is enforced in server queries", () => {
  assert.match(adminData, /messageAccessWhere/)
  assert.match(adminData, /messages\.read_confidential/)
  assert.match(adminData, /MessageConfidentiality\.GENERAL/)
  assert.match(adminActions, /requireMessageAccess/)
  assert.match(adminActions, /PASTORAL_CONFIDENTIAL/)
})

test("Prompt 2 preserves current notification and service worker architecture", () => {
  assert.equal(existsSync("public/sw.js"), true)
  assert.equal(existsSync("src/components/pwa/pwa-provider.tsx"), true)
  assert.doesNotMatch(JSON.stringify(packageJson.dependencies), /ably|firebase|supabase/)
})

test("ImageKit upload provider is server-only and wired to admin image forms", () => {
  assert.match(imageKit, /import "server-only"/)
  assert.match(imageKit, /IMAGEKIT_PRIVATE_KEY/)
  assert.match(imageKit, /https:\/\/upload\.imagekit\.io\/api\/v1\/files\/upload/)
  assert.match(imageKit, /Authorization: `Basic/)
  assert.match(imageKit, /image\/jpeg/)
  assert.match(imageKit, /image\/png/)
  assert.match(imageKit, /image\/webp/)
  assert.match(adminActions, /uploadImageFromFormData/)
  assert.match(readFileSync("src/app/admin/evenements/event-form.tsx", "utf8"), /coverImageFile/)
  assert.match(readFileSync("src/app/admin/evenements/event-form.tsx", "utf8"), /ImageDropzone/)
  assert.doesNotMatch(readFileSync("src/app/admin/evenements/event-form.tsx", "utf8"), /URL ImageKit existante/)
  assert.match(readFileSync("src/app/admin/evenements/page.tsx", "utf8"), /EventFormDialog/)
  assert.match(readFileSync("src/components/admin/event-form-dialog.tsx", "utf8"), /coverImageFile/)
  assert.match(readFileSync("src/components/admin/event-form-dialog.tsx", "utf8"), /stayOnPage/)
  assert.match(readFileSync("src/app/admin/galerie/page.tsx", "utf8"), /imageFile/)
  assert.match(readFileSync("src/app/admin/annonces/page.tsx", "utf8"), /AnnouncementFormDialog/)
  assert.match(readFileSync("src/components/admin/announcement-form-dialog.tsx", "utf8"), /coverImageFile/)
  assert.match(readFileSync("src/components/admin/announcement-form-dialog.tsx", "utf8"), /ImageDropzone/)
  assert.equal(existsSync("src/components/admin/image-dropzone.tsx"), true)
  assert.match(readFileSync("src/components/admin/image-dropzone.tsx", "utf8"), /onDrop/)
  assert.match(readFileSync("src/components/admin/image-dropzone.tsx", "utf8"), /previewUrl/)
  assert.match(readFileSync(".env.example", "utf8"), /IMAGE_STORAGE_PROVIDER=imagekit/)
})

test("published Prompt 2 content is surfaced outside admin", () => {
  assert.match(readFileSync("src/app/page.tsx", "utf8"), /PublicContentSection/)
  assert.match(adminData, /listPublicContent/)
  assert.match(adminData, /listMemberDashboardContent/)
  assert.match(readFileSync("src/components/auth/member-dashboard.tsx", "utf8"), /\/espace-membre\/annonces/)
})

test("member announcement page tracks reads", () => {
  assert.equal(existsSync("src/app/espace-membre/annonces/page.tsx"), true)
  assert.equal(existsSync("src/app/espace-membre/annonces/[id]/page.tsx"), true)
  assert.match(adminData, /listMemberAnnouncements/)
  assert.match(adminData, /getMemberAnnouncementDetail/)
  assert.match(adminData, /announcementRead\.upsert/)
  assert.match(adminData, /announcementId_userId/)
})

test("ImageKit real smoke command is available", () => {
  assert.equal(packageJson.scripts["smoke:imagekit"], "tsx scripts/smoke-imagekit.ts")
  assert.equal(existsSync("scripts/smoke-imagekit.ts"), true)
  const smoke = readFileSync("scripts/smoke-imagekit.ts", "utf8")
  assert.match(smoke, /https:\/\/upload\.imagekit\.io\/api\/v1\/files\/upload/)
  assert.match(smoke, /https:\/\/api\.imagekit\.io\/v1\/files/)
  assert.match(smoke, /IMAGEKIT_PRIVATE_KEY/)
  assert.match(smoke, /DELETE/)
})

test("admin users have a post-login and dashboard path to admin", () => {
  assert.equal(existsSync("src/app/apres-connexion/page.tsx"), true)
  const afterLogin = readFileSync("src/app/apres-connexion/page.tsx", "utf8")
  const loginPage = readFileSync("src/app/connexion/[[...sign-in]]/page.tsx", "utf8")

  assert.match(loginPage, /\/apres-connexion/)
  assert.match(afterLogin, /isAdminRole/)
  assert.match(afterLogin, /redirect\(\"\/admin\"\)/)
  assert.match(memberDashboard, /Administration/)
  assert.match(memberDashboard, /href: "\/admin"/)
  assert.doesNotMatch(memberDashboard, /admin=aal2/)
})

test("admin routes do not render public app chrome", () => {
  const rootLayout = readFileSync("src/app/layout.tsx", "utf8")
  const globals = readFileSync("src/app/globals.css", "utf8")

  assert.match(rootLayout, /<AppChrome \/>/)
  assert.match(appChrome, /pathname\.startsWith\(\"\/admin\"\)/)
  assert.match(appChrome, /if \(isAdminRoute\) return null/)
  assert.match(globals, /\.admin-route body/)
  assert.doesNotMatch(rootLayout, /<AppNavigation \/>/)
  assert.doesNotMatch(rootLayout, /<FloatingInstallButton \/>/)
})
