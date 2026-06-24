# Clerk, Neon and Prisma Membership Setup

Phase 1 now uses Clerk for authentication and Prisma with Neon/Postgres for
membership data. Supabase Auth, RLS and Supabase Storage have been removed from
the active app.

## Environment Variables

Required server variables:

- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SIGNING_SECRET`
- `DATABASE_URL`
- `DIRECT_URL`
- `CREATOR_EMAIL`
- `CREATOR_USERNAME`, optional
- `CREATOR_PHONE_NUMBER`, only if your Clerk instance requires phone numbers
- `CREATOR_PASSWORD` for optional one-time Clerk user creation

Required public variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_URL`

`DIRECT_URL` and `DATABASE_URL` must both be Postgres connection strings. Do not
set `DIRECT_URL` to `https://megvieparis.com/`.

## Database

Migration:

```text
prisma/migrations/202606220003_clerk_neon_membership/migration.sql
```

Apply manually after review:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Do not apply migrations automatically during build.

## Authentication Routes

- `/inscription` uses Clerk SignUp.
- `/connexion` uses Clerk SignIn.
- `/bienvenue` collects MegVie-specific membership fields after Clerk signup.
- `/espace-membre` is protected by Clerk middleware.
- `/admin` is protected by Clerk login plus trusted database role checks.

## Webhook

Configure Clerk webhook URL:

```text
https://megvieparis.com/api/clerk/webhook
```

Events:

- `user.created`
- `user.updated`
- `user.deleted`

The webhook syncs basic Clerk identity into `app_users`. It never trusts Clerk
metadata for role or membership status.

## Member IDs

Member IDs are generated only during approval or creator bootstrap:

- Format: `Mv00001P`
- Sequence: `member_number_seq`
- Max: `Mv99999P`
- Existing IDs are never replaced or reused.

## Roles

Roles live in `app_users.role`:

- `MEMBER`
- `RESPO`
- `FINANCE`
- `MASTER`
- `CREATOR`

Permission mapping lives in `src/lib/auth/permissions.ts`. Privileged server
actions re-check the database role before mutating data.

## Creator Bootstrap

Run after migration and Clerk setup:

```bash
npm run bootstrap:creator
```

The script finds the Clerk user by `CREATOR_EMAIL`. If no Clerk user exists and
`CREATOR_PASSWORD` is present, it creates one. If Clerk requires username or
phone number during user creation, set `CREATOR_USERNAME` and
`CREATOR_PHONE_NUMBER`. If Clerk rejects your phone country code, make phone
optional/disabled in Clerk Dashboard or use a supported country number. The
script then sets the local membership active, assigns `CREATOR`, generates the
first member ID if absent, and writes an audit log.

## Account Security

Clerk manages password, sessions and optional account security settings under
`/espace-membre/securite`. Admin routes require an authenticated Clerk session
and an administrative role in Neon.

## Push Notifications

Push subscriptions are stored in `push_subscriptions`. Signed-in users are linked
to `app_users`; anonymous PWA subscriptions are still accepted. Daily verse cron
sends only to active subscriptions and respects linked user notification
preferences.

## Rollback Notes

Rollback requires reverting the Clerk/Prisma commit and restoring the previous
Supabase migrations, helpers and packages. Because no Supabase data was
preserved for this migration, there is no automated data backfill path.
