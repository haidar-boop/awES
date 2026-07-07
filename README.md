# 🪙 PennyRadar Canada

**Community-powered penny deal & hidden clearance finder for Canadian retail stores.**

A live, filterable, location-aware list of items ringing up at $0.01–$0.10 at Home Depot Canada, Walmart
Canada, and Dollar Tree Canada — plus the education layer (tag decoder, 10 in-depth guides, glossary) and
the community layer (reports, confirmations, leaderboards, badges) that make it trustworthy.

Built with Next.js 14 (App Router, TypeScript), Drizzle ORM + Postgres (Supabase), Tailwind, Leaflet,
JsBarcode, Resend, and Stripe. All product decisions and deviations are documented in
[DECISIONS.md](./DECISIONS.md).

---

## Quick start (zero config — demo mode)

```bash
npm install
npm run dev          # → http://localhost:3000
```

With **no environment variables at all**, the app runs in **demo mode**: every read-only surface (live
list, map, filters, postal-code radius search, item pages, barcodes, decoder, guides, leaderboard, admin
dashboard) works against 25 realistic seeded deals across ON/AB/BC. Write actions (reporting, votes,
alerts, checkout) return a friendly "demo mode" message until you connect services.

```bash
npm test             # 50 unit tests: confidence engine, dedupe, UPC check digits, geo/FSA, cash rounding
npm run build        # production build
```

## Full setup (production)

### 1. Environment

```bash
cp .env.example .env.local
```

Fill in the blocks you need — each unlocks independently:

| Block | Unlocks |
|---|---|
| `DATABASE_URL` (Supabase Postgres) | Real data, reports, moderation, votes, watchlist, alerts |
| `NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY` | Auth (magic link + Google) and photo storage |
| `RESEND_API_KEY` + `EMAIL_FROM` | Welcome, alert, digest, report-approved emails |
| `STRIPE_*` | Pro checkout ($7 CAD/mo, $49/yr) + webhook |
| `UPSTASH_REDIS_*` | Distributed rate limiting (falls back to in-memory) |
| `CRON_SECRET` | Protects the cron endpoints |
| `ADMIN_EMAILS` | Emails auto-granted admin on first sign-in |

### 2. Database

```bash
npm run db:push      # create schema (drizzle-kit push)
npm run db:seed      # retailers + decoder content, 40 stores in 15 metros, FSA centroids,
                     # 25 sample deals, badges, 3 receipt-wall stories, 10 articles
```

Load the full national store list later via CSV (geocodes missing coordinates through Nominatim):

```bash
npm run db:import-stores stores.csv
# columns: retailer_slug,name,address,city,province,postal_code,lat,lng
```

### 3. Supabase specifics

- **Auth**: enable Email (magic link) and Google providers; set the site URL to your domain.
- **Storage**: create a public bucket named `report-photos` (client uploads compressed images, API stores URLs).

### 4. Stripe

Create two prices in CAD (`STRIPE_PRICE_MONTHLY` = $7/month, `STRIPE_PRICE_YEARLY` = $49/year) and point a
webhook at `/api/stripe/webhook` with events `checkout.session.completed`,
`customer.subscription.updated`, `customer.subscription.deleted`.

### 5. Deploy (Vercel)

Push to GitHub → import in Vercel → add the env vars. `vercel.json` registers the four cron jobs:

| Cron | Schedule | Purpose |
|---|---|---|
| `/api/cron/decay` | hourly | Confidence decay: verified → likely → unconfirmed → dead |
| `/api/cron/alerts` | every 5 min | Area-alert matcher (instant + daily) |
| `/api/cron/digest` | weekly (Sat) | "This week's penny finds in {province}" digest |
| `/api/cron/sitemap` | daily | Revalidates sitemap/RSS/feed caches |

Set `CRON_SECRET` and Vercel sends it automatically as the `Authorization: Bearer` header.

---

## Architecture notes

- **Core logic is pure and unit-tested** (`lib/core/*` + `tests/*`): confidence scoring (spec §4.4),
  duplicate-merge (§4.2), UPC check digits, FSA/haversine geo, CAD cash rounding.
- **One read model** (`lib/data/source.ts`): demo seed or DB rows load into identical shapes; all feed
  assembly/filtering lives in `lib/data/queries.ts` and is shared by every page. Writes go straight to
  Postgres via Drizzle (`lib/data/mutations.ts`).
- **Report pipeline**: submit → UPC validated → duplicate (same UPC + store ≤ 7 days) merges as a
  confirmation → trusted users auto-publish, new users queue → approval writes price history, bumps
  reporter stats (auto-trust at 5), grants First Find, emails the reporter, recomputes the deal.
- **SEO**: unique metadata per route, canonical tags, JSON-LD (`Product`/`Offer`, `Article`, `FAQPage`,
  `DefinedTermSet`, `LocalBusiness`, `BreadcrumbList`), dynamic OG images via `/api/og`, RSS of verified
  deals, sitemap with thin-content protection (province/city pages noindex until ≥3 deals).
- **Canada-first**: prices in CAD, cash-rounding tooltip on penny deals, GST/HST/PST examples per
  province, postal code *or* bare FSA accepted everywhere, distances in km, Scanner Price Accuracy Code
  integrated as "know your rights".

## Repo map

```
app/                  routes (see spec §5 — all implemented) + components
lib/core/             pure business logic (tested)
lib/db/               Drizzle schema + client
lib/data/             read model, queries, mutations, URL-filter parsing
lib/demo/             seed data (retailers/decoder, stores, deals, FSA centroids, community)
lib/content/          10 guide articles, glossary, FAQ
lib/email/            Resend sender + 4 HTML templates
scripts/              db seed + store CSV importer
tests/                Vitest unit tests (50)
```

## Legal posture

Community-reported prices, no retailer affiliation, stores may refuse penny sales — disclaimed in the
global footer, deal pages, terms, and a dedicated disclaimer page. Privacy policy is written to PIPEDA.
Prohibited content (employee-only internal data, tag-swapping, theft encouragement) is an instant ban,
enforced in the terms, the report form, moderation tooling, and the guides themselves.
