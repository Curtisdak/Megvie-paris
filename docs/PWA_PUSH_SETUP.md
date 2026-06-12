# MegVie Paris PWA and Push Setup

This app is installable as a PWA and can send an opt-in daily French Bible
verse notification.

## Required Environment Variables

Create `.env.local` locally and configure the same variables in production:

```bash
STRIPE_SECRET_KEY=sk_live_or_sk_test
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxx

NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
WEB_PUSH_CONTACT_EMAIL=mailto:contact@megvie-paris.fr

CRON_SECRET=replace_with_a_long_random_secret
TEST_PUSH_SECRET=replace_with_a_different_long_random_secret
DAILY_VERSE_NOTIFICATION_TIME=08:00
DAILY_VERSE_SCHEDULER=vercel
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `VAPID_PRIVATE_KEY` in client
components. Never commit `.env.local`.

Use the Supabase project root URL for `NEXT_PUBLIC_SUPABASE_URL`, for example
`https://your-project.supabase.co`, not the REST endpoint ending in
`/rest/v1/`.

## Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Set the public key as `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and the private key as
`VAPID_PRIVATE_KEY`.

## Apply Supabase SQL

Run [docs/supabase-pwa.sql](./supabase-pwa.sql) in the Supabase SQL editor.

The file creates:

- `push_subscriptions`
- `daily_bible_verses`
- `notification_logs`

RLS is enabled. No public RLS policies are added for `push_subscriptions`;
the app writes through protected Next.js API routes using the server-only
service-role key.

The SQL includes seven starter verses for testing. Replace them with the full
church-approved 365/366 day verse list before production use.

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
2. Click the "Installer" button in the MegVie Paris header.
3. If the native install prompt appears, choose Install.
4. If no prompt appears, use the browser address-bar install icon or open the
   browser menu and choose Install MegVie Paris / Install app.
5. Launch MegVie Paris from the desktop, dock, start menu, or applications list.

On Safari for Mac, use Share and then Add to Dock if the browser offers that
option.

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

### Supabase Cron

Use Supabase scheduled jobs to call:

```text
https://your-domain.com/api/cron/daily-verse
```

Include:

```text
Authorization: Bearer YOUR_CRON_SECRET
```

## Manual Setup Still Needed

- Provide the real Supabase project URL.
- Provide the Supabase publishable key if you later add public Supabase reads.
- Provide the Supabase service-role key for server API routes.
- Provide the production site URL.
- Provide the web push contact email.
- Choose Vercel Cron or Supabase Cron.
- Replace placeholder icons with approved MegVie Paris logo assets if desired.
- Replace the starter verses with the full approved Bible verse list.
