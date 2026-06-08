# LedgerBook — Product & Technical Specification

**A mobile-first digital Khata (give/take ledger) web app.**
Version 1.0 · Last updated 2026-06-08 · Owner: Ritik

---

## 1. Overview

LedgerBook is a bookkeeping web app (a "digital bahi-khata") where a business owner records money **given** to and **received** from each customer/supplier. Every entry updates that party's **running balance** automatically, and the owner can always see the net "you'll get / you'll give" position across the whole business.

It is **not** a crypto wallet and does **not** move real money. It is a record-keeping ledger, comparable to KhataBook / OkCredit, but built as a modern, installable web app (PWA) with multi-currency support.

### Goals

- **Fast entry**: adding a give/take entry takes <5 seconds, one-handed, on a cheap phone.
- **Trustworthy numbers**: balances are always correct and auditable (immutable entry log).
- **Feels like an app**: mobile-first, bottom navigation, gestures, smooth page/nav animations, offline-tolerant.
- **Production-grade**: typed end-to-end, validated, tested, secure per-user data isolation, deployable to Vercel.

### Non-goals (v1)

- No real payments / UPI settlement (we only record that a payment happened).
- No double-entry accounting / chart of accounts (explicitly chosen: simple running balance).
- No multi-staff roles in v1 (single owner per business; team roles are a Phase 2 item).

---

## 2. Core domain model (decisions)

| Decision | Choice | Rationale |
|---|---|---|
| Ledger style | **Khata running balance** | One signed balance per party; matches the give/take requirement. |
| Sign convention | `amount` is always positive; `direction` enum `CREDIT`/`DEBIT` carries meaning | Avoids sign bugs; readable. |
| Balance source of truth | **Derived from entries**, cached on `Customer.balance` | Entries are immutable history; cached balance is a denormalised fast read, recomputed transactionally. |
| Multi-currency | Per **customer** base currency; each entry stores its currency + the customer currency is the ledger currency | Keeps each party's balance unambiguous; cross-currency totals use a snapshot rate. |
| Tenancy | Every row scoped to `userId` (Clerk user) | Hard data isolation in every query. |

### Direction semantics

- **You GAVE money / goods to the customer** → customer owes you → `direction = CREDIT` → increases "you'll get".
- **You GOT money from the customer** → reduces what they owe → `direction = DEBIT` → increases "you'll give" if it overshoots.

`balance > 0` ⇒ *you'll get* (receivable). `balance < 0` ⇒ *you'll give* (payable).

---

## 3. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15 (App Router)** + **TypeScript** | Server Components + Server Actions. |
| Styling | **Tailwind CSS v4** + **shadcn/ui** | Paper Minimal theme (see §9). |
| UI primitives | shadcn/ui (Radix under the hood), **lucide-react** icons | Accessible, headless, consistent. |
| Animation | **Framer Motion** | Page transitions, nav, FAB, list item enter/exit, number count-up. |
| Auth | **Clerk** | Hosted auth, `<SignIn/>`, middleware, webhook → DB sync. |
| ORM | **Prisma** | Type-safe queries + migrations. |
| Database | **Self-hosted MySQL 8** | See §6 for serverless connection strategy (important). |
| Validation | **Zod** | Shared schemas for forms + server actions + API. |
| Forms | **react-hook-form** + `@hookform/resolvers/zod` | |
| State / data fetching | Server Components + Server Actions; **TanStack Query** for client-side optimistic UI | |
| Charts | **Recharts** | Reports / balance sparkline. |
| CSV | **papaparse** (parse) + custom serializer (export) | |
| PDF | **@react-pdf/renderer** (statements) | Server-rendered PDF route. |
| Tables | **@tanstack/react-table** | Reports / parties list on larger screens. |
| Dates / money | **date-fns**, **dinero.js** (or `Intl.NumberFormat`) | Safe money math (integer minor units). |
| PWA | **next-pwa** / app manifest | Installable, offline shell. |
| Testing | **Vitest** (unit), **Playwright** (e2e) | |
| Lint / format | ESLint + Prettier + `typescript` strict | |
| Deploy | **Vercel** | CI via GitHub. |

> **Money is stored as integer minor units** (e.g. paise/cents) in a `BigInt`/`Int` column, never floats. Formatting happens at the edge with `Intl.NumberFormat`.

