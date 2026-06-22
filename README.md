This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

THIS LINK HIS FOR BIBLE DOWNLOAD https://github.com/BibleCorps/FRA-B-LSG1910-PD-UBS.git

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Stripe donations

Create `.env.local` from `.env.local.example` and set:

```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use `sk_test_...` for local testing and `sk_live_...` in production. A
`pk_live_...` key is publishable and must not be used as `STRIPE_SECRET_KEY`.

## PWA and daily verse notifications

The app can be installed on Android and iPhone as a PWA and supports opt-in
daily Bible verse push notifications. See
[docs/PWA_PUSH_SETUP.md](docs/PWA_PUSH_SETUP.md) for Clerk, Neon, VAPID, cron, and
device testing setup.

## Membership auth

Member authentication now uses Clerk, with membership data stored in Neon/Postgres
through Prisma. See
[docs/CLERK_NEON_PRISMA_SETUP.md](docs/CLERK_NEON_PRISMA_SETUP.md).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Megvie-paris
# Megvie-paris
