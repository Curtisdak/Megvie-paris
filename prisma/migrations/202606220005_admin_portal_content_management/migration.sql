CREATE TYPE "content_visibility" AS ENUM ('PUBLIC', 'MEMBERS_ONLY');
CREATE TYPE "event_status" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'CANCELLED', 'ARCHIVED');
CREATE TYPE "gallery_album_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "contact_message_source" AS ENUM ('PUBLIC_CONTACT', 'MEMBER_PORTAL');
CREATE TYPE "message_confidentiality" AS ENUM ('GENERAL', 'PASTORAL_CONFIDENTIAL');
CREATE TYPE "contact_message_status" AS ENUM ('NEW', 'IN_PROGRESS', 'ANSWERED', 'ARCHIVED');
CREATE TYPE "message_delivery_status" AS ENUM ('INTERNAL_NOTE', 'DRAFT', 'SENT', 'FAILED');
CREATE TYPE "announcement_category" AS ENUM ('GENERAL', 'EMPLOI', 'MARIAGE', 'BAPTEME', 'EVENEMENT', 'BON_PLAN', 'URGENT');
CREATE TYPE "announcement_status" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

ALTER TABLE "admin_audit_logs"
  ADD COLUMN "actor_member_id" text,
  ADD COLUMN "summary" text;