---

## 4. Standard folder structure

```
ledgerbook/
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ public/
│  ├─ icons/                 # PWA icons
│  └─ manifest.webmanifest
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/        # public landing page
│  │  │  └─ page.tsx
│  │  ├─ (auth)/
│  │  │  ├─ sign-in/[[...sign-in]]/page.tsx
│  │  │  └─ sign-up/[[...sign-up]]/page.tsx
│  │  ├─ (app)/              # authenticated shell (bottom nav layout)
│  │  │  ├─ layout.tsx       # nav + FAB + page-transition wrapper
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ parties/
│  │  │  │  ├─ page.tsx              # customer list
│  │  │  │  └─ [id]/page.tsx         # single customer ledger
│  │  │  ├─ entries/new/page.tsx     # add give/take entry
│  │  │  ├─ reports/page.tsx
│  │  │  └─ settings/page.tsx
│  │  ├─ api/
│  │  │  ├─ webhooks/clerk/route.ts  # user sync
│  │  │  ├─ export/csv/route.ts
│  │  │  └─ export/pdf/[customerId]/route.ts
│  │  ├─ layout.tsx          # root, <ClerkProvider>, fonts
│  │  └─ globals.css
│  ├─ components/
│  │  ├─ ui/                 # shadcn components
│  │  ├─ ledger/             # CustomerCard, EntryRow, BalancePill, AmountInput…
│  │  ├─ nav/                # BottomNav, Fab, PageTransition
│  │  └─ charts/
│  ├─ server/
│  │  ├─ actions/            # "use server" mutations (createEntry, …)
│  │  ├─ queries/            # read helpers (getDashboard, getCustomer…)
│  │  └─ db.ts               # Prisma client singleton
│  ├─ lib/
│  │  ├─ money.ts            # minor-unit helpers, formatCurrency
│  │  ├─ currency.ts         # currency list, rates
│  │  ├─ validators/         # zod schemas
│  │  └─ utils.ts
│  ├─ hooks/
│  ├─ types/
│  └─ middleware.ts          # Clerk route protection
├─ tests/
│  ├─ unit/
│  └─ e2e/
├─ .env.example
├─ next.config.ts
├─ tailwind.config.ts
└─ package.json
```

---

## 5. Data model (Prisma schema)

```prisma
// prisma/schema.prisma
generator client { provider = "prisma-client-js" }

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id          String     @id            // Clerk user id
  email       String     @unique
  name        String?
  businessName String?
  baseCurrency String    @default("INR")
  createdAt   DateTime   @default(now())
  customers   Customer[]
  entries     Entry[]
}

model Customer {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  phone       String?
  type        PartyType @default(CUSTOMER)   // CUSTOMER | SUPPLIER
  currency    String   @default("INR")       // this party's ledger currency
  balanceMinor BigInt  @default(0)           // cached running balance, minor units, signed
  note        String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  entries     Entry[]

  @@index([userId])
  @@index([userId, name])
}

model Entry {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  customerId  String
  customer    Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  direction   Direction                       // CREDIT (you gave) | DEBIT (you got)
  amountMinor BigInt                          // positive, minor units
  currency    String                          // = customer.currency at time of entry
  note        String?   @db.Text
  attachmentUrl String?
  occurredAt  DateTime  @default(now())       // user-editable date
  createdAt   DateTime  @default(now())

  @@index([customerId, occurredAt])
  @@index([userId, occurredAt])
}

enum Direction { CREDIT DEBIT }
enum PartyType { CUSTOMER SUPPLIER }
```

### Balance integrity

`createEntry` / `deleteEntry` / `editEntry` run inside a **`prisma.$transaction`** that (1) writes the entry and (2) updates `Customer.balanceMinor`. A scheduled/admin **recompute** job can rebuild any cached balance from the immutable entry log as a safety net:

```ts
balanceMinor = Σ(CREDIT.amount) − Σ(DEBIT.amount)
```

---

## 6. ⚠️ MySQL on Vercel (serverless) — connection strategy

This is the single most important production concern. Vercel runs **serverless functions** that each open their own DB connection; a self-hosted MySQL will hit `Too many connections` under load. Pick **one**:

