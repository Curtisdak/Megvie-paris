# Stripe Donations and Finance Setup

Prompt 4 turns the MegVie Paris donation flow into a Stripe-backed finance
ledger. Stripe remains the payment source of truth. Neon/PostgreSQL stores the
application ledger, reporting data, member history, webhook status and audit
events.

No secret values belong in this document, source control, client components or
browser-visible environment variables.

## Architecture

- Clerk authenticates visitors, members and administrators.
- Prisma writes permanent finance data to Neon PostgreSQL.
- Stripe Checkout creates one-time and monthly donation sessions.
- Stripe webhooks are the only source that marks a donation successful.
- Stripe Customer Portal lets active members manage monthly donations.
- The existing notification system sends safe in-app/push messages.
- The existing admin audit log records finance exports, category edits, webhook
  retries, refund sync and dispute sync.

The implementation does not add multi-tenancy, Stripe Connect, Supabase, Ably or
another service worker.

## Environment Variables

Required locally and in Vercel:

```env
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Optional:

```env
DONATION_CURRENCY=eur
DONATION_MIN_CENTS=500
DONATION_MAX_CENTS=500000
STRIPE_CUSTOMER_PORTAL_CONFIGURATION_ID=
STRIPE_RECEIPT_EMAILS_ENABLED=false
```

Important distinction:

- `STRIPE_SECRET_KEY` must start with `sk_test_` or `sk_live_`.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` must start with `pk_test_` or `pk_live_`.
- `STRIPE_WEBHOOK_SECRET` must start with `whsec_`.
- Never create `NEXT_PUBLIC_STRIPE_SECRET_KEY`.
- Never create `NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET`.

Use test-mode keys until every checkout, webhook, refund, dispute and export
check passes. Local Stripe CLI webhook secrets and production Vercel webhook
secrets are different values.

## Prisma Migration

The finance migration adds:

- `DonationCategory`
- `DonationCheckout`
- `Donation`
- `RecurringDonation`
- `DonationRefund`
- `StripeWebhookEvent`
- `AppUser.stripeCustomerId`

Seeded categories:

- `dime` - Dime
- `offrande` - Offrande
- `remerciement` - Remerciement
- `rachat` - Rachat
- `autre` - Autre

Run in development only unless production deployment is explicitly authorized:

```bash
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate dev
```

Do not run reset commands against existing data.

## Local Stripe CLI

1. Start the app:

   ```bash
   npm run dev
   ```

2. Start Stripe CLI forwarding:

   ```bash
   npm run stripe:listen
   ```

3. Copy the temporary local `whsec_...` value into local env as
   `STRIPE_WEBHOOK_SECRET`.

4. Restart the Next.js dev server after env changes.

5. Use Stripe test cards in Checkout.

6. Confirm webhook records appear under `/admin/webhooks-stripe`.

## Vercel Webhook Endpoint

Create a Stripe webhook endpoint for production:

```text
https://megvieparis.com/api/stripe/webhook
```

Add the production endpoint signing secret to Vercel as
`STRIPE_WEBHOOK_SECRET`. Do not reuse the local Stripe CLI secret.

Required event types:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `invoice.paid`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `charge.refunded`
- `refund.created`
- `refund.updated`
- `charge.dispute.created`
- `charge.dispute.updated`
- `charge.dispute.closed`

## Donation Flow

One-time donation:

1. Visitor or member selects amount, category and `Don unique`.
2. The server validates amount, category, currency and identity.
3. A `DonationCheckout` row is created.
4. Stripe Checkout is created server-side.
5. The browser redirects to Stripe.
6. The return URL only shows a pending/success message.
7. Verified webhooks create or update the `Donation` ledger row.

Monthly donation:

1. User must be authenticated and an active member.
2. One Stripe Customer is created or reused for the member.
3. Checkout runs in subscription mode.
4. Subscription webhooks create or update `RecurringDonation`.
5. Every paid invoice creates one `Donation` row.
6. Failed invoices create failed donation history and safe notifications.

Guest one-time donations are supported. Guest monthly donations are rejected.
Old guest donations are not auto-attached to future member accounts by matching
email.

## Customer Portal

Enable Stripe Customer Portal in the Stripe Dashboard before launch. Active
members can open their own portal session from `/espace-membre/dons`.

Optional env:

```env
STRIPE_CUSTOMER_PORTAL_CONFIGURATION_ID=bpc_xxxxx
```

If omitted, Stripe uses the account default portal configuration.

## Authorization

Member side:

- Members can view only their own donation history.
- Active members can open only their own Customer Portal.
- RESPO has no global finance access.

Admin side:

