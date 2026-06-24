CREATE TYPE "donation_frequency" AS ENUM ('ONE_TIME', 'MONTHLY');
CREATE TYPE "donation_checkout_status" AS ENUM ('CREATED', 'OPEN', 'COMPLETED', 'EXPIRED', 'FAILED', 'CANCELLED');
CREATE TYPE "donation_status" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'DISPUTED', 'CANCELLED');
CREATE TYPE "recurring_donation_status" AS ENUM ('INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'PAUSED');
CREATE TYPE "donation_refund_status" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED');
CREATE TYPE "stripe_webhook_processing_status" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'IGNORED', 'FAILED');

ALTER TABLE "app_users"
  ADD COLUMN "stripe_customer_id" text;

CREATE TABLE "donation_categories" (
  "id" text NOT NULL,
  "slug" text NOT NULL,
  "label" text NOT NULL,
  "description" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "donation_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "donation_checkouts" (
  "id" text NOT NULL,
  "user_id" text,
  "member_id_snapshot" text,
  "category_id" text NOT NULL,
  "frequency" "donation_frequency" NOT NULL,
  "amount_cents" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'eur',
  "donor_name_snapshot" text,
  "donor_email_snapshot" text,
  "status" "donation_checkout_status" NOT NULL DEFAULT 'CREATED',
  "stripe_checkout_session_id" text,
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "stripe_payment_intent_id" text,
  "livemode" boolean NOT NULL DEFAULT false,
  "expires_at" timestamp(3),
  "completed_at" timestamp(3),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "donation_checkouts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "donations" (
  "id" text NOT NULL,
  "user_id" text,
  "member_id_snapshot" text,
  "checkout_id" text,
  "recurring_donation_id" text,
  "category_id" text NOT NULL,
  "frequency" "donation_frequency" NOT NULL,
  "status" "donation_status" NOT NULL DEFAULT 'PENDING',
  "amount_cents" integer NOT NULL,
  "refunded_amount_cents" integer NOT NULL DEFAULT 0,
  "currency" text NOT NULL DEFAULT 'eur',
  "donor_name_snapshot" text,
  "donor_email_snapshot" text,
  "stripe_customer_id" text,
  "stripe_checkout_session_id" text,
  "stripe_payment_intent_id" text,
  "stripe_invoice_id" text,
  "stripe_charge_id" text,
  "stripe_receipt_url" text,
  "stripe_hosted_invoice_url" text,
  "stripe_invoice_pdf_url" text,
  "failure_code" text,
  "livemode" boolean NOT NULL DEFAULT false,
  "donated_at" timestamp(3),
  "failed_at" timestamp(3),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recurring_donations" (
  "id" text NOT NULL,
  "user_id" text NOT NULL,
  "member_id_snapshot" text,
  "category_id" text NOT NULL,
  "amount_cents" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'eur',
  "status" "recurring_donation_status" NOT NULL DEFAULT 'INCOMPLETE',
  "stripe_customer_id" text NOT NULL,
  "stripe_subscription_id" text NOT NULL,
  "stripe_price_id" text,
  "stripe_product_id" text,
  "current_period_start" timestamp(3),
  "current_period_end" timestamp(3),
  "cancel_at_period_end" boolean NOT NULL DEFAULT false,
  "canceled_at" timestamp(3),
  "ended_at" timestamp(3),
  "livemode" boolean NOT NULL DEFAULT false,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "recurring_donations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "donation_refunds" (
  "id" text NOT NULL,
  "donation_id" text NOT NULL,
  "stripe_refund_id" text NOT NULL,
  "amount_cents" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'eur',
  "status" "donation_refund_status" NOT NULL DEFAULT 'PENDING',
  "reason" text,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "donation_refunds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stripe_webhook_events" (
  "id" text NOT NULL,
  "stripe_event_id" text NOT NULL,
  "event_type" text NOT NULL,
  "stripe_object_id" text,
  "livemode" boolean NOT NULL DEFAULT false,
  "api_version" text,
  "processing_status" "stripe_webhook_processing_status" NOT NULL DEFAULT 'RECEIVED',
  "attempt_count" integer NOT NULL DEFAULT 0,
  "last_error_code" text,
  "received_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processing_started_at" timestamp(3),
  "processed_at" timestamp(3),
  "failed_at" timestamp(3),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_users_stripe_customer_id_key" ON "app_users"("stripe_customer_id");

CREATE UNIQUE INDEX "donation_categories_slug_key" ON "donation_categories"("slug");
CREATE INDEX "donation_categories_is_active_sort_order_idx" ON "donation_categories"("is_active", "sort_order");

CREATE UNIQUE INDEX "donation_checkouts_stripe_checkout_session_id_key" ON "donation_checkouts"("stripe_checkout_session_id");
CREATE INDEX "donation_checkouts_user_id_created_at_idx" ON "donation_checkouts"("user_id", "created_at");
CREATE INDEX "donation_checkouts_category_id_idx" ON "donation_checkouts"("category_id");
CREATE INDEX "donation_checkouts_status_created_at_idx" ON "donation_checkouts"("status", "created_at");
CREATE INDEX "donation_checkouts_frequency_idx" ON "donation_checkouts"("frequency");
CREATE INDEX "donation_checkouts_stripe_customer_id_idx" ON "donation_checkouts"("stripe_customer_id");
CREATE INDEX "donation_checkouts_stripe_subscription_id_idx" ON "donation_checkouts"("stripe_subscription_id");

CREATE UNIQUE INDEX "donations_stripe_payment_intent_id_key" ON "donations"("stripe_payment_intent_id");
CREATE UNIQUE INDEX "donations_stripe_invoice_id_key" ON "donations"("stripe_invoice_id");
CREATE UNIQUE INDEX "donations_stripe_charge_id_key" ON "donations"("stripe_charge_id");
CREATE INDEX "donations_user_id_donated_at_idx" ON "donations"("user_id", "donated_at");
CREATE INDEX "donations_category_id_donated_at_idx" ON "donations"("category_id", "donated_at");
CREATE INDEX "donations_status_donated_at_idx" ON "donations"("status", "donated_at");
CREATE INDEX "donations_frequency_donated_at_idx" ON "donations"("frequency", "donated_at");
CREATE INDEX "donations_stripe_customer_id_idx" ON "donations"("stripe_customer_id");
CREATE INDEX "donations_stripe_checkout_session_id_idx" ON "donations"("stripe_checkout_session_id");
CREATE INDEX "donations_created_at_idx" ON "donations"("created_at");

CREATE UNIQUE INDEX "recurring_donations_stripe_subscription_id_key" ON "recurring_donations"("stripe_subscription_id");
CREATE INDEX "recurring_donations_user_id_status_idx" ON "recurring_donations"("user_id", "status");
CREATE INDEX "recurring_donations_category_id_idx" ON "recurring_donations"("category_id");
CREATE INDEX "recurring_donations_status_idx" ON "recurring_donations"("status");
CREATE INDEX "recurring_donations_stripe_customer_id_idx" ON "recurring_donations"("stripe_customer_id");
CREATE INDEX "recurring_donations_created_at_idx" ON "recurring_donations"("created_at");

CREATE UNIQUE INDEX "donation_refunds_stripe_refund_id_key" ON "donation_refunds"("stripe_refund_id");
CREATE INDEX "donation_refunds_donation_id_idx" ON "donation_refunds"("donation_id");
CREATE INDEX "donation_refunds_status_idx" ON "donation_refunds"("status");

CREATE UNIQUE INDEX "stripe_webhook_events_stripe_event_id_key" ON "stripe_webhook_events"("stripe_event_id");
CREATE INDEX "stripe_webhook_events_processing_status_received_at_idx" ON "stripe_webhook_events"("processing_status", "received_at");
CREATE INDEX "stripe_webhook_events_event_type_idx" ON "stripe_webhook_events"("event_type");
CREATE INDEX "stripe_webhook_events_stripe_object_id_idx" ON "stripe_webhook_events"("stripe_object_id");

ALTER TABLE "donation_checkouts"
  ADD CONSTRAINT "donation_checkouts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "donation_checkouts"
  ADD CONSTRAINT "donation_checkouts_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "donation_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "donations"
  ADD CONSTRAINT "donations_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "donations"
  ADD CONSTRAINT "donations_checkout_id_fkey"
  FOREIGN KEY ("checkout_id") REFERENCES "donation_checkouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "donations"
  ADD CONSTRAINT "donations_recurring_donation_id_fkey"
  FOREIGN KEY ("recurring_donation_id") REFERENCES "recurring_donations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "donations"
  ADD CONSTRAINT "donations_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "donation_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "recurring_donations"
  ADD CONSTRAINT "recurring_donations_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "recurring_donations"
  ADD CONSTRAINT "recurring_donations_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "donation_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "donation_refunds"
  ADD CONSTRAINT "donation_refunds_donation_id_fkey"
  FOREIGN KEY ("donation_id") REFERENCES "donations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "donation_categories" ("id", "slug", "label", "description", "is_active", "sort_order", "updated_at")
VALUES
  ('doncat_dime', 'dime', 'Dîme', 'Soutenir fidelement la vie et les missions de l''eglise.', true, 10, CURRENT_TIMESTAMP),
  ('doncat_offrande', 'offrande', 'Offrande', 'Participer librement aux besoins et projets MegVie Paris.', true, 20, CURRENT_TIMESTAMP),
  ('doncat_remerciement', 'remerciement', 'Remerciement', 'Exprimer une reconnaissance particuliere.', true, 30, CURRENT_TIMESTAMP),
  ('doncat_rachat', 'rachat', 'Rachat', 'Contribuer a une intention ou un engagement personnel.', true, 40, CURRENT_TIMESTAMP),
  ('doncat_autre', 'autre', 'Autre', 'Autre forme de soutien.', true, 50, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE
SET "label" = EXCLUDED."label",
    "description" = EXCLUDED."description",
    "is_active" = EXCLUDED."is_active",
    "sort_order" = EXCLUDED."sort_order",
    "updated_at" = CURRENT_TIMESTAMP;