CREATE TABLE "church_events" (
  "id" text NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL,
  "short_description" text,
  "description" text,
  "starts_at" timestamp(3) NOT NULL,
  "ends_at" timestamp(3),
  "timezone" text NOT NULL DEFAULT 'Europe/Paris',
  "location_name" text,
  "address" text,
  "map_url" text,
  "registration_url" text,
  "cover_image_url" text,
  "cover_image_storage_key" text,
  "visibility" "content_visibility" NOT NULL DEFAULT 'PUBLIC',
  "status" "event_status" NOT NULL DEFAULT 'DRAFT',
  "publish_at" timestamp(3),
  "published_at" timestamp(3),
  "created_by_user_id" text NOT NULL,
  "updated_by_user_id" text,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "archived_at" timestamp(3),
  CONSTRAINT "church_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gallery_albums" (
  "id" text NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "cover_image_url" text,
  "cover_image_storage_key" text,
  "status" "gallery_album_status" NOT NULL DEFAULT 'DRAFT',
  "event_date" date,
  "created_by_user_id" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "archived_at" timestamp(3),
  CONSTRAINT "gallery_albums_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gallery_items" (
  "id" text NOT NULL,
  "album_id" text NOT NULL,
  "image_url" text NOT NULL,
  "storage_key" text,
  "caption" text,
  "alt_text" text,
  "sort_order" integer NOT NULL DEFAULT 0,
  "uploaded_by_user_id" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "archived_at" timestamp(3),
  CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contact_messages" (
  "id" text NOT NULL,
  "sender_user_id" text,
  "sender_name" text NOT NULL,
  "sender_email" text NOT NULL,
  "sender_phone" text,
  "subject" text NOT NULL,
  "category" text NOT NULL DEFAULT 'GENERAL',
  "body" text NOT NULL,
  "source" "contact_message_source" NOT NULL DEFAULT 'PUBLIC_CONTACT',
  "confidentiality" "message_confidentiality" NOT NULL DEFAULT 'GENERAL',
  "status" "contact_message_status" NOT NULL DEFAULT 'NEW',
  "assigned_to_user_id" text,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "first_read_at" timestamp(3),
  "answered_at" timestamp(3),
  "archived_at" timestamp(3),
  CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "message_replies" (
  "id" text NOT NULL,
  "message_id" text NOT NULL,
  "author_user_id" text NOT NULL,
  "body" text NOT NULL,
  "delivery_status" "message_delivery_status" NOT NULL DEFAULT 'DRAFT',
  "external_message_id" text,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sent_at" timestamp(3),
  "failed_at" timestamp(3),
  "failure_reason" text,
  CONSTRAINT "message_replies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "message_internal_notes" (
  "id" text NOT NULL,
  "message_id" text NOT NULL,
  "author_user_id" text NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "message_internal_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "announcements" (
  "id" text NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL,
  "summary" text,
  "body" text NOT NULL,
  "category" "announcement_category" NOT NULL DEFAULT 'GENERAL',
  "cover_image_url" text,
  "cover_image_storage_key" text,
  "external_url" text,
  "visibility" "content_visibility" NOT NULL DEFAULT 'MEMBERS_ONLY',
  "status" "announcement_status" NOT NULL DEFAULT 'DRAFT',
  "publish_at" timestamp(3),
  "published_at" timestamp(3),
  "expires_at" timestamp(3),
  "author_user_id" text NOT NULL,
  "updated_by_user_id" text,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "archived_at" timestamp(3),
  CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "announcement_reads" (
  "id" text NOT NULL,
  "announcement_id" text NOT NULL,
  "user_id" text NOT NULL,
  "read_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "church_events_slug_key" ON "church_events"("slug");
CREATE INDEX "church_events_status_idx" ON "church_events"("status");
CREATE INDEX "church_events_visibility_idx" ON "church_events"("visibility");
CREATE INDEX "church_events_starts_at_idx" ON "church_events"("starts_at");
CREATE INDEX "church_events_created_by_user_id_idx" ON "church_events"("created_by_user_id");

CREATE UNIQUE INDEX "gallery_albums_slug_key" ON "gallery_albums"("slug");
CREATE INDEX "gallery_albums_status_idx" ON "gallery_albums"("status");
CREATE INDEX "gallery_albums_event_date_idx" ON "gallery_albums"("event_date");
CREATE INDEX "gallery_albums_created_by_user_id_idx" ON "gallery_albums"("created_by_user_id");
CREATE INDEX "gallery_items_album_id_idx" ON "gallery_items"("album_id");
CREATE INDEX "gallery_items_uploaded_by_user_id_idx" ON "gallery_items"("uploaded_by_user_id");

CREATE INDEX "contact_messages_sender_user_id_idx" ON "contact_messages"("sender_user_id");
CREATE INDEX "contact_messages_assigned_to_user_id_idx" ON "contact_messages"("assigned_to_user_id");
CREATE INDEX "contact_messages_status_idx" ON "contact_messages"("status");
CREATE INDEX "contact_messages_confidentiality_idx" ON "contact_messages"("confidentiality");
CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages"("created_at");
CREATE INDEX "message_replies_message_id_idx" ON "message_replies"("message_id");
CREATE INDEX "message_replies_author_user_id_idx" ON "message_replies"("author_user_id");
CREATE INDEX "message_internal_notes_message_id_idx" ON "message_internal_notes"("message_id");
CREATE INDEX "message_internal_notes_author_user_id_idx" ON "message_internal_notes"("author_user_id");

CREATE UNIQUE INDEX "announcements_slug_key" ON "announcements"("slug");
CREATE INDEX "announcements_status_idx" ON "announcements"("status");
CREATE INDEX "announcements_visibility_idx" ON "announcements"("visibility");
CREATE INDEX "announcements_category_idx" ON "announcements"("category");
CREATE INDEX "announcements_publish_at_idx" ON "announcements"("publish_at");
CREATE INDEX "announcements_author_user_id_idx" ON "announcements"("author_user_id");
CREATE UNIQUE INDEX "announcement_reads_announcement_id_user_id_key" ON "announcement_reads"("announcement_id", "user_id");
CREATE INDEX "announcement_reads_user_id_idx" ON "announcement_reads"("user_id");
CREATE INDEX "admin_audit_logs_entity_type_idx" ON "admin_audit_logs"("entity_type");
CREATE INDEX "admin_audit_logs_created_at_idx" ON "admin_audit_logs"("created_at");

ALTER TABLE "church_events"
  ADD CONSTRAINT "church_events_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "church_events"
  ADD CONSTRAINT "church_events_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "gallery_albums"
  ADD CONSTRAINT "gallery_albums_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "gallery_items"
  ADD CONSTRAINT "gallery_items_album_id_fkey"
  FOREIGN KEY ("album_id") REFERENCES "gallery_albums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "gallery_items"
  ADD CONSTRAINT "gallery_items_uploaded_by_user_id_fkey"
  FOREIGN KEY ("uploaded_by_user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "contact_messages"
  ADD CONSTRAINT "contact_messages_sender_user_id_fkey"
  FOREIGN KEY ("sender_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "contact_messages"
  ADD CONSTRAINT "contact_messages_assigned_to_user_id_fkey"
  FOREIGN KEY ("assigned_to_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "message_replies"
  ADD CONSTRAINT "message_replies_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "contact_messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "message_replies"
  ADD CONSTRAINT "message_replies_author_user_id_fkey"
  FOREIGN KEY ("author_user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "message_internal_notes"
  ADD CONSTRAINT "message_internal_notes_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "contact_messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "message_internal_notes"
  ADD CONSTRAINT "message_internal_notes_author_user_id_fkey"
  FOREIGN KEY ("author_user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "announcements"
  ADD CONSTRAINT "announcements_author_user_id_fkey"
  FOREIGN KEY ("author_user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "announcements"
  ADD CONSTRAINT "announcements_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "announcement_reads"
  ADD CONSTRAINT "announcement_reads_announcement_id_fkey"
  FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "announcement_reads"
  ADD CONSTRAINT "announcement_reads_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
