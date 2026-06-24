CREATE TYPE "daily_verse_schedule_status" AS ENUM (
  'DRAFT',
  'SCHEDULED',
  'SENT',
  'CANCELLED',
  'FAILED'
);

CREATE TABLE "bible_favorites" (
  "id" text NOT NULL,
  "user_id" text NOT NULL,
  "book" text NOT NULL,
  "chapter" integer NOT NULL,
  "verse_start" integer NOT NULL,
  "verse_end" integer NOT NULL,
  "reference" text NOT NULL,
  "verse_text_snapshot" text NOT NULL,
  "translation" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bible_favorites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bible_notes" (
  "id" text NOT NULL,
  "user_id" text NOT NULL,
  "book" text NOT NULL,
  "chapter" integer NOT NULL,
  "verse_start" integer NOT NULL,
  "verse_end" integer NOT NULL,
  "reference" text NOT NULL,
  "translation" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "bible_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_verse_schedules" (
  "id" text NOT NULL,
  "local_date" text NOT NULL,
  "notification_time" text NOT NULL,
  "scheduled_for" timestamp(3),
  "status" "daily_verse_schedule_status" NOT NULL DEFAULT 'DRAFT',
  "book" text NOT NULL,
  "chapter" integer NOT NULL,
  "verse_start" integer NOT NULL,
  "verse_end" integer NOT NULL,
  "reference" text NOT NULL,
  "verse_text" text NOT NULL,
  "translation" text NOT NULL,
  "theme" text,
  "dedupe_key" text NOT NULL,
  "failure_code" text,
  "sent_at" timestamp(3),
  "cancelled_at" timestamp(3),
  "created_by_user_id" text NOT NULL,
  "updated_by_user_id" text,
  "cancelled_by_user_id" text,
  "sent_by_user_id" text,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "daily_verse_schedules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bible_favorites_user_verse_translation_key"
  ON "bible_favorites"("user_id", "book", "chapter", "verse_start", "verse_end", "translation");
CREATE INDEX "bible_favorites_user_id_created_at_idx"
  ON "bible_favorites"("user_id", "created_at");
CREATE INDEX "bible_favorites_book_chapter_verse_start_idx"
  ON "bible_favorites"("book", "chapter", "verse_start");

CREATE UNIQUE INDEX "bible_notes_user_verse_translation_key"
  ON "bible_notes"("user_id", "book", "chapter", "verse_start", "verse_end", "translation");
CREATE INDEX "bible_notes_user_id_updated_at_idx"
  ON "bible_notes"("user_id", "updated_at");
CREATE INDEX "bible_notes_book_chapter_verse_start_idx"
  ON "bible_notes"("book", "chapter", "verse_start");

CREATE UNIQUE INDEX "daily_verse_schedules_dedupe_key_key"
  ON "daily_verse_schedules"("dedupe_key");
CREATE UNIQUE INDEX "daily_verse_schedules_active_local_date_key"
  ON "daily_verse_schedules"("local_date")
  WHERE "status" IN ('DRAFT'::"daily_verse_schedule_status", 'SCHEDULED'::"daily_verse_schedule_status");
CREATE INDEX "daily_verse_schedules_status_scheduled_for_idx"
  ON "daily_verse_schedules"("status", "scheduled_for");
CREATE INDEX "daily_verse_schedules_local_date_idx"
  ON "daily_verse_schedules"("local_date");
CREATE INDEX "daily_verse_schedules_created_by_user_id_idx"
  ON "daily_verse_schedules"("created_by_user_id");
CREATE INDEX "daily_verse_schedules_updated_by_user_id_idx"
  ON "daily_verse_schedules"("updated_by_user_id");
CREATE INDEX "daily_verse_schedules_cancelled_by_user_id_idx"
  ON "daily_verse_schedules"("cancelled_by_user_id");
CREATE INDEX "daily_verse_schedules_sent_by_user_id_idx"
  ON "daily_verse_schedules"("sent_by_user_id");

ALTER TABLE "bible_favorites"
  ADD CONSTRAINT "bible_favorites_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bible_notes"
  ADD CONSTRAINT "bible_notes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "daily_verse_schedules"
  ADD CONSTRAINT "daily_verse_schedules_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "daily_verse_schedules"
  ADD CONSTRAINT "daily_verse_schedules_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "daily_verse_schedules"
  ADD CONSTRAINT "daily_verse_schedules_cancelled_by_user_id_fkey"
  FOREIGN KEY ("cancelled_by_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "daily_verse_schedules"
  ADD CONSTRAINT "daily_verse_schedules_sent_by_user_id_fkey"
  FOREIGN KEY ("sent_by_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bible_favorites"
  ADD CONSTRAINT "bible_favorites_reference_chk"
  CHECK ("chapter" > 0 AND "verse_start" > 0 AND "verse_end" >= "verse_start" AND length(trim("reference")) > 0);

ALTER TABLE "bible_notes"
  ADD CONSTRAINT "bible_notes_reference_content_chk"
  CHECK (
    "chapter" > 0
    AND "verse_start" > 0
    AND "verse_end" >= "verse_start"
    AND length(trim("reference")) > 0
    AND length(trim("content")) BETWEEN 1 AND 2000
  );

ALTER TABLE "daily_verse_schedules"
  ADD CONSTRAINT "daily_verse_schedules_reference_chk"
  CHECK (
    "chapter" > 0
    AND "verse_start" > 0
    AND "verse_end" >= "verse_start"
    AND length(trim("reference")) > 0
    AND length(trim("verse_text")) > 0
    AND "local_date" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    AND "notification_time" ~ '^[0-2][0-9]:[0-5][0-9]$'
  );
