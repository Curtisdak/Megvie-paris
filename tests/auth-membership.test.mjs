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
const appNavigation = readFileSync("src/components/navigation/app-navigation.tsx", "utf8")
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
const pushMigration = readFileSync(
  "prisma/migrations/202606230001_push_notification_orchestration/migration.sql",
  "utf8",
)
const notificationService = readFileSync("src/lib/notifications/service.ts", "utf8")
const notificationSafety = readFileSync("src/lib/notifications/safety.ts", "utf8")
const memberNotificationsPage = readFileSync(
  "src/app/espace-membre/notifications/page.tsx",
  "utf8",
)
const adminNotificationsPage = readFileSync(
  "src/app/admin/notifications/page.tsx",
  "utf8",
)
const adminNotificationActions = readFileSync(
  "src/lib/notifications/admin-actions.ts",
  "utf8",
)
const pushSubscribeRoute = readFileSync("src/app/api/push/subscribe/route.ts", "utf8")
const pushUnsubscribeRoute = readFileSync("src/app/api/push/unsubscribe/route.ts", "utf8")
const pushDetachRoute = readFileSync("src/app/api/push/detach/route.ts", "utf8")
const notificationCronRoute = readFileSync(
  "src/app/api/cron/notifications/route.ts",
  "utf8",
)
const stripeFinanceMigration = readFileSync(
  "prisma/migrations/20260623160000_stripe_donations_recurring_finance/migration.sql",
  "utf8",
)
const stripeServer = readFileSync("src/lib/stripe/server.ts", "utf8")
const financeCheckout = readFileSync("src/lib/finance/checkout.ts", "utf8")
const financeWebhooks = readFileSync("src/lib/finance/webhooks.ts", "utf8")
const financeData = readFileSync("src/lib/finance/data.ts", "utf8")
const financeCsv = readFileSync("src/lib/finance/csv.ts", "utf8")
const stripeWebhookRoute = readFileSync("src/app/api/stripe/webhook/route.ts", "utf8")
const stripeSmoke = readFileSync("scripts/smoke-stripe.ts", "utf8")
const stripeHistoricalImport = readFileSync(
  "scripts/import-stripe-checkout-history.ts",
  "utf8",
)
const directDonationMigration = readFileSync(
  "prisma/migrations/20260624120000_direct_cash_donations/migration.sql",
  "utf8",
)
const directDonationActions = readFileSync("src/lib/finance/direct.ts", "utf8")
const directDonationNotifications = readFileSync(
  "src/lib/finance/notifications.ts",
  "utf8",
)
const directDonationForm = readFileSync(
  "src/components/donation/direct-donation-form.tsx",
  "utf8",
)
const directDonationListPage = readFileSync(
  "src/app/admin/dons/directs/page.tsx",
  "utf8",
)
const directDonationDetailPage = readFileSync(
  "src/app/admin/dons/directs/[id]/page.tsx",
  "utf8",
)
const memberDonationsPage = readFileSync(
  "src/app/espace-membre/dons/page.tsx",
  "utf8",
)
const directDonationDocs = readFileSync("docs/DIRECT_DONATIONS_SETUP.md", "utf8")
const bibleDailyMigration = readFileSync(
  "prisma/migrations/20260624170000_bible_favorites_notes_daily_schedule/migration.sql",
  "utf8",
)
const bibleData = readFileSync("src/lib/bible-data.ts", "utf8")
const bibleActions = readFileSync("src/lib/bible-actions.ts", "utf8")
const bibleMemberData = readFileSync("src/lib/bible-data-member.ts", "utf8")
const biblePageClient = readFileSync(
  "src/components/bible/bible-page-client.tsx",
  "utf8",
)
const bibleVerseActions = readFileSync(
  "src/components/bible/verse-actions.tsx",
  "utf8",
)
const verseShareDialog = readFileSync(
  "src/components/bible/verse-share-dialog.tsx",
  "utf8",
)
const dailyVerseAdmin = readFileSync("src/lib/daily-verse-admin.ts", "utf8")
const dailyVerseScheduler = readFileSync(
  "src/components/bible/daily-verse-scheduler.tsx",
  "utf8",
)
const dailyVersePage = readFileSync("src/app/verset-du-jour/page.tsx", "utf8")
const memberNotificationInbox = readFileSync(
  "src/components/notifications/member-notification-inbox.tsx",
  "utf8",
)
const dailyVerseCronRoute = readFileSync(
  "src/app/api/cron/daily-verse/route.ts",
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
  assert.match(proxy, /new URL\("\/connexion"/)
  assert.match(proxy, /searchParams\.set\("next"/)
  assert.doesNotMatch(proxy, /redirectToSignIn/)
})

test("Clerk webhook syncs identity but not authorization metadata", () => {
  assert.match(webhook, /verifyWebhook/)
  assert.match(webhook, /user\.created/)
  assert.match(webhook, /user\.updated/)
  assert.match(webhook, /user\.deleted/)
  assert.doesNotMatch(webhook, /publicMetadata|unsafeMetadata|privateMetadata/)
})

test("server auth helper redirects signed-out users to local login", () => {
  const clerkUser = readFileSync("src/lib/auth/clerk-user.ts", "utf8")

  assert.match(clerkUser, /redirect\(`\/connexion\?next=\$\{encodeURIComponent\(nextPath\)\}`\)/)
  assert.doesNotMatch(clerkUser, /redirectToSignIn/)
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

test("admin delete actions are guarded, audited and exposed in admin UI", () => {
  const eventsPage = readFileSync("src/app/admin/evenements/page.tsx", "utf8")
  const announcementsPage = readFileSync("src/app/admin/annonces/page.tsx", "utf8")
  const messagesPage = readFileSync("src/app/admin/messages/page.tsx", "utf8")
  const messageDetailPage = readFileSync("src/app/admin/messages/[id]/page.tsx", "utf8")
  const deleteButton = readFileSync(
    "src/components/admin/delete-submit-button.tsx",
    "utf8",
  )

  for (const actionName of [
    "deleteEventAction",
    "deleteAnnouncementAction",
    "deleteMessageAction",
  ]) {
    assert.match(adminActions, new RegExp(`export async function ${actionName}`))
  }

  assert.match(adminActions, /requirePermission\("events\.manage"/)
  assert.match(adminActions, /requirePermission\("announcements\.manage"/)
  assert.match(adminActions, /requireMessageAccess/)
  assert.match(adminActions, /action: "event\.deleted"/)
  assert.match(adminActions, /action: "announcement\.deleted"/)
  assert.match(adminActions, /action: "message\.deleted"/)
  assert.match(adminActions, /EventStatus\.ARCHIVED/)
  assert.match(adminActions, /AnnouncementStatus\.ARCHIVED/)
  assert.match(adminActions, /ContactMessageStatus\.ARCHIVED/)
  assert.match(adminNotificationActions, /export async function deleteNotificationCampaignAction/)
  assert.match(adminNotificationActions, /requirePermission\(\s*"notifications\.manage"/)
  assert.match(adminNotificationActions, /notification\.campaign_deleted/)
  assert.match(adminNotificationActions, /pushDeliveryAttempt\.deleteMany/)
  assert.match(adminNotificationActions, /notificationRecipient\.deleteMany/)
  assert.match(adminNotificationActions, /notificationCampaign\.delete/)
  assert.match(deleteButton, /window\.confirm/)
  assert.match(eventsPage, /deleteEventAction/)
  assert.match(announcementsPage, /deleteAnnouncementAction/)
  assert.match(messagesPage, /deleteMessageAction/)
  assert.match(messageDetailPage, /deleteMessageAction/)
  assert.match(adminNotificationsPage, /deleteNotificationCampaignAction/)
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
  assert.match(readFileSync("src/app/admin/galerie/page.tsx", "utf8"), /ImageDropzone/)
  assert.match(readFileSync("src/app/admin/annonces/page.tsx", "utf8"), /AnnouncementFormDialog/)
  assert.match(readFileSync("src/components/admin/announcement-form-dialog.tsx", "utf8"), /coverImageFile/)
  assert.match(readFileSync("src/components/admin/announcement-form-dialog.tsx", "utf8"), /ImageDropzone/)
  assert.equal(existsSync("src/components/admin/image-dropzone.tsx"), true)
  assert.match(readFileSync("src/components/admin/image-dropzone.tsx", "utf8"), /onDrop/)
  assert.match(readFileSync("src/components/admin/image-dropzone.tsx", "utf8"), /previewUrl/)
  assert.match(readFileSync(".env.example", "utf8"), /IMAGE_STORAGE_PROVIDER=imagekit/)
})

test("published Prompt 2 content remains available outside admin", () => {
  const homePage = readFileSync("src/app/page.tsx", "utf8")

  assert.match(homePage, /EventImageSlider/)
  assert.doesNotMatch(homePage, /PublicContentSection/)
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

test("Clerk auth components are localized and styled for the French app", () => {
  const rootLayout = readFileSync("src/app/layout.tsx", "utf8")
  const loginPage = readFileSync("src/app/connexion/[[...sign-in]]/page.tsx", "utf8")

  assert.match(JSON.stringify(packageJson.dependencies), /@clerk\/localizations/)
  assert.match(rootLayout, /import \{ frFR \} from "@clerk\/localizations"/)
  assert.match(rootLayout, /localization=\{frFR\}/)
  assert.match(rootLayout, /const clerkAppearance/)
  assert.match(rootLayout, /colorPrimary: "#d97706"/)
  assert.match(rootLayout, /formButtonPrimary/)
  assert.doesNotMatch(loginPage, /avec Clerk/)
  assert.doesNotMatch(memberDashboard, /Clerk gere/)
})

test("mobile bottom navigation exposes member space access", () => {
  assert.match(appNavigation, /href: "\/espace-membre"/)
  assert.match(appNavigation, /icon: UserRound/)
  assert.match(appNavigation, /grid-cols-5/)
  assert.doesNotMatch(
    appNavigation.slice(
      appNavigation.indexOf("const mobileNavItems"),
      appNavigation.indexOf("const SIDEBAR_STORAGE_KEY"),
    ),
    /item\.href !== "\/espace-membre"/,
  )
})

test("admin routes do not render public app chrome", () => {
  const rootLayout = readFileSync("src/app/layout.tsx", "utf8")
  const globals = readFileSync("src/app/globals.css", "utf8")
  const adminShell = readFileSync("src/components/admin/admin-shell.tsx", "utf8")

  assert.match(rootLayout, /<AppChrome \/>/)
  assert.match(appChrome, /pathname\.startsWith\(\"\/admin\"\)/)
  assert.match(appChrome, /if \(isAdminRoute\) return null/)
  assert.match(globals, /\.admin-route body/)
  assert.match(adminShell, /env\(safe-area-inset-bottom\)/)
  assert.match(adminShell, /aria-label="Navigation administration mobile"/)
  assert.match(adminShell, /fixed inset-x-0 bottom-0/)
  assert.match(adminShell, /mobilePrimaryItems/)
  assert.match(adminShell, /mobileOverflowItems/)
  assert.match(adminShell, />Plus</)
  assert.doesNotMatch(adminShell, /overflow-x-auto/)
  assert.doesNotMatch(rootLayout, /<AppNavigation \/>/)
  assert.doesNotMatch(rootLayout, /<FloatingInstallButton \/>/)
})

test("Prompt 3 notification orchestration models and migration exist", () => {
  for (const model of [
    "NotificationCampaign",
    "NotificationRecipient",
    "PushDeliveryAttempt",
  ]) {
    assert.match(schema, new RegExp(`model ${model}`))
  }

  for (const enumName of [
    "NotificationType",
    "NotificationAudienceType",
    "NotificationCampaignStatus",
    "PushDeliveryStatus",
  ]) {
    assert.match(schema, new RegExp(`enum ${enumName}`))
  }

  assert.match(pushMigration, /CREATE TABLE "notification_campaigns"/)
  assert.match(pushMigration, /CREATE TABLE "notification_recipients"/)
  assert.match(pushMigration, /CREATE TABLE "push_delivery_attempts"/)
  assert.match(pushMigration, /notification_campaigns_dedupe_key_key/)
  assert.match(pushMigration, /notification_recipients_campaign_id_user_id_key/)
  assert.match(pushMigration, /anonymous_daily_verse_enabled/)
  assert.match(pushMigration, /staff_message_push_enabled/)
})

test("Prompt 3 keeps one service worker and uses safe notification URLs", () => {
  assert.equal((serviceWorker.match(/addEventListener\("push"/g) ?? []).length, 1)
  assert.match(serviceWorker, /safeNotificationUrl/)
  assert.match(serviceWorker, /raw\.startsWith\("\/"\)/)
  assert.match(serviceWorker, /raw\.startsWith\("\/\/"\)/)
  assert.match(serviceWorker, /url\.origin !== self\.location\.origin/)
  assert.doesNotMatch(serviceWorker, /caches\.open|cache\.put|addAll/)
  assert.doesNotMatch(serviceWorker, /firebase|supabase|ably/i)
})

test("Prompt 3 push subscription routes derive ownership from Clerk", () => {
  assert.match(pushSubscribeRoute, /const authState = await auth\(\)/)
  assert.match(pushSubscribeRoute, /where: \{ clerkUserId: authState\.userId \}/)
  assert.doesNotMatch(pushSubscribeRoute, /body\.userId|clientUserId|role/)
  assert.match(pushSubscribeRoute, /anonymousDailyVerseEnabled/)
  assert.match(pushUnsubscribeRoute, /userId: appUser \? appUser\.id : null/)
  assert.match(pushDetachRoute, /where: \{ endpoint: body\.endpoint, userId: user\.id \}/)
})

test("Prompt 3 anonymous subscriptions cannot receive private campaigns", () => {
  assert.match(notificationService, /ANONYMOUS_DAILY_VERSE/)
  assert.match(notificationService, /userId: null/)
  assert.match(notificationService, /STAFF_GENERAL/)
  assert.match(notificationService, /STAFF_CONFIDENTIAL/)
  assert.match(notificationService, /ChurchRole\.RESPO, ChurchRole\.MASTER, ChurchRole\.CREATOR/)
  assert.match(notificationService, /ChurchRole\.MASTER, ChurchRole\.CREATOR/)
  assert.doesNotMatch(
    notificationService.slice(
      notificationService.indexOf("STAFF_GENERAL"),
      notificationService.indexOf("STAFF_CONFIDENTIAL"),
    ),
    /FINANCE/,
  )
})

test("Prompt 3 member inbox and admin monitoring routes exist", () => {
  assert.match(memberNotificationsPage, /MemberPushManager/)
  assert.match(memberNotificationsPage, /MemberNotificationInbox/)
  assert.match(memberNotificationInbox, /markAllNotificationsReadAction/)
  assert.match(memberNotificationsPage, /NotificationPreferencesForm/)
  assert.match(adminNotificationsPage, /listNotificationCampaigns/)
  assert.match(adminNotificationsPage, /sendAdminTestNotificationAction/)
  assert.match(adminNavigation, /\/admin\/notifications/)
  assert.match(permissions, /notifications\.manage/)
})

test("Prompt 3 scheduler and delivery service are protected and idempotent", () => {
  assert.match(notificationCronRoute, /validateRequestSecret\(request, \["CRON_SECRET"\]\)/)
  assert.match(notificationService, /FOR UPDATE SKIP LOCKED/)
  assert.match(notificationService, /birthday:\$\{member\.id\}:\$\{dateKey\}/)
  assert.match(notificationService, /daily-verse:\$\{dateKey\}:members/)
  assert.match(notificationService, /daily-verse:\$\{dateKey\}:anonymous/)
  assert.match(notificationSafety, /CHURCH_TIMEZONE/)
  assert.match(notificationSafety, /PUSH_BATCH_SIZE/)
})

test("Prompt 4 Stripe finance schema and migration exist", () => {
  for (const model of [
    "DonationCategory",
    "DonationCheckout",
    "Donation",
    "RecurringDonation",
    "DonationRefund",
    "StripeWebhookEvent",
  ]) {
    assert.match(schema, new RegExp(`model ${model}`))
  }

  for (const enumName of [
    "DonationFrequency",
    "DonationCheckoutStatus",
    "DonationStatus",
    "RecurringDonationStatus",
    "DonationRefundStatus",
    "StripeWebhookProcessingStatus",
  ]) {
    assert.match(schema, new RegExp(`enum ${enumName}`))
  }

  assert.match(schema, /stripeCustomerId\s+String\?\s+@unique/)
  assert.match(stripeFinanceMigration, /CREATE TABLE "donations"/)
  assert.match(stripeFinanceMigration, /CREATE TABLE "recurring_donations"/)
  assert.match(stripeFinanceMigration, /CREATE TABLE "stripe_webhook_events"/)
  assert.match(stripeFinanceMigration, /doncat_dime/)
  assert.match(stripeFinanceMigration, /ON CONFLICT \("slug"\) DO UPDATE/)
})

test("Prompt 4 Stripe server helper validates secrets and stays server-only", () => {
  assert.match(stripeServer, /import "server-only"/)
  assert.match(stripeServer, /startsWith\("pk_"\)/)
  assert.match(stripeServer, /startsWith\("sk_test_"\)/)
  assert.match(stripeServer, /startsWith\("sk_live_"\)/)
  assert.match(stripeServer, /startsWith\("whsec_"\)/)
  assert.doesNotMatch(appChrome, /STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET/)
  assert.doesNotMatch(memberDashboard, /STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET/)
})

test("Prompt 4 checkout validates trusted server inputs", () => {
  assert.match(financeCheckout, /checkRateLimit\(`donation-checkout/)
  assert.match(financeCheckout, /assertSupportedCurrency/)
  assert.match(financeCheckout, /getActiveDonationCategory/)
  assert.match(financeCheckout, /DonationFrequency\.MONTHLY/)
  assert.match(financeCheckout, /MembershipStatus\.ACTIVE/)
  assert.match(financeCheckout, /getOrCreateStripeCustomer/)
  assert.match(financeCheckout, /Votre nom et votre email/)
  assert.match(financeCheckout, /idempotencyKey = `checkout:\$\{checkout\.id\}`/)
  assert.doesNotMatch(financeCheckout, /input\.userId|input\.memberId|input\.stripeCustomerId/)
})

test("Prompt 4 webhook route verifies raw Stripe signatures", () => {
  assert.match(stripeWebhookRoute, /request\.text\(\)/)
  assert.match(stripeWebhookRoute, /webhooks\.constructEvent/)
  assert.match(stripeWebhookRoute, /stripe-signature/)
  assert.match(stripeWebhookRoute, /processStripeWebhookEvent/)
  assert.doesNotMatch(stripeWebhookRoute, /auth\(|clerk/)
})

test("Prompt 4 webhook processing is idempotent and covers finance events", () => {
  assert.match(financeWebhooks, /stripeWebhookEvent\.findUnique/)
  assert.match(financeWebhooks, /processingStatus === StripeWebhookProcessingStatus\.PROCESSED/)
  assert.match(financeWebhooks, /checkout\.session\.completed/)
  assert.match(financeWebhooks, /invoice\.payment_failed/)
  assert.match(financeWebhooks, /customer\.subscription\.updated/)
  assert.match(financeWebhooks, /charge\.refunded/)
  assert.match(financeWebhooks, /refund\.updated/)
  assert.match(financeWebhooks, /charge\.dispute\.closed/)
  assert.match(financeWebhooks, /createDonationSuccessNotification/)
  assert.match(financeWebhooks, /createDonationFailureNotification/)
})

test("Prompt 4 finance admin, member history and CSV protections exist", () => {
  assert.equal(existsSync("src/app/admin/finance/page.tsx"), true)
  assert.equal(existsSync("src/app/admin/webhooks-stripe/page.tsx"), true)
  assert.equal(existsSync("src/app/espace-membre/dons/page.tsx"), true)
  assert.equal(existsSync("src/app/api/admin/finance/export/route.ts"), true)
  assert.match(adminNavigation, /\/admin\/finance/)
  assert.match(adminNavigation, /\/admin\/webhooks-stripe/)
  assert.match(financeData, /requireFinancePermission/)
  assert.match(financeData, /donations\.read_all/)
  assert.match(financeData, /donations\.export/)
  assert.match(financeCsv, /Date/)
  assert.match(financeCsv, /Identifiant membre/)
  assert.match(financeCsv, /\^\[=\+\\-@\]/)
})

test("Prompt 4 Stripe smoke test refuses live keys and creates no charge", () => {
  assert.equal(packageJson.scripts["stripe:listen"], "stripe listen --forward-to localhost:3000/api/stripe/webhook")
  assert.equal(packageJson.scripts["smoke:stripe"], "tsx scripts/smoke-stripe.ts")
  assert.match(stripeSmoke, /startsWith\("sk_live_"\)/)
  assert.match(stripeSmoke, /Refusing to run Stripe smoke test/)
  assert.match(stripeSmoke, /checkout\.sessions\.create/)
  assert.match(stripeSmoke, /checkout\.sessions\.expire/)
  assert.doesNotMatch(stripeSmoke, /paymentIntents\.create|charges\.create/)
})

test("Prompt 4 historical Stripe import is manual and safe", () => {
  assert.equal(packageJson.scripts["import:stripe-history"], "tsx scripts/import-stripe-checkout-history.ts")
  assert.match(stripeHistoricalImport, /checkout\.sessions\.list/)
  assert.match(stripeHistoricalImport, /status: "complete"/)
  assert.match(stripeHistoricalImport, /session\.mode !== "payment"/)
  assert.match(stripeHistoricalImport, /session\.payment_status !== "paid"/)
  assert.match(stripeHistoricalImport, /stripePaymentIntentId/)
  assert.match(stripeHistoricalImport, /findUnique\(\{\s*where: \{ stripePaymentIntentId/s)
  assert.match(stripeHistoricalImport, /DonationStatus\.SUCCEEDED/)
  assert.doesNotMatch(stripeHistoricalImport, /card|cvc|payment_method|client_secret/i)
})

test("Prompt 4.5 direct donation schema extends the existing ledger", () => {
  for (const enumName of [
    "DonationSource",
    "DirectDonationKind",
    "DirectDonationStatus",
  ]) {
    assert.match(schema, new RegExp(`enum ${enumName}`))
  }

  assert.match(schema, /source\s+DonationSource\s+@default\(ONLINE\)/)
  assert.match(schema, /directKind\s+DirectDonationKind\?/)
  assert.match(schema, /directStatus\s+DirectDonationStatus\?/)
  assert.match(schema, /directEntryRequestId\s+String\?\s+@unique/)
  assert.doesNotMatch(schema, /model DirectDonation/)
  assert.match(directDonationMigration, /CREATE TYPE "donation_source"/)
  assert.match(directDonationMigration, /"source" = 'ONLINE'/)
  assert.match(directDonationMigration, /"source" = 'DIRECT'/)
  assert.match(directDonationMigration, /"stripe_payment_intent_id" IS NULL/)
  assert.match(directDonationMigration, /"direct_status" = 'VERIFIED' AND "status" = 'SUCCEEDED'/)
  assert.match(directDonationMigration, /"direct_kind" = 'ANONYMOUS_COLLECTION'/)
})

test("Prompt 4.5 direct donation actions are role guarded, audited and idempotent", () => {
  assert.match(directDonationActions, /allowedDirectRoles/)
  assert.match(directDonationActions, /ChurchRole\.FINANCE/)
  assert.match(directDonationActions, /ChurchRole\.MASTER/)
  assert.match(directDonationActions, /ChurchRole\.CREATOR/)
  assert.match(directDonationActions, /requireFinancePermission\("donations\.read_all"/)
  assert.match(directDonationActions, /membershipStatus: MembershipStatus\.ACTIVE/)
  assert.match(directDonationActions, /directEntryRequestId/)
  assert.match(directDonationActions, /findUnique\(\{\s*where: \{ directEntryRequestId/s)
  assert.match(directDonationActions, /source: DonationSource\.DIRECT/)
  assert.match(directDonationActions, /directStatus: DirectDonationStatus\.RECORDED/)
  assert.match(directDonationActions, /directStatus: DirectDonationStatus\.VERIFIED/)
  assert.match(directDonationActions, /directStatus: DirectDonationStatus\.CANCELLED/)
  assert.match(directDonationActions, /adminAuditLog\.create/)
  assert.match(directDonationActions, /correctionRoles/)
  assert.match(directDonationActions, /replacesDonationId/)
})

test("Prompt 4.5 direct notifications are private and anonymous collections do not notify", () => {
  assert.match(directDonationNotifications, /createDirectDonationRecordedNotification/)
  assert.match(directDonationNotifications, /createDirectDonationVerifiedNotification/)
  assert.match(directDonationNotifications, /createDirectDonationCorrectionNotification/)
  assert.match(directDonationNotifications, /if \(!input\.userId\) return null/)
  assert.match(directDonationNotifications, /targetUrl: "\/espace-membre\/dons"/)
  assert.doesNotMatch(directDonationNotifications, /amount|category|admin|finance/i)
  assert.match(directDonationActions, /ANONYMOUS_COLLECTION[\s\S]*selectedMember\?\.id \?\? null/)
  assert.match(directDonationActions, /createDirectDonationRecordedNotification/)
  assert.match(directDonationActions, /if \(selectedMember\)/)
})

test("Prompt 4.5 finance totals and filters separate online and verified direct donations", () => {
  assert.match(financeData, /source: DonationSource\.ONLINE/)
  assert.match(financeData, /source: DonationSource\.DIRECT/)
  assert.match(financeData, /directStatus: DirectDonationStatus\.VERIFIED/)
  assert.match(financeData, /directStatus: DirectDonationStatus\.RECORDED/)
  assert.match(financeData, /combineOfficialTotals/)
  assert.match(financeData, /directVerifiedTotals/)
  assert.match(financeData, /directRecorded/)
  assert.match(readFileSync("src/app/admin/finance/page.tsx", "utf8"), /Ajouter un don direct/)
  assert.match(readFileSync("src/app/admin/finance/page.tsx", "utf8"), /Direct verifies/)
  assert.match(readFileSync("src/app/admin/finance/page.tsx", "utf8"), /Total officiel/)
  assert.match(financeCsv, /Source/)
  assert.match(financeCsv, /Statut direct/)
  assert.match(financeCsv, /donation\.source === "ONLINE"/)
})

test("Prompt 4.5 admin direct donation UI and routes exist", () => {
  assert.equal(existsSync("src/app/admin/dons/directs/page.tsx"), true)
  assert.equal(existsSync("src/app/admin/dons/directs/nouveau/page.tsx"), true)
  assert.equal(existsSync("src/app/admin/dons/directs/[id]/page.tsx"), true)
  assert.equal(existsSync("src/app/api/admin/direct-donations/member-search/route.ts"), true)
  assert.match(adminNavigation, /\/admin\/dons\/directs/)
  assert.match(directDonationForm, /member-search/)
  assert.match(directDonationForm, /ANONYMOUS_COLLECTION/)
  assert.match(directDonationForm, /directEntryRequestId/)
  assert.match(directDonationListPage, /Ajouter un don/)
  assert.match(directDonationDetailPage, /verifyDirectDonationAction/)
  assert.match(directDonationDetailPage, /correctVerifiedDirectDonationAction/)
})

test("Prompt 4.5 member history exposes direct donations without internal finance data", () => {
  assert.match(memberDonationsPage, /donation\.source === "DIRECT"/)
  assert.match(memberDonationsPage, /Don direct/)
  assert.match(memberDonationsPage, /donation\.directStatus/)
  assert.doesNotMatch(memberDonationsPage, /internalNote|manualReference|enteredBy|verifiedBy|cancelledBy/)
  assert.match(financeData, /const where = \{ userId: user\.id \}/)
})

test("Prompt 4.5 Stripe webhook processing cannot mutate direct donations", () => {
  assert.match(financeWebhooks, /source: DonationSource\.ONLINE/)
  assert.match(financeWebhooks, /source !== DonationSource\.ONLINE/)
  assert.match(financeWebhooks, /stripeChargeId: chargeId, source: DonationSource\.ONLINE/)
  assert.match(financeWebhooks, /stripePaymentIntentId: paymentIntentId,[\s\S]*source: DonationSource\.ONLINE/)
  assert.doesNotMatch(financeWebhooks, /DonationSource\.DIRECT/)
})

test("Prompt 4.5 direct donations are documented", () => {
  assert.match(directDonationDocs, /ONLINE/)
  assert.match(directDonationDocs, /DIRECT/)
  assert.match(directDonationDocs, /VERIFIED/)
  assert.match(directDonationDocs, /\/admin\/dons\/directs/)
  assert.match(directDonationDocs, /Stripe/)
  assert.match(directDonationDocs, /rollback/i)
})

test("Prompt 5 Bible favorites, notes and daily schedule schema exist", () => {
  for (const model of ["BibleFavorite", "BibleNote", "DailyVerseSchedule"]) {
    assert.match(schema, new RegExp(`model ${model}`))
  }

  assert.match(schema, /enum DailyVerseScheduleStatus/)
  assert.match(bibleDailyMigration, /CREATE TABLE "bible_favorites"/)
  assert.match(bibleDailyMigration, /CREATE TABLE "bible_notes"/)
  assert.match(bibleDailyMigration, /CREATE TABLE "daily_verse_schedules"/)
  assert.match(bibleDailyMigration, /bible_favorites_user_verse_translation_key/)
  assert.match(bibleDailyMigration, /bible_notes_user_verse_translation_key/)
  assert.match(bibleDailyMigration, /daily_verse_schedules_active_local_date_key/)
  assert.match(bibleDailyMigration, /daily_verse_schedules_dedupe_key_key/)
})

test("Bible chapter loading avoids full verses JSON parsing", () => {
  assert.equal(existsSync("bible/verses.chapter-index.json"), true)
  assert.equal(existsSync("bible/verses.search-index.json"), true)
  assert.match(bibleData, /readVerseChapterIndex/)
  assert.match(bibleData, /fs\.readSync\(fd, buffer, 0, length, entry\.start\)/)
  assert.match(bibleData, /chapterVerseCache/)
  assert.match(bibleData, /searchReferenceVerses/)
  assert.match(bibleData, /readVerseSearchIndex/)
  assert.match(bibleData, /searchIndexedVerses/)
})

test("Prompt 5 Bible favorite and note mutations derive ownership server-side", () => {
  assert.match(bibleActions, /requireCurrentAppUser/)
  assert.match(bibleActions, /validateBibleVerseSelection/)
  assert.match(bibleActions, /userId: user\.id/)
  assert.match(bibleActions, /deleteMany\(\{\s*where: \{ id: .*userId: user\.id/s)
  assert.match(bibleActions, /content\.length < 1 \|\| content\.length > 2000/)
  assert.doesNotMatch(bibleActions, /formData\.get\("userId"\)|formData\.get\("role"\)/)
  assert.match(bibleMemberData, /userId: user\.id/)
  assert.equal(existsSync("src/app/espace-membre/versets-favoris/page.tsx"), true)
  assert.equal(existsSync("src/app/espace-membre/notes-bibliques/page.tsx"), true)
})

test("Prompt 5 Bible UI uses optimistic favorites, notes and deferred search", () => {
  assert.match(biblePageClient, /useDeferredValue/)
  assert.match(biblePageClient, /\/api\/member\/bible-state/)
  assert.match(biblePageClient, /BibleVerseActions/)
  assert.match(bibleVerseActions, /useOptimistic/)
  assert.match(bibleVerseActions, /useTransition/)
  assert.match(bibleVerseActions, /toggleBibleFavoriteAction/)
  assert.match(bibleVerseActions, /upsertBibleNoteAction/)
  assert.match(bibleVerseActions, /deleteBibleNoteAction/)
  assert.match(
    readFileSync("src/components/bible/member-bible-library.tsx", "utf8"),
    /useDeferredValue/,
  )
})

test("Prompt 5 verse sharing dialog supports safe copy and platform links", () => {
  assert.match(verseShareDialog, /navigator\.share/)
  assert.match(verseShareDialog, /navigator\.clipboard\.writeText/)
  assert.match(verseShareDialog, /https:\/\/wa\.me/)
  assert.match(verseShareDialog, /facebook\.com\/sharer/)
  assert.match(verseShareDialog, /twitter\.com\/intent\/tweet/)
  assert.match(verseShareDialog, /mailto:/)
  assert.match(verseShareDialog, /safeRelativeHref/)
  assert.match(verseShareDialog, /Verset copie/)
})

test("Prompt 5 daily verse scheduler is admin guarded and cron integrated", () => {
  assert.match(permissions, /daily_verses\.manage/)
  assert.match(adminNavigation, /\/admin\/versets-du-jour/)
  assert.match(dailyVerseAdmin, /requirePermission\(\s*"daily_verses\.manage"/)
  assert.match(dailyVerseAdmin, /Europe\/Paris/)
  assert.match(dailyVerseAdmin, /activeDailyVerseStatuses/)
  assert.match(dailyVerseAdmin, /adminAuditLog\.create/)
  assert.match(dailyVerseScheduler, /saveDailyVerseScheduleAction/)
  assert.match(dailyVerseScheduler, /cancelDailyVerseScheduleAction/)
  assert.match(notificationService, /processScheduledDailyVerseCampaigns/)
  assert.match(notificationService, /DailyVerseScheduleStatus\.SCHEDULED/)
  assert.match(notificationService, /DailyVerseScheduleStatus\.SENT/)
  assert.match(dailyVerseCronRoute, /processScheduledDailyVerseCampaigns/)
})

test("Prompt 5 daily verse page reuses Bible actions and preserves push status", () => {
  assert.match(dailyVersePage, /BibleVerseActions/)
  assert.match(dailyVersePage, /VerseShareDialog/)
  assert.match(dailyVersePage, /getAdjacentSentDailyVerses/)
  assert.match(dailyVersePage, /pushSubscription\.count/)
  assert.match(dailyVersePage, /Ouvrir dans la Bible/)
})

test("Prompt 5 member notifications use optimistic read, unread and archive", () => {
  assert.match(memberNotificationInbox, /useOptimistic/)
  assert.match(memberNotificationInbox, /useTransition/)
  assert.match(memberNotificationInbox, /markNotificationReadAction/)
  assert.match(memberNotificationInbox, /markNotificationUnreadAction/)
  assert.match(memberNotificationInbox, /markAllNotificationsReadAction/)
  assert.match(memberNotificationInbox, /archiveNotificationAction/)
  assert.match(readFileSync("src/lib/notifications/actions.ts", "utf8"), /readAt: null/)
})

test("Prompt 4 preservation rules remain intact", () => {
  assert.doesNotMatch(JSON.stringify(packageJson.dependencies), /ably|firebase|supabase/)
  assert.doesNotMatch(schema, /churchId|tenantId|clerkOrganization/i)
  assert.doesNotMatch(financeCheckout + financeWebhooks, /stripeAccount|account_links|AccountLink/)
  assert.equal((serviceWorker.match(/addEventListener\("push"/g) ?? []).length, 1)
})
