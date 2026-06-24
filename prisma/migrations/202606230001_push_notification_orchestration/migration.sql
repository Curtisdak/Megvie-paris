CREATE TYPE "notification_type" AS ENUM (
  'DAILY_VERSE',
  'BIRTHDAY',
  'ANNOUNCEMENT',
  'EVENT_PUBLISHED',
  'EVENT_REMINDER',
  'EVENT_CANCELLED',
  'PERSONAL',
  'STAFF_NEW_MESSAGE',
  'STAFF_CONFIDENTIAL_MESSAGE',
  'SYSTEM',
  'TEST'
);

CREATE TYPE "notification_audience_type" AS ENUM (
  'ALL_ACTIVE_MEMBERS',
  'ROLE',
  'INDIVIDUAL',
  'ANONYMOUS_DAILY_VERSE',
  'STAFF_GENERAL',
  'STAFF_CONFIDENTIAL'
);

CREATE TYPE "notification_campaign_status" AS ENUM (
  'DRAFT',
  'SCHEDULED',
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'PARTIAL',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "push_delivery_status" AS ENUM (
  'PENDING',
  'PROCESSING',
  'ACCEPTED',
  'RETRY',
  'FAILED',
  'EXPIRED',
  'SKIPPED'
);

ALTER TABLE "notification_preferences"
  ADD COLUMN "push_enabled" boolean NOT NULL DEFAULT true,
  ADD COLUMN "daily_verse_push_enabled" boolean NOT NULL DEFAULT true,
  ADD COLUMN "birthday_push_enabled" boolean NOT NULL DEFAULT true,
  ADD COLUMN "announcement_push_enabled" boolean NOT NULL DEFAULT true,
  ADD COLUMN "event_push_enabled" boolean NOT NULL DEFAULT true,
  ADD COLUMN "personal_push_enabled" boolean NOT NULL DEFAULT true,
  ADD COLUMN "staff_message_push_enabled" boolean NOT NULL DEFAULT true;

ALTER TABLE "push_subscriptions"
  ADD COLUMN "device_name" text,
  ADD COLUMN "anonymous_daily_verse_enabled" boolean NOT NULL DEFAULT true,
  ADD COLUMN "last_seen_at" timestamp(3),
  ADD COLUMN "last_success_at" timestamp(3),
  ADD COLUMN "failure_count" integer NOT NULL DEFAULT 0,
  ADD COLUMN "revoked_at" timestamp(3);

CREATE TABLE "notification_campaigns" (
  "id" text NOT NULL,
  "type" "notification_type" NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "target_url" text NOT NULL,
  "icon_url" text,
  "image_url" text,
  "tag" text,
  "audience_type" "notification_audience_type" NOT NULL,
  "target_role" "church_role",
  "target_user_id" text,
  "source_type" text,
  "source_id" text,
  "status" "notification_campaign_status" NOT NULL DEFAULT 'PENDING',
  "scheduled_for" timestamp(3),
  "processing_started_at" timestamp(3),
  "completed_at" timestamp(3),
  "cancelled_at" timestamp(3),
  "created_by_user_id" text,
  "dedupe_key" text NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "notification_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_recipients" (
  "id" text NOT NULL,
  "campaign_id" text NOT NULL,
  "user_id" text NOT NULL,
  "read_at" timestamp(3),
  "archived_at" timestamp(3),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "push_delivery_attempts" (
  "id" text NOT NULL,
  "recipient_id" text,
  "campaign_id" text NOT NULL,
  "push_subscription_id" text NOT NULL,
  "status" "push_delivery_status" NOT NULL DEFAULT 'PENDING',
  "attempt_number" integer NOT NULL DEFAULT 1,
  "next_attempt_at" timestamp(3),
  "accepted_at" timestamp(3),
  "failed_at" timestamp(3),
  "response_status_code" integer,
  "safe_error_code" text,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "push_delivery_attempts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_campaigns_dedupe_key_key" ON "notification_campaigns"("dedupe_key");
CREATE INDEX "notification_campaigns_status_scheduled_for_idx" ON "notification_campaigns"("status", "scheduled_for");
CREATE INDEX "notification_campaigns_type_idx" ON "notification_campaigns"("type");
CREATE INDEX "notification_campaigns_audience_type_idx" ON "notification_campaigns"("audience_type");
CREATE INDEX "notification_campaigns_target_role_idx" ON "notification_campaigns"("target_role");
CREATE INDEX "notification_campaigns_target_user_id_idx" ON "notification_campaigns"("target_user_id");
CREATE INDEX "notification_campaigns_source_type_source_id_idx" ON "notification_campaigns"("source_type", "source_id");
CREATE INDEX "notification_campaigns_created_by_user_id_idx" ON "notification_campaigns"("created_by_user_id");

CREATE UNIQUE INDEX "notification_recipients_campaign_id_user_id_key" ON "notification_recipients"("campaign_id", "user_id");
CREATE INDEX "notification_recipients_user_id_read_at_idx" ON "notification_recipients"("user_id", "read_at");
CREATE INDEX "notification_recipients_campaign_id_idx" ON "notification_recipients"("campaign_id");

CREATE INDEX "push_delivery_attempts_status_next_attempt_at_idx" ON "push_delivery_attempts"("status", "next_attempt_at");
CREATE INDEX "push_delivery_attempts_campaign_id_status_idx" ON "push_delivery_attempts"("campaign_id", "status");
CREATE INDEX "push_delivery_attempts_recipient_id_idx" ON "push_delivery_attempts"("recipient_id");
CREATE INDEX "push_delivery_attempts_push_subscription_id_idx" ON "push_delivery_attempts"("push_subscription_id");
CREATE UNIQUE INDEX "push_delivery_attempts_campaign_id_push_subscription_id_attempt_number_key"
  ON "push_delivery_attempts"("campaign_id", "push_subscription_id", "attempt_number");

CREATE INDEX "push_subscriptions_user_id_is_active_idx" ON "push_subscriptions"("user_id", "is_active");

ALTER TABLE "notification_campaigns"
  ADD CONSTRAINT "notification_campaigns_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notification_campaigns"
  ADD CONSTRAINT "notification_campaigns_target_user_id_fkey"
  FOREIGN KEY ("target_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notification_recipients"
  ADD CONSTRAINT "notification_recipients_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "notification_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notification_recipients"
  ADD CONSTRAINT "notification_recipients_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "push_delivery_attempts"
  ADD CONSTRAINT "push_delivery_attempts_recipient_id_fkey"
  FOREIGN KEY ("recipient_id") REFERENCES "notification_recipients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "push_delivery_attempts"
  ADD CONSTRAINT "push_delivery_attempts_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "notification_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "push_delivery_attempts"
  ADD CONSTRAINT "push_delivery_attempts_push_subscription_id_fkey"
  FOREIGN KEY ("push_subscription_id") REFERENCES "push_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
