# MegVie Paris PWA and Push Setup

This app is installable as a PWA and can send an opt-in daily French Bible
verse notification. Persistence now uses Prisma with Neon/Postgres.

## Required Environment Variables

Create `.env.local` locally and configure the same variables in production:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com

DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_or_test
CLERK_SECRET_KEY=sk_live_or_test
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxxxx

NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
WEB_PUSH_CONTACT_EMAIL=mailto:contact@megvie-paris.fr

CRON_SECRET=replace_with_a_long_random_secret
TEST_PUSH_SECRET=replace_with_a_different_long_random_secret
DAILY_VERSE_NOTIFICATION_TIME=08:00
DAILY_VERSE_SCHEDULER=vercel
```

Never expose `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`,
`DATABASE_URL`, `DIRECT_URL`, `VAPID_PRIVATE_KEY`, `CRON_SECRET` or
`TEST_PUSH_SECRET` in client components. Never commit real `.env` values.

`DIRECT_URL` must be a Neon/Postgres database connection string for Prisma
migrations. It is not the production website URL.

## Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Set the public key as `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and the private key as
`VAPID_PRIVATE_KEY`.

## Apply Database Migration

Review and apply the Prisma migration manually:

```bash
npx prisma migrate deploy
npx prisma db seed
```

The migration creates:

- `app_users`
- `member_profiles`
- `member_private_details`
- `notification_preferences`
- `push_subscriptions`
- `daily_bible_verses`
- `notification_logs`
- `admin_audit_logs`
- `church_settings`
- `member_number_seq`

The starter seed inserts a few daily verses for testing. Replace them with the
full church-approved 365/366 day verse list before production use.

## Clerk Webhook

Create a Clerk webhook endpoint:

```text
https://your-domain.com/api/clerk/webhook
```

Subscribe at least to:

- `user.created`
- `user.updated`
- `user.deleted`

Copy the webhook signing secret to `CLERK_WEBHOOK_SIGNING_SECRET`.

## Creator Bootstrap

After migrations, run once:

```bash
npm run bootstrap:creator
```

The script uses `CREATOR_EMAIL` and, only if the Clerk account does not already
exist, `CREATOR_PASSWORD`. It assigns role `CREATOR`, activates the membership,
and generates the first available member ID such as `Mv00001P`.

## Test Locally With HTTPS

Push notifications require HTTPS, except for `localhost` in many browsers.
For a phone on your network, use an HTTPS tunnel such as:

```bash
npm run dev
ngrok http 3000
```

Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL` to the HTTPS tunnel URL
while testing on a real device.

## Test on Android

1. Open the HTTPS site in Chrome.
2. Use the install card or Chrome menu to install the app.
3. Tap "Recevoir le verset du jour".
4. Allow notifications.
5. Trigger a test push:

```bash
curl -X POST "https://your-domain.com/api/push/test" \
  -H "Authorization: Bearer YOUR_TEST_PUSH_SECRET" \
  -H "Content-Type: application/json" \
  -d "{}"
```

## Test on iPhone

1. Open the site in Safari.
2. Use the floating "Installer l'app" button if the guide is not already open.
3. Tap Share in Safari.
4. Tap Add to Home Screen.
5. Confirm with Add.
6. Open the installed app from the Home Screen.
7. Tap "Recevoir le verset du jour".
8. Allow notifications.

iOS web push works only after the site is installed to the Home Screen and
opened from the installed app.

## Test on Laptop/Desktop

1. Open the HTTPS site in Chrome or Edge.
2. Click the "Installer" button.
3. If the native install prompt appears, choose Install.
4. If no prompt appears, use the browser address-bar install icon or browser
   menu install option.
5. Launch MegVie Paris from the desktop, dock, start menu, or applications list.

## Configure Daily Scheduling

### Vercel Cron

Create a Vercel Cron job for:

```text
GET /api/cron/daily-verse
```

Use the `CRON_SECRET` value as a bearer token:

```text
Authorization: Bearer YOUR_CRON_SECRET
```

For 08:00 Europe/Paris, remember that Vercel Cron uses UTC. Adjust the UTC
schedule for daylight saving time, or call the route more than once and add
server-side send-window logic later.

## Manual Setup Still Needed

- Configure real Clerk keys and webhook secret.
- Configure real Neon/Postgres `DATABASE_URL` and `DIRECT_URL`.
- Provide the production site URL.
- Provide the web push contact email.
- Choose and configure the production cron scheduler.
- Replace starter verses with the full approved Bible verse list.
