# Libretta — Digital Khata (give/take ledger)

Mobile-first bookkeeping web app. Record money you **give** and **get** per customer; balances update automatically. Multi-currency, Clerk auth, CSV + print/PDF export. Built with Next.js 15 + Prisma + MySQL, deployable to Vercel.

> Full product & technical spec: **[SPEC.md](./SPEC.md)** · UI exploration: **[ui-mockups.html](./ui-mockups.html)**

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Framer Motion · lucide-react · Clerk · Prisma · MySQL · Zod.

## Getting started

> Uses **pnpm** (via Corepack). Enable it once with `corepack enable`.

```bash
# 1. Install
pnpm install

# 2. Configure env  (a .env.local is already scaffolded for you)
#    ⚠️ ROTATE the RDS password & Clerk secret that were shared in chat.

# 3. Push the schema to your MySQL database
pnpm db:push          # or: pnpm db:migrate  (creates migration history)

# 4. (optional) Seed demo data
#    To see demo data while logged in, set your Clerk user id first:
#    SEED_USER_ID=user_xxx pnpm db:seed
pnpm db:seed

# 5. Run
pnpm dev              # http://localhost:3000
```

## Environment variables

See `.env.example`. Required: `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`. For the Clerk webhook (user sync), set `CLERK_WEBHOOK_SECRET`.

> **Password encoding:** special characters in the DB password must be URL-encoded (e.g. `+` → `%2B`). This is already done in the scaffolded `.env.local`.

## Clerk setup

1. Create a Clerk application; copy the publishable + secret keys into `.env.local`.
2. (Recommended) Add a webhook in the Clerk dashboard pointing to `https://<your-domain>/api/webhooks/clerk`, subscribe to `user.created`, `user.updated`, `user.deleted`, and put the signing secret in `CLERK_WEBHOOK_SECRET`. A fallback in `requireUser()` also creates the DB user on first request if the webhook is delayed.

## Project structure

```
src/
  app/
    (marketing)/        landing page  "/"
    (auth)/             Clerk sign-in / sign-up
    (app)/              authenticated shell (bottom nav)
      dashboard/  parties/  parties/[id]/  parties/new/  entries/new/  reports/  settings/
    statement/[id]/     print-ready account statement (Save as PDF)
    api/
      webhooks/clerk/   user sync
      export/csv/       CSV export
  components/  ledger/ + nav/   UI components
  server/      db, auth, queries/, actions/
  lib/         money, currency, validators, utils
prisma/        schema.prisma + seed.ts
```

## Core model

- **Customer** has a fixed ledger `currency` and a cached signed `balanceMinor` (+ = "you'll get").
- **Entry** is immutable history: `CREDIT` = you gave (receivable ↑), `DEBIT` = you got.
- Adding/deleting an entry updates the cached balance inside a `prisma.$transaction`. Money is stored as integer **minor units** — never floats.

## ⚠️ Production: MySQL on Vercel serverless

Self-hosted MySQL + serverless functions can exhaust connections. Before scaling, front the DB with **Prisma Accelerate** or a pooler (e.g. ProxySQL). The scaffolded `DATABASE_URL` includes `connection_limit=5`. See **SPEC.md §6**.

## Deploy to Vercel

1. Push to GitHub, import to Vercel.
2. Add env vars from `.env.local`.
3. `prisma migrate deploy` runs in the `build` script.
4. Point the Clerk production webhook at `/api/webhooks/clerk`.

## Scripts

`dev` · `build` · `start` · `lint` · `typecheck` · `db:push` · `db:migrate` · `db:deploy` · `db:seed` · `db:studio`

## Roadmap (next)

CSV import · payment reminders (SMS/WhatsApp) · charts · attachments · search/filters · i18n (Hindi) · dark mode. See SPEC.md §16.
