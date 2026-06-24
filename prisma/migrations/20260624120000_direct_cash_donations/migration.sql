CREATE TYPE "donation_source" AS ENUM ('ONLINE', 'DIRECT');
CREATE TYPE "direct_donation_kind" AS ENUM ('IDENTIFIED', 'ANONYMOUS_COLLECTION');
CREATE TYPE "direct_donation_status" AS ENUM ('RECORDED', 'VERIFIED', 'CANCELLED');

ALTER TABLE "donations"
  ADD COLUMN "source" "donation_source" NOT NULL DEFAULT 'ONLINE',
  ADD COLUMN "direct_kind" "direct_donation_kind",
  ADD COLUMN "direct_status" "direct_donation_status",
  ADD COLUMN "received_at" timestamp(3),
  ADD COLUMN "event_id" text,
  ADD COLUMN "collection_label" text,
  ADD COLUMN "internal_note" text,
  ADD COLUMN "manual_reference" text,
  ADD COLUMN "entered_by_user_id" text,
  ADD COLUMN "verified_by_user_id" text,
  ADD COLUMN "verified_at" timestamp(3),
  ADD COLUMN "cancelled_by_user_id" text,
  ADD COLUMN "cancelled_at" timestamp(3),
  ADD COLUMN "cancellation_reason" text,
  ADD COLUMN "correction_reason" text,
  ADD COLUMN "replaces_donation_id" text,
  ADD COLUMN "direct_entry_request_id" text;

UPDATE "donations"
SET "source" = 'ONLINE'
WHERE "source" IS NULL;

CREATE UNIQUE INDEX "donations_direct_entry_request_id_key" ON "donations"("direct_entry_request_id");
CREATE INDEX "donations_source_idx" ON "donations"("source");
CREATE INDEX "donations_direct_status_idx" ON "donations"("direct_status");
CREATE INDEX "donations_direct_kind_idx" ON "donations"("direct_kind");
CREATE INDEX "donations_received_at_idx" ON "donations"("received_at");
CREATE INDEX "donations_event_id_idx" ON "donations"("event_id");
CREATE INDEX "donations_entered_by_user_id_idx" ON "donations"("entered_by_user_id");
CREATE INDEX "donations_verified_by_user_id_idx" ON "donations"("verified_by_user_id");
CREATE INDEX "donations_cancelled_by_user_id_idx" ON "donations"("cancelled_by_user_id");
CREATE INDEX "donations_source_direct_status_received_at_idx" ON "donations"("source", "direct_status", "received_at");
CREATE INDEX "donations_source_category_id_received_at_idx" ON "donations"("source", "category_id", "received_at");

ALTER TABLE "donations"
  ADD CONSTRAINT "donations_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "church_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "donations"
  ADD CONSTRAINT "donations_entered_by_user_id_fkey"
  FOREIGN KEY ("entered_by_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "donations"
  ADD CONSTRAINT "donations_verified_by_user_id_fkey"
  FOREIGN KEY ("verified_by_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "donations"
  ADD CONSTRAINT "donations_cancelled_by_user_id_fkey"
  FOREIGN KEY ("cancelled_by_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "donations"
  ADD CONSTRAINT "donations_replaces_donation_id_fkey"
  FOREIGN KEY ("replaces_donation_id") REFERENCES "donations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "donations"
  ADD CONSTRAINT "donations_amount_cents_positive_chk"
  CHECK ("amount_cents" > 0);

ALTER TABLE "donations"
  ADD CONSTRAINT "donations_direct_status_mapping_chk"
  CHECK (
    "source" = 'ONLINE'
    OR (
      ("direct_status" = 'RECORDED' AND "status" = 'PENDING')
      OR ("direct_status" = 'VERIFIED' AND "status" = 'SUCCEEDED')
      OR ("direct_status" = 'CANCELLED' AND "status" = 'CANCELLED')
    )
  );

ALTER TABLE "donations"
  ADD CONSTRAINT "donations_source_shape_chk"
  CHECK (
    (
      "source" = 'ONLINE'
      AND "direct_kind" IS NULL
      AND "direct_status" IS NULL
      AND "direct_entry_request_id" IS NULL
    )
    OR (
      "source" = 'DIRECT'
      AND "frequency" = 'ONE_TIME'
      AND "direct_kind" IS NOT NULL
      AND "direct_status" IS NOT NULL
      AND "received_at" IS NOT NULL
      AND "entered_by_user_id" IS NOT NULL
      AND lower("currency") = 'eur'
      AND "refunded_amount_cents" = 0
      AND "checkout_id" IS NULL
      AND "recurring_donation_id" IS NULL
      AND "stripe_customer_id" IS NULL
      AND "stripe_checkout_session_id" IS NULL
      AND "stripe_payment_intent_id" IS NULL
      AND "stripe_invoice_id" IS NULL
      AND "stripe_charge_id" IS NULL
      AND "stripe_receipt_url" IS NULL
      AND "stripe_hosted_invoice_url" IS NULL
      AND "stripe_invoice_pdf_url" IS NULL
      AND (
        (
          "direct_kind" = 'IDENTIFIED'
          AND "user_id" IS NOT NULL
          AND NULLIF("member_id_snapshot", '') IS NOT NULL
          AND NULLIF("donor_name_snapshot", '') IS NOT NULL
        )
        OR (
          "direct_kind" = 'ANONYMOUS_COLLECTION'
          AND "user_id" IS NULL
          AND "member_id_snapshot" IS NULL
          AND (
            NULLIF("collection_label", '') IS NOT NULL
            OR "event_id" IS NOT NULL
          )
        )
      )
    )
  );
