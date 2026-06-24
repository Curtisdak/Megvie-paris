# MegVie Paris Admin Portal Setup

Prompt 2 adds a role-protected administration portal and church content CMS on
top of the existing Clerk + Neon + Prisma member system.

## What Was Reused

- Clerk authentication and middleware.
- Neon PostgreSQL through Prisma.
- Existing `AppUser`, `MemberProfile`, `MemberPrivateDetails`,
  `NotificationPreference`, `AdminAuditLog`, `ChurchRole` and
  `MembershipStatus` models.
- Existing member approval/member-ID format: `Mv` + five digits + `P`.
- Existing Web Push, daily verse, PWA and Stripe donation code.

## Migration

Created migration:

```bash
prisma/migrations/202606220005_admin_portal_content_management/migration.sql
```

Apply in development only:

```bash
npx prisma migrate dev
```

For deployment after review:

```bash
npx prisma migrate deploy
```

Do not run `prisma migrate reset`, `prisma db push --force-reset`, `DROP`,
`TRUNCATE`, or delete existing migrations.

## New Prisma Models

- `ChurchEvent`
- `GalleryAlbum`
- `GalleryItem`
- `ContactMessage`
- `MessageReply`
- `MessageInternalNote`
- `Announcement`
- `AnnouncementRead`

`AdminAuditLog` was extended with `actorMemberId` and `summary`.

## Admin Routes

- `/admin`
- `/admin/membres`
- `/admin/demandes-adhesion`
- `/admin/evenements`
- `/admin/evenements/nouveau`
- `/admin/evenements/[id]`
- `/admin/galerie`
- `/admin/messages`
- `/admin/messages/[id]`
- `/admin/annonces`
- `/admin/audit`
- `/espace-membre/annonces`
- `/espace-membre/annonces/[id]`

The `/admin` tree is protected by Clerk middleware and server-side role checks.
Admin access is granted from the trusted database role; normal `MEMBER` users
are redirected to `/espace-membre`.

## Permission Matrix

- `MEMBER`: no admin access.
- `RESPO`: members basic/contact, events, gallery, general messages,
  announcements.
- `FINANCE`: recognized but Prompt 2 exposes no operational modules or donation
  data.
- `MASTER`: member decisions, operational content, confidential messages.
- `CREATOR`: all Prompt 2 modules, role management, audit.

Role checks run in server components and server actions. UI visibility is not
treated as authorization.

## Storage Provider

Image uploads use ImageKit. The private key is used only in server actions; it
must never be exposed through a `NEXT_PUBLIC_` variable. Neon stores only the
returned ImageKit URL and file path/storage key.

Required env names:

```bash
IMAGE_STORAGE_PROVIDER=imagekit
IMAGE_STORAGE_MAX_BYTES=5242880
IMAGEKIT_PUBLIC_KEY=public_xxxxx
IMAGEKIT_PRIVATE_KEY=private_xxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
IMAGEKIT_UPLOAD_FOLDER=/megvie-paris
```

Supported uploads in the admin portal:

- Event cover image.
- Gallery album cover image.
- Gallery item image.
- Announcement cover image.

Supported MIME types are JPG, PNG and WebP. The default limit is 5 MB.

Verify the configured ImageKit account with:

```bash
npm run smoke:imagekit
```

The smoke command uploads a tiny PNG to the configured `smoke-tests` folder,
then deletes it immediately by ImageKit file ID. It does not print API keys.

Official ImageKit references:

- Upload API: https://imagekit.io/docs/api-reference/upload-file/upload-file
- Delete API: https://imagekit.io/docs/api-reference/digital-asset-management-dam/managing-assets/delete-file

## Email Provider

No email provider was detected. Contact messages are stored in Neon, and admin
responses are saved as drafts/internal records only. The UI does not claim that
email was sent.

Placeholder env names:

```bash
EMAIL_PROVIDER=none
RESEND_API_KEY=
BREVO_API_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
```

## Contact Messages

The public contact form now creates `ContactMessage` rows with a honeypot field
and server-side validation. Confidential pastoral messages are hidden from
`RESPO` and available to `MASTER` and `CREATOR`.

## Published Content

Published public events, public announcements and published gallery albums are
shown on the home page. Published announcements are also shown in the member
dashboard and on `/espace-membre/annonces`.

Events are public-only church content. The admin event forms do not expose an
audience selector, and the database migration adds a guard so event visibility
stays `PUBLIC`. Use announcements when content needs a member-only audience.

Opening `/espace-membre/annonces/[id]` creates or updates an `AnnouncementRead`
record for the authenticated member. This is only read tracking; Prompt 3 will
connect announcements to Web Push.

## Testing Roles

1. Register and approve a normal user.
2. Bootstrap or keep the Creator account.
3. Use `/admin/membres` as Creator to assign `RESPO`, `FINANCE`, or `MASTER`.
4. Reopen protected pages after role changes so the database role is read again.

## Postponed

Prompt 3 is not implemented here:

- Event push notifications.
- Announcement push notifications.
- Birthday push notifications.

Prompt 4 is not implemented here:

- Donation history sync.
- Stripe webhooks.
- Finance dashboards, exports and statistics.
