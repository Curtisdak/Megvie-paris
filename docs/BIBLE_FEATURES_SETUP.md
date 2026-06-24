# Bible favorites, notes and daily verse scheduling

This phase adds member-owned Bible favorites, private Bible notes, a reusable
verse sharing dialog, and a Creator/Master daily verse scheduler.

## Migration

New Prisma migration:

```bash
prisma/migrations/20260624170000_bible_favorites_notes_daily_schedule/migration.sql
```

It creates:

- `bible_favorites`
- `bible_notes`
- `daily_verse_schedules`
- `daily_verse_schedule_status`

Do not reset the database. Apply the migration with the normal deployment
process after reviewing it:

```bash
npx prisma migrate deploy
```

## Permissions

Daily verse management uses the existing RBAC layer:

- `MASTER`
- `CREATOR`

Permission key:

```text
daily_verses.manage
```

The admin route is:

```text
/admin/versets-du-jour
```

## Member Bible features

Routes:

- `/espace-membre/versets-favoris`
- `/espace-membre/notes-bibliques`

Favorites and notes are always scoped from the authenticated Clerk session.
The browser never sends a trusted `userId` or role.

## Daily verse delivery

The existing protected notification scheduler now processes scheduled daily
verses before push delivery:

```text
/api/cron/notifications
```

The older endpoint is also schedule-aware:

```text
/api/cron/daily-verse
```

Both require `CRON_SECRET`.

If no scheduled verse is due, the existing `daily_bible_verses` behavior remains
available. Public page fallback verses remain display-only.

## Manual checklist

1. Run `npx prisma migrate deploy` in the target environment.
2. Confirm Vercel has `CRON_SECRET`.
3. Confirm Vercel cron calls `/api/cron/notifications`.
4. Log in as Creator or Master and open `/admin/versets-du-jour`.
5. Schedule one verse for today in Europe/Paris time.
6. Trigger the cron route and confirm one daily verse campaign is created.
7. Open `/bible`, favorite a verse, add a private note, then check the member pages.
8. Confirm another member cannot see those saved notes.
