# DECISIONS.md — assumptions and trade-offs

Every material decision made while building PennyRadar Canada from the spec, with rationale. Numbered so
code comments can reference them.

## 1. Demo mode instead of a hard database dependency

The app boots and fully renders with **zero env vars**: without `DATABASE_URL`, the read model serves the
seed modules (`lib/demo/*`) directly, and write endpoints return an explicit `{ demo: true }` 503. Rationale:
the acceptance criteria are dominated by read flows (browse, filter, barcode, SEO); demo mode makes the
whole product reviewable in one `npm run dev` and doubles as the guaranteed-non-empty launch state (spec
§12 "the site never looks empty"). The same seed powers `db:seed`, so demo and seeded-DB behaviour match.

## 2. One in-memory read model for both modes

`lib/data/source.ts` loads all core tables into plain typed records (60s cache per instance in DB mode);
all filtering/sorting/assembly happens in pure TS (`lib/data/queries.ts`), shared by every page and unit-
testable. At launch scale (low thousands of deals/stores) this is well within budget and eliminates an
entire class of "SQL path differs from demo path" bugs. Scaling step (documented, not built): push the hot
filters (status, retailer, recency, bounding-box prefilter) into SQL and keep the same function signatures.

## 3. Haversine instead of PostGIS

Radius search uses the haversine formula over store lat/lng (`lib/core/geo.ts`), which the spec explicitly
allows ("PostGIS `ST_DWithin` or Haversine"). Works on any plain Postgres (or in demo mode) with zero
extensions; PostGIS becomes worthwhile only after the national store list (~3k rows) meets heavy traffic.

## 4. FSA centroids: curated seed of ~70, structured for the full ~1,600

A hand-curated table of high-population FSA centroids covering every province/territory ships in
`lib/demo/fsa.ts` (including the acceptance-test FSAs T2P/M5V/V6B, unit-tested against real coordinates)
and seeds the `fsa_centroids` table. Full national coverage is a data-load task, not a code change:
replace/extend the array or bulk-insert a StatCan-derived extract into the same table. Full postal codes
degrade gracefully to their FSA (spec §10.4 allows FSA-level precision).

## 5. Deal detail lives on the item page

The sitemap (spec §5) defines `/item/{upc}` but no separate deal-detail route, so the item page *is* the
deal page: price hero, confidence, votes, barcode modal, all reports across Canada, markdown ladder, tax
note, deep links. Deal cards link there. One canonical URL per product concentrates SEO signal exactly
where the spec wants it ("Is UPC X a penny item in Canada?").

## 6. Confidence decay thresholds

Spec defines the four statuses and says "confidence decays over time" without exact decay numbers. Chosen:
verified holds 14 days from last confirmation, then falls through likely (7-day window) to unconfirmed;
anything unconfirmed for 30+ days is dead (spec-explicit); ≥3 dead votes kill immediately (spec-explicit);
"2 confirmations within 72h" is enforced as *any two confirmations from distinct users within a rolling
72h of each other*. All constants are named exports in `lib/core/confidence.ts` with 12 unit tests.

## 7. Seed store addresses are representative

Store records use real metro coordinates (neighbourhood-accurate) with representative names/addresses so
radius search, maps, and store pages behave realistically. They are intended to be replaced/extended by
the CSV importer (`scripts/import-stores.ts`, with Nominatim geocoding at 1 req/s) rather than treated as
ground truth. Same for sample deals: flagged `is_sample`, badged "Sample data" in the UI, and retired in
one click via admin "Purge sample deals" (spec §12).

## 8. Charts: hand-rolled SVG instead of Recharts

The only launch chart is the price-history step-down ladder. A 40-line SVG component (`PriceLadder`)
renders it with zero client-side JS, which is strictly better for LCP/CWV than shipping Recharts
(~100kB). If Pro-tier chart complexity grows, Recharts can be added behind the Pro flag then.

## 9. Emails: hand-rolled HTML templates via Resend REST

All four spec'd templates (welcome, alert, weekly digest, report-approved) are table-layout HTML with the
copper brand accent, sent through Resend's REST API with a `fetch` (no SDK) and logged to `email_log`.
React Email was skipped: one less build pipeline, and transactional templates of this size are easier to
audit as plain HTML. Without `RESEND_API_KEY`, sends log to console (Resend-sandbox-friendly).

## 10. Articles are version-controlled content, mirrored to DB

The 10 launch guides live in `lib/content/articles-*.ts` (typed, reviewed in PRs, statically rendered with
TOC/FAQ schema/auto-linked glossary terms) and are copied into the `articles` table by the seed script so
the admin editor has rows to work with. Runtime pages read from content files at launch — deliberate: SEO
pages become fully static, and editorial changes go through review. Flipping guides to DB-first is a
one-function change in `app/guides/[slug]/page.tsx`.

## 11. i18n: en-CA shipped, fr-CA scaffolded structurally