- FINANCE, MASTER and CREATOR can view finance dashboard data.
- FINANCE, MASTER and CREATOR can export authorized CSV data.
- CREATOR can manage donation categories.
- CREATOR can view and retry failed Stripe webhook events.

The app enforces permissions server-side. Hiding menu items is not used as
authorization.

## Statistics

Income totals include:

- `SUCCEEDED`
- `PARTIALLY_REFUNDED`
- `REFUNDED`

Income totals exclude:

- `PENDING`
- `FAILED`
- `CANCELLED`

Definitions:

- Gross: successful amount before refunds.
- Refunded: successful refunds.
- Net: gross minus successful refunds.
- Currency: currently restricted to EUR.
- Date windows: local app grouping uses the configured Europe/Paris runtime.

## CSV Export

CSV exports are available from `/admin/finance`.

The export:

- Reuses the current filters.
- Requires finance export permission.
- Limits output to 2000 rows.
- Uses UTF-8 with BOM.
- Excludes card details, birth dates and confidential member data.
- Sanitizes cells beginning with `=`, `+`, `-` or `@`.
- Creates an audit log entry.

## Webhook Idempotency

`StripeWebhookEvent.stripeEventId` is unique. Duplicate processed or ignored
events return without reprocessing. Financial rows also have unique Stripe
object anchors such as payment intent, invoice, charge and refund IDs.

The processor tolerates out-of-order events by reconciling through Stripe object
IDs and retrieving related subscriptions when needed.

## Refunds and Disputes

Refunds initiated in the Stripe Dashboard synchronize through webhook events.
Full refunds mark donations `REFUNDED`; partial refunds mark donations
`PARTIALLY_REFUNDED`.

Dispute webhooks mark the donation `DISPUTED` and write an audit log entry.
This prompt does not implement in-app refund initiation or dispute evidence
submission.

## Notifications

Successful member donations create one safe thank-you notification. Failed
recurring payments create one safe failure notification.

Push bodies do not include donation amounts. Guest donations do not create app
notifications because there is no authenticated member recipient.

## Smoke Testing

ImageKit:

```bash
npm run smoke:imagekit
```

Stripe test mode only:

```bash
npm run smoke:stripe
```

The Stripe smoke test refuses `sk_live_` and creates then expires a harmless
test Checkout Session without charging a card.

## Historical Checkout Import

If live Stripe Checkout payments existed before the Prompt 4 ledger/webhook
system was deployed, import them once with:

```bash
npm run import:stripe-history
```

The importer:

- Reads completed paid Stripe Checkout Sessions.
- Imports only one-time `payment` mode sessions.
- Stores amount, currency, donor snapshots and Stripe object references.
- Uses category `Autre` when older sessions have no category metadata.
- Does not store card numbers, CVC, payment-method details or client secrets.
- Does not link old guest donations to members by matching email.
- Is idempotent through the Stripe PaymentIntent ID.

## Manual Test Checklist

- Add Stripe test keys.
- Configure local webhook secret.
- Configure Vercel webhook destination.
- Select required webhook events.
- Activate Customer Portal.
- Configure cancellation behavior.
- Test one-time payment.
- Test monthly payment.
- Test failed monthly payment.
- Test cancellation.
- Test full refund.
- Test partial refund.
- Test dispute event.
- Test duplicate webhook delivery.
- Test `/espace-membre/dons`.
- Test `/admin/finance` as FINANCE, MASTER and CREATOR.
- Test RESPO and MEMBER cannot access global finance.
- Test CSV export.
- Test existing daily verse notifications.
- Test existing PWA install and push subscription.

## Live Launch Checklist

- All local tests pass with Stripe test keys.
- `npm run build` passes.
- Vercel env uses live `sk_live_`, live `pk_live_` and production `whsec_`.
- Production webhook endpoint is active.
- Customer Portal is active.
- Stripe receipt emails are configured only if desired.
- Finance users understand CSV export scope.
- No live charge was created during development.

## Troubleshooting

`STRIPE_SECRET_KEY` starts with `pk_`:

- Replace it with the server secret key that starts with `sk_test_` locally or
  `sk_live_` in production.

Webhook signature invalid:

- Use `request.text()` raw body.
- Confirm the correct `whsec_` for the current environment.
- Restart the app after changing env.

Donation appears pending after returning from Stripe:

- This is expected until the verified webhook is processed.

Monthly portal cannot open:

- Confirm the user is an active member.
- Confirm `AppUser.stripeCustomerId` exists.
- Confirm Stripe Customer Portal is enabled.

## Postponed To Later Prompts

- French fiscal receipts.
- In-app refund initiation.
- Dispute evidence submission.
- Accounting software integration.
- Bank reconciliation.
- Legal donation policy pages.
- New email provider integration.
