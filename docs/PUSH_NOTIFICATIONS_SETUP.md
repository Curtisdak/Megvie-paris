# MegVie Paris Push Notifications

Prompt 3 extends the existing single-service-worker Web Push system. It keeps
`public/sw.js`, `src/components/pwa/pwa-provider.tsx`, VAPID, Clerk, Neon and
Prisma. No Supabase, Ably, Firebase or second service worker is used.

## Environment Variables

Configure locally and in Vercel:

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
WEB_PUSH_CONTACT_EMAIL=mailto:contact@example.com
CRON_SECRET=replace_with_a_long_random_secret
TEST_PUSH_SECRET=replace_with_a_different_long_random_secret
NEXT_PUBLIC_SITE_URL=https://megvieparis.com
CHURCH_TIMEZONE=Europe/Paris
DAILY_VERSE_NOTIFICATION_TIME=08:00
BIRTHDAY_NOTIFICATION_TIME=09:00
PUSH_BATCH_SIZE=100
```

Never expose `VAPID_PRIVATE_KEY`, `CRON_SECRET` or `TEST_PUSH_SECRET` to client
code.

## Database Models

The Prisma migration `202606230001_push_notification_orchestration` adds:

- `NotificationCampaign`
- `NotificationRecipient`
- `PushDeliveryAttempt`

It extends:

- `PushSubscription`
- `NotificationPreference`
- `AppUser` relations

The database stores campaigns, inbox records, delivery attempts, read state and
dedupe keys. Web Push is treated only as a delivery channel.

## Routes

- `POST /api/push/subscribe`
- `POST /api/push/unsubscribe`
- `POST /api/push/detach`
- `POST /api/push/test`
- `GET|POST /api/cron/daily-verse`
- `GET|POST /api/cron/notifications`
- `GET /api/member/notifications/unread`

Cron routes require `CRON_SECRET`.

## Scheduler

Keep the existing daily verse cron:

```text
GET /api/cron/daily-verse
```

Add a second Vercel Cron entry:

```text
GET /api/cron/notifications
```

Use `Authorization: Bearer YOUR_CRON_SECRET`. The notification cron publishes
due scheduled content, materializes due campaigns, creates birthday campaigns
and processes a bounded push batch. Jobs are idempotent and safe to call more
than once.

## Delivery Status Meaning

- `PENDING`: queued but not attempted
- `PROCESSING`: currently claimed by the scheduler
- `ACCEPTED`: accepted by the browser push service, not proof the user saw it
- `RETRY`: transient failure scheduled for another attempt
- `FAILED`: permanent or retry-exhausted failure
- `EXPIRED`: browser subscription returned 404/410 and was deactivated
- `SKIPPED`: cancelled before delivery

Read state is stored separately on `NotificationRecipient.readAt`.

## Member Testing

1. Open `/espace-membre/notifications`.
2. Click `Activer les notifications`.
3. Allow the browser prompt.
4. Confirm the device appears as active.
5. Use the inbox to mark notifications read or archive them.

On iPhone, install the PWA to the Home Screen and open the installed app before
activating notifications.

## Admin Testing

Admins with `RESPO`, `MASTER` or `CREATOR` can open `/admin/notifications`.

Use `Test sur mon appareil` after activating notifications on the same account.
The test targets only the current admin user and creates an audit entry.

## Notification Triggers

- Daily verse cron creates member and anonymous daily-verse campaigns.
- Published announcements can notify members when the admin selects the option.
- Scheduled announcements can queue a due notification.
- Published events can notify members when selected.
- Event reminders can be scheduled once per selected reminder time.
- Cancelled events cancel pending reminders and can notify members.
- Birthdays create private notifications for the matching active member only.
- General messages alert `RESPO`, `MASTER` and `CREATOR`.
- Confidential pastoral messages alert only `MASTER` and `CREATOR`.

Push payloads stay generic. They must not include birth dates, message bodies,
sender email, phone numbers, donation amounts or subscription keys.

## Manual Smoke Checklist

- Subscribe anonymously to daily verse and run `/api/cron/daily-verse`.
- Subscribe as a member and verify inbox records are created.
- Publish an announcement with notification selected.
- Create an event with a reminder.
- Create a public contact message and verify staff campaign creation.
- Send admin test push from `/admin/notifications`.
- Verify expired browser subscriptions become inactive after 404/410.

## Postponed

Prompt 4 Stripe finance notifications, donation history, monthly payments and
finance statistics are intentionally not implemented here.
