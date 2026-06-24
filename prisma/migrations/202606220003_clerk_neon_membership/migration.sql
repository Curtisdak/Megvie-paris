CREATE TYPE "church_role" AS ENUM ('MEMBER', 'RESPO', 'FINANCE', 'MASTER', 'CREATOR');
CREATE TYPE "membership_status" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "notification_delivery_status" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DEACTIVATED');

CREATE SEQUENCE IF NOT EXISTS member_number_seq
  AS integer
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 99999
  NO CYCLE;

CREATE TABLE "app_users" (
  "id" text NOT NULL,
  "clerk_user_id" text NOT NULL,
  "email" text NOT NULL,
  "first_name" text,
  "last_name" text,
  "image_url" text,
  "role" "church_role" NOT NULL DEFAULT 'MEMBER',
  "membership_status" "membership_status" NOT NULL DEFAULT 'PENDING',
  "onboarding_complete" boolean NOT NULL DEFAULT false,
  "archived_at" timestamp(3),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "member_profiles" (
  "id" text NOT NULL,
  "user_id" text NOT NULL,
  "member_number" integer,
  "member_id" text,
  "display_name" text,
  "avatar_url" text,
  "joined_at" timestamp(3),
  "approved_at" timestamp(3),
  "approved_by_id" text,
  "suspended_at" timestamp(3),
  "rejected_at" timestamp(3),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "member_profiles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "member_profiles_member_id_format" CHECK ("member_id" IS NULL OR "member_id" ~ '^Mv[0-9]{5}P$'),
  CONSTRAINT "member_profiles_member_number_range" CHECK ("member_number" IS NULL OR ("member_number" >= 1 AND "member_number" <= 99999))
);

CREATE TABLE "member_private_details" (
  "id" text NOT NULL,
  "user_id" text NOT NULL,
  "phone" text,
  "date_of_birth" date,
  "address_line_1" text,
  "address_line_2" text,
  "postal_code" text,
  "city" text,
  "country_code" text NOT NULL DEFAULT 'FR',
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "member_private_details_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_preferences" (
  "id" text NOT NULL,
  "user_id" text NOT NULL,
  "daily_verse_enabled" boolean NOT NULL DEFAULT true,
  "private_birthday_greeting_enabled" boolean NOT NULL DEFAULT true,
  "community_birthday_visibility_enabled" boolean NOT NULL DEFAULT false,
  "announcements_enabled" boolean NOT NULL DEFAULT true,
  "events_enabled" boolean NOT NULL DEFAULT true,
  "donation_notifications_enabled" boolean NOT NULL DEFAULT false,
  "timezone" text NOT NULL DEFAULT 'Europe/Paris',
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "push_subscriptions" (
  "id" text NOT NULL,
  "user_id" text,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "user_agent" text,
  "locale" text,
  "timezone" text NOT NULL DEFAULT 'Europe/Paris',
  "is_active" boolean NOT NULL DEFAULT true,
  "last_sent_at" timestamp(3),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_bible_verses" (
  "id" text NOT NULL,
  "day_of_year" integer NOT NULL,
  "reference" text NOT NULL,
  "text" text NOT NULL,
  "translation" text NOT NULL,
  "theme" text,
  "source" text,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "daily_bible_verses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "daily_bible_verses_day_range" CHECK ("day_of_year" >= 1 AND "day_of_year" <= 366)
);

CREATE TABLE "notification_logs" (
  "id" text NOT NULL,
  "user_id" text,
  "push_subscription_id" text,
  "notification_type" text NOT NULL,
  "title" text,
  "delivery_status" "notification_delivery_status" NOT NULL DEFAULT 'PENDING',
  "error_message" text,
  "deduplication_key" text,
  "sent_at" timestamp(3),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_audit_logs" (
  "id" text NOT NULL,
  "actor_user_id" text,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text,
  "metadata" jsonb,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "church_settings" (
  "id" text NOT NULL DEFAULT 'default',
  "church_name" text NOT NULL DEFAULT 'MegVie Paris',
  "short_name" text NOT NULL DEFAULT 'MVP',
  "member_id_prefix" text NOT NULL DEFAULT 'Mv',
  "member_id_suffix" text NOT NULL DEFAULT 'P',
  "timezone" text NOT NULL DEFAULT 'Europe/Paris',
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "church_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_users_clerk_user_id_key" ON "app_users"("clerk_user_id");
CREATE INDEX "app_users_email_idx" ON "app_users"("email");
CREATE INDEX "app_users_role_idx" ON "app_users"("role");
CREATE INDEX "app_users_membership_status_idx" ON "app_users"("membership_status");

CREATE UNIQUE INDEX "member_profiles_user_id_key" ON "member_profiles"("user_id");
CREATE UNIQUE INDEX "member_profiles_member_number_key" ON "member_profiles"("member_number");
CREATE UNIQUE INDEX "member_profiles_member_id_key" ON "member_profiles"("member_id");
CREATE INDEX "member_profiles_approved_by_id_idx" ON "member_profiles"("approved_by_id");

CREATE UNIQUE INDEX "member_private_details_user_id_key" ON "member_private_details"("user_id");
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");
CREATE INDEX "push_subscriptions_is_active_idx" ON "push_subscriptions"("is_active");
CREATE UNIQUE INDEX "daily_bible_verses_day_of_year_key" ON "daily_bible_verses"("day_of_year");
CREATE UNIQUE INDEX "notification_logs_deduplication_key_key" ON "notification_logs"("deduplication_key");
CREATE INDEX "notification_logs_user_id_idx" ON "notification_logs"("user_id");
CREATE INDEX "notification_logs_notification_type_idx" ON "notification_logs"("notification_type");
CREATE INDEX "admin_audit_logs_actor_user_id_idx" ON "admin_audit_logs"("actor_user_id");
CREATE INDEX "admin_audit_logs_action_idx" ON "admin_audit_logs"("action");

ALTER TABLE "member_profiles"
  ADD CONSTRAINT "member_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "member_profiles"
  ADD CONSTRAINT "member_profiles_approved_by_id_fkey"
  FOREIGN KEY ("approved_by_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "member_private_details"
  ADD CONSTRAINT "member_private_details_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notification_preferences"
  ADD CONSTRAINT "notification_preferences_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "push_subscriptions"
  ADD CONSTRAINT "push_subscriptions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notification_logs"
  ADD CONSTRAINT "notification_logs_push_subscription_id_fkey"
  FOREIGN KEY ("push_subscription_id") REFERENCES "push_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "admin_audit_logs"
  ADD CONSTRAINT "admin_audit_logs_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "church_settings" ("id", "updated_at")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
