# TrueSharpe — Project Handoff & Master Document

> **What this is:** the single source of truth for the TrueSharpe project. It
> describes what the product is, everything that was built, how it all fits
> together, how to run and deploy it, what's live, what's pending, and how we're
> trying to market it. If you're picking this project up cold, read this top to
> bottom and you'll know everything.

**Live domain:** truesharpe.com
**Repository scope:** `haidar-boop/awES`
**Owner:** bigmoehaidar@gmail.com
**Last updated:** 2026-07-01

---

## Table of contents

1. [The one-paragraph pitch](#1-the-one-paragraph-pitch)
2. [What problem it solves](#2-what-problem-it-solves)
3. [How a user actually experiences it](#3-how-a-user-actually-experiences-it)
4. [The business model (free vs Pro)](#4-the-business-model-free-vs-pro)
5. [Everything the product does — full feature list](#5-everything-the-product-does--full-feature-list)
6. [The technology, plainly explained](#6-the-technology-plainly-explained)
7. [Architecture & how the pieces connect](#7-architecture--how-the-pieces-connect)
8. [The codebase, file by file](#8-the-codebase-file-by-file)
9. [Accounts, sign-in, and how Pro is unlocked](#9-accounts-sign-in-and-how-pro-is-unlocked)
10. [Payments](#10-payments)
11. [Deployment & environment](#11-deployment--environment)
12. [Testing & quality](#12-testing--quality)
13. [The redesign ("Instrument-Grade Diagnostics")](#13-the-redesign-instrument-grade-diagnostics)
14. [Everything we fixed in this work session](#14-everything-we-fixed-in-this-work-session)
15. [Marketing plan & where it stands](#15-marketing-plan--where-it-stands)
16. [Known gaps & recommended next steps](#16-known-gaps--recommended-next-steps)
17. [Glossary of the stats](#17-glossary-of-the-stats)

---

## 1. The one-paragraph pitch

TrueSharpe is an honesty-branded web app for traders. You paste the return
history of a trading strategy (the output of a backtest), and it tells you —
statistically — whether the "edge" is **real and likely to survive live
trading**, or whether it's **overfit** to the past and likely to fall apart.
It is a *reality check*, not a prediction engine. Every result is a diagnostic
("did this survive scrutiny?"), never a forecast of profit. The free tier gives
you a headline verdict; Pro unlocks the entire diagnostic suite — every
statistic, chart, robustness test, and a prioritized action plan.

---

## 2. What problem it solves

Almost every backtest looks amazing, because people tune their strategy until it
looks amazing. That process — trying many variations and keeping the best one —
is exactly what produces **overfitting**: a strategy that fits the past
perfectly and predicts the future terribly. Retail traders have no easy way to
tell the difference between a genuine edge and curve-fitted luck.

TrueSharpe automates the professional-grade checks a quant fund would run:
data-mining adjustments, out-of-sample degradation, Monte Carlo simulation,
random-strategy benchmarking, and more. It turns "this backtest looks great"
into "here is the statistical probability that this edge is real."

The brand is built entirely on **honesty**. It never promises profit. It
repeatedly states it is statistical evaluation only, not financial advice. That
positioning is the product's main competitive moat and marketing angle.

---

## 3. How a user actually experiences it

1. **Lands on the site** (truesharpe.com). Sees a "secure access" gate — a
   first-impression screen with sign-up options. This is a *visual* gate only;
   it never blocks the free tool. They can continue as a guest.
2. **Goes to "Analyze a strategy."** Pastes their returns or equity curve, tells
   it the data frequency and how many variations they tested, and optionally
   pastes a benchmark series.
3. **Gets a verdict** — a clear "Holds up" / "Caution" / "Likely overfit" /
   "Inconclusive" call, shown on a gauge, with the top reasons.
4. **Free users hit a wall** here: they see the headline verdict, then a card
   that says "the full report is Pro."
5. **Pro users see everything** — the complete metrics table, every chart, all
   robustness tests, and a prioritized Validation Plan of next steps read off
   their own results. They can also compare strategies, build portfolios, get
   Kelly sizing, an AI code review, and download a PDF.

There's also a **built-in sample strategies** demo — anyone (no account) can run
the *full* Pro report on our demo data, so they see exactly what they're buying.

---

## 4. The business model (free vs Pro)

**Decision made:** everything is gated behind Pro. The free tier is a *teaser* —
it shows only the verdict on your own data, plus the full report on sample data.

- **Free** = the headline verdict on any analysis you run. Nothing else.
- **Pro** = the entire diagnostic suite (listed below), a one-time purchase (not
  a subscription).

**Critical implementation detail:** gating is enforced **server-side**. For free
users, the Pro data is never even sent to the browser — the API redacts
everything except `meta`, `verdict`, and `gating` before responding. So nothing
can be unlocked by inspecting the page or the network tab. This is handled by
`_redact_for_free` in `analysis.py` and the `PAID_FEATURES` list.

**Owner access:** bigmoehaidar@gmail.com is hard-coded as comp'd Pro (plus any
addresses in the `PRO_EMAILS` env var). This is safe because Pro still requires a
*verified* account — only someone who controls the inbox can activate it.

---

## 5. Everything the product does — full feature list

Grouped the way the /pro page presents them.

### The report & plain-English guidance
- **Prioritized Validation Plan** *(the flagship Pro feature)* — specific next
  steps read off your own results, ranked critical → important → minor, plus
  what's already a strength.
- **Complete metrics table** — total return, CAGR, annualized volatility,
  Sharpe (per-period and annualized), an autocorrelation-adjusted Sharpe,
  Sortino, Calmar, max drawdown, average drawdown, longest drawdown, and mean
  return.
- **Probabilistic Sharpe Ratio (PSR)** and **minimum track-record length** — how
  confident we are the Sharpe is above zero, and how long you'd need to trade to
  trust it.
- **Charts** — equity curve, drawdown, return distribution, rolling Sharpe.
- **Plain-English explanation** of every check, beginner to quant.

### Overfitting & data-mining tests
- **Deflated Sharpe Ratio (DSR)** + **Sharpe haircut** — discounts your Sharpe
  for how many variations you tried.
- **Backtest-overfit probability (PBO)** — how often the in-sample edge
  disappears out-of-sample (combinatorial sub-period splits).
- **Out-of-sample degradation** + **multi-window walk-forward** consistency.
- **Vs. Random** — races your strategy against 1,000 zero-edge random strategies
  and reports how many it beat.

### Simulation & risk
- **Monte Carlo simulation** (2,000 bootstrap resamples) with an outcome cone.
- **Risk of ruin** — probability of a deep drawdown, read off the Monte Carlo
  paths.
- **Missed-trade robustness** — does the edge survive if you randomly skip
  trades/periods?

### Concentration & drawdowns
- **Trade-dependency** — does removing your few best trades wipe out the edge?
- **Drawdown recovery** — time underwater and whether it recovered.
- **Returns-over-time heatmap** — is the edge steady or lumpy?

### Multi-strategy & tools
- **Compare** two strategies side by side.
- **Portfolio** — combine up to six strategies with a correlation matrix.
- **Kelly position sizing** — growth-optimal and safer fractional sizings.
- **AI strategy code review** — paste your strategy code and get structural
  flaws the numbers alone can't catch (uses Claude via `ANTHROPIC_API_KEY`).
- **Downloadable PDF report** + **saved analysis history**.

### Data import
- Paste returns or an equity curve in multiple formats/frequencies.
- **Broker statement import** (`statement_import.py`) — parse an uploaded
  statement into returns.
- **Benchmark series** — optionally supply a real benchmark (e.g. buy-and-hold)
  for an honest comparison. *(If omitted, the app compares against a flat 0%
  "cash" line and now labels it as cash, not buy-and-hold — see §14.)*

---

## 6. The technology, plainly explained

Two halves that ship as **one deployed service**:

- **Backend (the brains):** Python with **FastAPI**. All the statistics are pure
  **NumPy/SciPy** — no black-box ML, just well-understood math. Each test is its
  own small module. FastAPI also serves the website itself.
- **Frontend (what you see):** **React 18** built with **Vite**, styled with
  **Tailwind CSS**. Charts use **Recharts**. The sign-in system uses
  **Supabase**.

The built frontend (`frontend/dist`) is **committed to the repo**, so the deploy
doesn't need a Node build step — the Python server just serves the pre-built
files. This is why the site can run as a single cheap service.

---

## 7. Architecture & how the pieces connect

```
Browser (React SPA)
   │   pastes returns, clicks "Run analysis"
   ▼
POST /api/analyze  ──►  FastAPI (backend/main.py)
   │                       │
   │                       ├─ parsing.py        (turn pasted text into numbers)
   │                       ├─ analysis.run_analysis()
   │                       │     └─ calls every engine/*.py module
   │                       ├─ verdict (engine/verdict.py) built from the results
   │                       ├─ tier check: is this user Pro?
   │                       │     └─ payments.email_has_pro(email)
   │                       └─ _redact_for_free() if not Pro
   ▼
JSON response  ──►  React renders VerdictCard + (Pro) all the feature cards,
                    or VerdictTeaser + the paywall (free)
```

- **Auth** rides alongside: the browser signs in with Supabase, gets a token,
  and sends it on API calls. `/api/auth/me` resolves identity + Pro status.
- **Payments** are verified out-of-band via webhooks and provider APIs; Pro is
  "a verified account whose email has paid (or is comp'd)."

---

## 8. The codebase, file by file

### Backend (`backend/`)
| File | What it does |
|---|---|
| `main.py` | FastAPI app: all API routes, static SPA serving, tier resolution, webhooks. |
| `analysis.py` | Orchestrator. `run_analysis()` calls every engine module, builds charts/explanations, and redacts for free users. Defines `PAID_FEATURES`. |
| `parsing.py` | Turns pasted text / CSV / equity curves into a clean returns array. |
| `statement_import.py` | Parses uploaded broker statements. |
| `sample_data.py` | The built-in demo strategies. |
| `auth.py` | Supabase token verification, identity resolution. |
| `payments.py` | Webhook signature checks (Stripe + Lemon Squeezy), license issuing, and `email_has_pro()` — the source of truth for Pro. Owner allowlist lives here. |
| `licensing.py` | Signed license-key minting/validation (stateless keys). |
| `ai_analyzer.py` | The AI strategy code review (calls Anthropic). |
| `report.py` | Generates the downloadable PDF (reportlab + matplotlib). |

### Engine (`backend/engine/`) — one pure module per test
`stats.py` (core metrics), `sharpe.py` (PSR/DSR/haircut/MTRL),
`distribution.py` (skew/kurtosis), `overfit.py` (split-sample + PBO),
`benchmark.py` (vs benchmark/cash), `verdict.py` (turns everything into the
verdict), `dependency.py` (trade-dependency), `drawdowns.py`, `heatmap.py`,
`walkforward.py`, `montecarlo.py`, `ruin.py`, `skiptrades.py`, `vsrandom.py`,
`kelly.py`, `portfolio.py`, `plan.py` (the Validation Plan).

### Frontend (`frontend/src/`)
- **`pages/`** — `Landing`, `Analyze`, `Compare`, `Portfolio`, `History`,
  `Pro`, `Results`.
- **`components/`** — the feature cards (`VerdictCard`, `VerdictGauge`,
  `ValidationPlanCard`, `VsRandomCard`, `RiskOfRuinCard`, `KellyCard`,
  `TradeDependencyCard`, `SkipTradesCard`, `WalkForwardCard`,
  `DrawdownRecoveryCard`, `ReturnsHeatmap`, `CorrelationMatrix`,
  `MetricRow`), the paywall (`VerdictTeaser`, `LockedCard`), auth
  (`AccessGate`, `AuthModal`, `SocialAuthButtons`), and UX (`Layout`,
  `Tooltip`, `TruthCollapse`, `ShareCard`, `SaveButton`,
  `StrategyCodeAnalyzer`), plus `charts/`.
- **`lib/`** — `api.js` (calls the backend), `auth.jsx` (Supabase auth
  context), `store.jsx` (analysis state), `saved.js` (history), `format.js`.

### Other
- `supabase/saved_analyses.sql` — the Row-Level-Security migration for saved
  history (already run).
- `render.yaml`, `Procfile` — deployment config.
- `frontend/public/favicon.svg` — the brand favicon.

---

## 9. Accounts, sign-in, and how Pro is unlocked

- **Sign-in options:** Google, GitHub, and email/password — all via Supabase.
  (Apple was considered and dropped for now.)
- **Two auth surfaces:**
  - The **AccessGate** — the first-impression "secure access" screen. Visual
    only; "continue as guest" always works.
  - The **AuthModal** — the real sign-in / verify / pay flow, reachable from the
    header and the paywall. It's a proper overlay with a close (X) button, and
    (as of this session) it's rendered through a React portal so it can never be
    trapped off-screen.
- **Pro = verified account whose email has paid or is comp'd.** Resolved in
  `/api/auth/me` as `verified AND email_has_pro(email)`.
- **Owner activation:** the owner must create a Supabase account with
  bigmoehaidar@gmail.com and verify the email; Pro then activates automatically
  because that address is on the comp allowlist.

---

## 10. Payments

- **Provider:** Stripe (live), with Lemon Squeezy also supported in code.
- **One-time purchase**, not a subscription. Price shown from `PRICE_LABEL`
  (was CA$18.99).
- **How Pro is verified (`email_has_pro`)**, in order:
  1. Owner/comp allowlist (`PRO_EMAILS` + the owner's email).
  2. Local license store (fast, from webhooks).
  3. Lemon Squeezy API (durable).
  4. Stripe API — scans recent Checkout Sessions for a paid one matching the
     email (durable, survives server restarts, no webhook required).
- **Webhooks:** `/api/webhooks/stripe` and `/api/webhooks/lemonsqueezy`, both
  signature-verified.

---

## 11. Deployment & environment

- **Host:** Render, one free web service (`render.yaml`).
- **Deploy branch:** `claude/new-session-6nsvex` — **this is the branch Render
  builds.** The designated dev branch `claude/truesharpe-redesign-decision-d0ou4g`
  is kept in sync with it on every commit. (Both are force-updated to the same
  commit each push.)
- **Build:** `pip install -r backend/requirements.txt` (no Node step — dist is
  committed). **Start:** `cd backend && uvicorn main:app`.
- **Python:** 3.11.9.

### Environment variables
| Var | Purpose |
|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Auth. |
| `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe payments + webhook. |
| `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_WEBHOOK_SECRET` | Lemon Squeezy (optional alt provider). |
| `CHECKOUT_URL`, `CHECKOUT_EMAIL_PARAM`, `PRICE_LABEL` | The hosted checkout link + display. |
| `PRO_EMAILS` | Extra comp'd Pro addresses (comma-separated). |
| `ANTHROPIC_API_KEY`, `AI_MODEL`, `AI_DAILY_LIMIT` | AI code review. |
| `LICENSE_SECRET`, `LICENSE_KEYS`, `LICENSE_REVOKED` | License key signing/allow/deny. |
| `ADMIN_TOKEN` | Protects `/api/admin/grant`. |

### Local development
```bash
# backend
cd backend && python3 -m uvicorn main:app --host 127.0.0.1 --port 8000
# frontend (dev)
cd frontend && npm install && npm run dev
# build the committed dist
cd frontend && npm run build
```

---

## 12. Testing & quality

- **Backend:** 138 pytest tests (`backend/tests/`), all passing. Run with
  `cd backend && python3 -m pytest -q`.
- **Frontend/UI:** verified with Playwright (headless Chromium) — guest flow,
  all routes render, the auth modal lands in-viewport, verdict runs end-to-end.
- **Discipline:** the agreement is to **test everything roughly every two
  weeks** and before shipping each new feature.

---

## 13. The redesign ("Instrument-Grade Diagnostics")

The whole UI was redesigned into a **graphite terminal / measuring-instrument**
aesthetic:
- Dark "ink" graphite surfaces, monospace labels, tabular numbers.
- A strict semantic color system used **only** for verdict logic:
  robust `#3FB68B` (green), caution `#D9A441` (amber), overfit `#E5534B` (red),
  plus a data-blue accent `#58A6FF` for charts/interactions only.
- A **verdict gauge**, a **"Truth Collapse"** animation (inflated numbers
  visibly deflating to their honest value), and a system-unlock reveal on entry.
- All emoji removed; IBM Plex Sans/Mono typography.
- Design tokens live in `frontend/tailwind.config.js`.

---

## 14. Everything we fixed in this work session

1. **Auth modal trapped off-screen (major).** The unlock-reveal animation left an
   invisible identity transform on its wrapper, which (per CSS rules) made it the
   anchor for the modal's fixed positioning. On long pages the modal rendered far
   below the fold, so clicking "Sign in" only dimmed the screen. **Fixed** by (a)
   rendering the AuthModal through a React portal to `document.body` so no
   ancestor can trap it, and (b) dropping the animation class once the reveal
   finishes. Verified on a phone viewport.
2. **Removed `/api/debug/stripe`.** This endpoint reported anyone's payment
   status by email with **no authentication**. Deleted.
3. **Added a favicon.** SVG brand mark (the plot-line-into-checkmark), linked
   from `index.html`, served correctly as `image/svg+xml`.
4. **Fixed the "buy-and-hold" mislabel.** When no benchmark is supplied, the app
   compares against a flat 0% line — but the verdict, Validation Plan, and
   benchmark card all called that "buy-and-hold," which overstates the result
   (beating cash ≠ beating buy-and-hold). Now labeled **"cash (0%)"** unless a
   real benchmark is provided. This protects the honesty brand.

All changes committed and pushed to both branches; 138 tests green.

---

## 15. Marketing plan & where it stands

### The core insight
The product's verdict is inherently provocative ("your edge is probably fake"),
so the best marketing is **turning the verdict into shareable content** rather
than buying ads.

### The "Backtest Autopsy" series (the main play)
Take strategies everyone argues about (golden cross, RSI mean-reversion, MACD,
Bollinger bounce, etc.), run them through TrueSharpe on **real data**, and
publish the honest verdicts.

- **First autopsy is done:** the **Golden Cross** on 25 years of real SPY data,
  run live through the app. Result: it returned +656% vs +678% for just holding
  SPY — i.e. **it lost to doing nothing**; its only value was cutting the worst
  drawdown from -55% to -34%. Verdict: *inconclusive* (beats random, doesn't
  beat the benchmark). We have the full post text and a verdict screenshot ready.
- The pipeline is repeatable: real prices → strategy → the engine → verdict →
  screenshot.

### Channel decision
- **Reddit is out** — the owner's posts get auto-removed as self-promo.
- **New direction: short-form video** (TikTok + Instagram Reels + YouTube Shorts,
  same clip cross-posted), with the **link in bio, never in the post** (this is
  what avoids removal). The autopsy format works great as a 30-second video.
- Also viable later: Twitter/X fintwit threads.

### Budget reality
- The owner has **$50**. Honest guidance given: $50 in Meta/Google ads is too
  little to optimize and mostly wasted. Better plan: post ~10-15 free videos,
  find the one that pops, then put the $50 behind that proven winner.

### Open marketing to-dos
- Pick a handle (e.g. @truesharpe or @backtestreality).
- Produce a vertical 9:16 verdict graphic for Reels/TikTok/Shorts.
- Batch of 5 hooks/scripts for a week of content.
- Generate the next autopsies (RSI mean-reversion likely fails harder — spicier).

---

## 16. Known gaps & recommended next steps

**Product / launch polish (parked "nice-to-haves"):**
- Terms of Service + Privacy Policy pages.
- A public **methodology / "How it works"** page (doubles as SEO and buyer
  trust) — recommended next build.
- FAQ, a free-vs-Pro comparison table, a glossary.
- OG / social-share meta image and tags.
- Shareable permalink for a result, changelog, contact/refund page.
- Basic analytics.

**Operational:**
- Owner still needs to finish the Stripe payout/setup (in progress) and create
  the verified Supabase account to activate their own Pro.

**Nothing is a known bug** — the items above are additions, not breakage. The
app is functional, tested, and deployed.

---

## 17. Glossary of the stats

- **Sharpe ratio** — return per unit of risk. Higher is better; ~1 is good.
- **PSR (Probabilistic Sharpe Ratio)** — the probability the *true* Sharpe is
  above zero given your sample. High PSR = the edge is probably real.
- **DSR (Deflated Sharpe Ratio)** — the Sharpe after penalizing for how many
  variations you tried. The core anti-data-mining number.
- **PBO (Probability of Backtest Overfitting)** — how often the best in-sample
  configuration underperforms out-of-sample. High = overfit.
- **Walk-forward** — re-checking the edge across multiple time windows to see if
  it's consistent or just a one-era fluke.
- **Monte Carlo** — resampling your returns thousands of times to map the range
  of outcomes your edge implies.
- **Risk of ruin** — the odds of a catastrophic drawdown across those resamples.
- **Trade-dependency** — how much of the profit rides on a handful of trades.
- **Kelly sizing** — the mathematically growth-optimal bet size (and safer
  fractions of it).
- **Min track-record length** — how long you'd need to trade before the Sharpe
  is statistically trustworthy.

---

*End of handoff. If you read only one section, read §1–§5 (what it is and what it
does) and §14–§16 (current state and what's next).*