`hreflang` alternates and `lang="en-CA"` are in place. Full next-intl wiring was deliberately deferred: the
App Router `[locale]` segment restructure doubles route complexity for a Phase-2 market (spec calls Quebec
Phase 2). All user-facing strings live in components/content modules, so the mechanical extraction into
next-intl message catalogs has no architectural blockers.

## 12. Admin: moderation-grade now, form-based CRUD later

Fully functional: dashboard analytics, moderation queue (approve/reject with logged reasons), feature/
unfeature and mark-dead on deals, trust/ban users, purge samples — everything with server-side role gates
and a moderation log. Retailer/store/article *editing forms* are read-only listings plus documented
data-path (seed script, CSV importer, SQL) in this release; the write APIs and schema they'd sit on are
already built. This was the right cut: moderation is the launch-critical loop, CRUD forms are convenience.

## 13. Duplicate detection scope

Dedupe (same normalized UPC + same store within 7 days) merges the new report into the existing deal as a
confirmation — including restoring a dropped leading zero (11-digit UPC input). Reports at a *different*
store attach to the same item's active deal (that's what makes province chips and "reported at N stores"
work), while a report on an item whose only deal is dead starts a fresh deal.

## 14. Rate limiting

Upstash Redis REST when configured (sliding window via pipelined ZSET ops, no SDK), in-memory fallback
otherwise, failing open on Redis errors — availability beats strictness for a community site. New-account
report limit is the spec'd 10/day; votes 60/h; comments 30/h; email signup 5/h/IP.

## 15. Pro early-access window

`isEarlyAccess()` (15 min from verification, `lib/stripe.ts`) is the gate; the feed applies it when
subscriptions exist. Free users see the deal after the window rather than a teaser row — simpler, and
avoids advertising a deal users can't open (dark-pattern smell). CSV export and price-history depth are
similarly gated at the query layer.

## 16. Receipt claims require a receipt photo

"Did you purchase it?" only sets `has_receipt` (auto-verify + badge weight) when a receipt photo
accompanies the claim. An unverifiable checkbox that instantly verifies deals would be the obvious abuse
vector for fabricated listings.

## 17. Photo uploads

Client compresses (the form is wired for it) and uploads to Supabase Storage; the reports API accepts
`photos[]` as URL + kind + alt text (alt required — WCAG). In demo mode files are skipped with a notice.
The direct-to-Storage signed-upload flow needs project credentials, so the form degrades gracefully
without them.

## 18. Analytics

Plausible via a single script tag when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set (cookieless, PIPEDA-easy).
KPI events (signup, report submitted/approved, confirmation, alert created, Pro conversion) are emitted
from their server-side code paths — the admin dashboard computes the same funnel numbers from the
database, which is the source of truth regardless of analytics vendor.

## 19. Comments are plain text

User comments render as text, never markdown/HTML — the profanity filter plus 3-flag auto-hide covers
moderation, and rendering UGC as text closes the XSS surface entirely. Site-authored markdown (guides,
retailer notes) renders through `marked` server-side only.

## 20. Fonts and Lighthouse

System font stack with Inter preferred (no `next/font` download at build): zero font-transfer cost, no
FOIT, and the deal feed ships almost no client JS (server components; the interactive DealCard is the
exception and shares one small bundle). This is the CWV-conservative choice for the ≥90 mobile targets.

## 21. Local mode (single-user tier)

Without `DATABASE_URL`, the app is a personal install, not a crippled demo: `getSessionUser()` returns a
synthetic owner (trusted + admin), and reports/votes/watchlist persist to `.data/local-store.json` via
`lib/local/store.ts`, reusing the same dedupe and type shapes as the DB pipeline so the read model merges
local finds seamlessly over the seed data. JSON-file over SQLite: zero native dependencies, human-readable,
trivially backed up, and single-user write volume never needs more. Consequence to know: a *hosted*
deployment without a DB would let any visitor write to that file — local mode is for personal machines;
public deployments should set `DATABASE_URL`.

## 22. Barcode scanning engine choice

Native `BarcodeDetector` first (Chrome/Edge/Android — hardware-accelerated, zero bytes shipped), ZXing
(`@zxing/browser`) as a dynamic import only on browsers without it (iOS Safari). Reads are ignored until a
check-digit-valid UPC appears, which filters partial/false decodes without user-visible errors.

## 23. Scout tracker is local-only in every mode

Scout entries (tag + clearance date → 98-day penny-watch alarm) are personal scouting notes, not community
data — publishing "this will penny on Oct 12 at store X" would get stock pulled. So they stay in the local
store even when a database is configured. The 98-day constant is exported (`PENNY_WATCH_DAYS`) and the UI
repeats the caveat that 14 weeks is a heuristic.

## 24. Service worker scope

Hand-written `public/sw.js` (no Workbox): cache-first for immutable `/_next/static` assets, network-first
with cache fallback for page navigations, `/offline` as last resort, and **no caching of `/api/*`** —
stale prices are worse than no prices. Registered only in production builds.