1. **Prisma Accelerate (recommended)** — Prisma's managed connection pooler + edge cache. Point `DATABASE_URL` at Accelerate; it pools to your MySQL. Minimal code change.
2. **A pooler in front of MySQL** — run **ProxySQL** (or your host's pooler) and connect Prisma through it; set `?connection_limit=...&pool_timeout=...`.
3. **Driver adapters + serverless driver** — Prisma driver adapters with a serverless-friendly MySQL driver.

Also set on the Prisma datasource URL: `connection_limit=5` (small per-function), `pool_timeout`, and `sslaccept=strict` for TLS. Run migrations from CI, never at runtime. Document the chosen option in `README`.

> If you ever want to skip self-hosting, **PlanetScale** (MySQL-compatible, serverless-native) is the drop-in alternative — but we're proceeding with self-hosted MySQL + a pooler per your choice.

---

## 7. Routes, pages & server actions

### Pages (App Router)

| Route | Purpose |
|---|---|
| `/` | Marketing landing (public) |
| `/sign-in`, `/sign-up` | Clerk auth |
| `/dashboard` | Net balance, you'll-get/give, recent parties, quick actions |
| `/parties` | Searchable customer list with balances + filters (get/give/currency) |
| `/parties/[id]` | Single customer ledger: running balance, entry timeline, add/edit, share, export PDF |
| `/entries/new?customerId=` | Add give/take entry (amount pad, date, note, attachment) |
| `/reports` | Charts + period filters; CSV/PDF export |
| `/settings` | Business name, base currency, language, data export, account |

### Server actions (`src/server/actions`)

`createCustomer`, `updateCustomer`, `deleteCustomer`, `createEntry`, `updateEntry`, `deleteEntry`, `setReminder`. Every action: `auth()` → resolve `userId` → Zod-validate input → scope query by `userId` → transaction → `revalidatePath`.

### API routes

- `POST /api/webhooks/clerk` — on `user.created`/`updated`/`deleted`, upsert/delete `User` row (verify Svix signature).
- `GET /api/export/csv?scope=all|customer&id=` — streamed CSV.
- `GET /api/export/pdf/[customerId]` — account statement PDF via `@react-pdf/renderer`.

---

## 8. Auth flow (Clerk)

1. `middleware.ts` protects everything under `(app)/` and the export/API routes; public: `/`, auth pages, Clerk webhook.
2. Root layout wraps app in `<ClerkProvider>`.
3. On first sign-up, the **Clerk webhook** creates the `User` row (source of truth for `userId` FK). A fallback "ensure user exists" check runs in a server query in case the webhook is delayed.
4. All data queries derive `userId` from `auth()` server-side — **never** trust a client-supplied id.

`.env.example`:
```
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

## 9. UI / UX system — "Paper Minimal"

Clean white fintech aesthetic, mobile-first, one accent colour.

### Design tokens

| Token | Value |
|---|---|
| Background | `#FFFFFF`, surfaces `#FBFCFE` |
| Border | `#E8EDF3` / `#F1F5F9` |
| Text | primary `#0F172A`, muted `#64748B`, faint `#94A3B8` |
| Accent (brand) | Emerald `#16A34A` (primary action) |
| Positive (you'll get) | `#16A34A` |
| Negative (you'll give) | `#DC2626` |
| Radius | cards `20px`, controls `12–16px`, pills `999px` |
| Font | **Inter** (or Geist), tight tracking on numbers |
| Shadow | soft, low-opacity (`0 4px 14px -10px rgba(15,23,42,.3)`) |

### Layout & navigation

- **Mobile-first**, max content width on desktop centered (app stays "phone-like").
- **Bottom tab bar**: Home · Parties · Reports · Profile, with a central **"Add Entry"** pill/FAB.
- Sticky top bar with business avatar + notifications.

### Animation (Framer Motion)

- Route changes: shared-layout fade/slide page transitions.
- Bottom-nav active indicator springs between tabs.
- FAB → "Add Entry" sheet uses a spring scale/slide.
- List items: staggered enter; swipe-to-action on entries.
- Balance numbers: **count-up** animation on load/update.
- Respect `prefers-reduced-motion`.

### Key components

`BalanceCard`, `GetGiveStat`, `CustomerCard` (avatar + name + balance), `EntryRow`, `AmountPad`, `CurrencyBadge`, `EmptyState`, `BottomNav`, `Fab`, `ExportMenu`.

### Accessibility

WCAG 2.1 AA: contrast ≥ 4.5:1, ≥44px touch targets, focus-visible rings, semantic landmarks, screen-reader labels on icon-only buttons.

---

## 10. Multi-currency handling

- Each **customer** has a fixed ledger `currency`; all their entries use it → their balance is unambiguous.
- Dashboard **net total**: group balances by currency and show per-currency subtotals; optionally a single "approx total" in base currency using a stored daily rate (clearly labelled "approx").
- Formatting via `Intl.NumberFormat(locale, { style:'currency', currency })`.
- Currency list + symbols in `lib/currency.ts`; optional FX rates fetched daily and cached (manual override allowed).

---

## 11. Import / Export

| Feature | How |
|---|---|
| **CSV export** | `/api/export/csv` streams entries (date, party, direction, amount, currency, note, running balance). |
| **CSV import** | Upload → `papaparse` → preview/map columns → Zod-validate rows → bulk `createMany` in a transaction with a dry-run summary. |
| **PDF statement** | Per-customer account statement (header, party info, entry table, opening/closing balance) via `@react-pdf/renderer`; shareable link. |
| **Share** | "Share balance" deep link / WhatsApp text (Phase 2: reminders). |

---

## 12. Security & data integrity

- **Tenant isolation**: every query filters by `userId`; FK `onDelete: Cascade`.
- **Validation**: Zod on every server action + API boundary; reject on the server even if client validated.
- **Webhook verification**: Svix signature check on Clerk webhook.
- **Rate limiting**: lightweight limiter (e.g. Upstash) on mutations + export.
- **No floats for money**; integer minor units everywhere.
- **Immutable history**: edits/deletes recorded; balances recomputable from log.
- **Secrets** only in env vars; never shipped to client (only `NEXT_PUBLIC_*` exposed).

---

## 13. Performance

- Server Components for data-heavy screens; ship minimal JS.
- Mobile-first, target **LCP < 2s** on low-end Android / slow 3G.
- `next/font` for Inter; route-level code splitting; optimistic UI on entry add.
- DB indexes on `(userId)`, `(customerId, occurredAt)`.
- PWA app-shell caching for offline read of last-synced data.

---

## 14. Testing strategy

- **Unit (Vitest)**: money math, balance computation, currency formatting, CSV mapping, Zod schemas.
- **Integration**: server actions against a test MySQL (transaction rollback per test).
- **E2E (Playwright)**: sign-in (Clerk test mode) → add customer → add give/take → balance correct → export CSV/PDF.
- **CI gate**: typecheck + lint + unit + e2e on PR.

---

## 15. Deployment (Vercel)

1. GitHub repo → import to Vercel.
2. Set env vars (§8) in Vercel project settings.
3. Provision self-hosted MySQL + the chosen pooler (§6).
4. `prisma migrate deploy` runs in the build/CI step.
5. Configure Clerk production instance + webhook URL → `/api/webhooks/clerk`.
6. Add custom domain; verify PWA manifest + HTTPS.

---

## 16. Roadmap

**MVP (Phase 1)** — auth, customers CRUD, give/take entries with running balance, dashboard, single-customer ledger, multi-currency, CSV+PDF export, Paper Minimal UI + animations, PWA, deploy.

**Phase 2** — CSV import, payment reminders (SMS/WhatsApp), share-balance links, reports & charts, attachments (receipts), search & filters, multi-language (i18n), dark mode.

**Phase 3** — team members & roles, invoicing/bills, recurring entries, audit log UI, approx base-currency totals with live FX, backups/data export tooling.

---

## 17. Open questions for Ritik

1. **Approx cross-currency total** on the dashboard — show it (needs FX rates) or keep per-currency subtotals only for v1?
2. **Languages** — English only at launch, or Hindi/Hinglish in MVP?
3. **Suppliers vs customers** — do you need the SUPPLIER party type in v1, or only customers?
4. **MySQL host** — where is the DB hosted (so I can pin the exact pooler setup in §6)?
5. **App name** — keep "LedgerBook", or your own brand?
