# TrueSharpe — Master Redesign Prompt (v3, "Spatial Instrument — Full Specification")

> This is a complete, self-contained build specification. Paste it whole into any
> build agent (Claude Code / Cursor / v0). It supersedes v2. The color system is
> locked byte-for-byte; everything else — type, layout, components, motion,
> states, copy voice — is specified below to the class level. Where v2 gave
> direction, v3 gives recipes. Follow it literally; deviate only where a rule
> conflicts with a working feature, and say so when you do.

---

## 0. ROLE, MINDSET, AND THE ONE-LINE DESIGN READ

You are acting as a principal design engineer shipping a $150k-agency-tier
surface. You are not decorating a template; you are machining an instrument.

**Design read (declare this before generating anything):**
*"Reading this as: a premium prosumer fintech product for quantitatively-literate,
design-conscious traders, with a cinematic 'spatial instrument' language —
Linear/Vercel structural rigor × Awwwards depth and motion — leaning toward
Tailwind v3 utilities + IntersectionObserver choreography + CSS-spring easings,
double-bezel hardware components, and a single data-blue accent on graphite."*

**The three dials (gate every decision through them):**
- `DESIGN_VARIANCE: 8` — asymmetric bento, editorial splits, zig-zags. Never a
  centered stack of equal cards. Symmetry is allowed only inside data tables.
- `MOTION_INTENSITY: 7` — physics, staggering, de-blur reveals; but every motion
  carries meaning (a measurement settling, a plate seating). Zero idle loops
  except the scan line on active loading.
- `VISUAL_DENSITY: 4` on marketing surfaces; `6` on the Results dashboard;
  `5` on the Analyze console. Density changes by surface, not by whim.

**The product's soul, which the design must dramatize:** honesty. The site's
single recurring visual metaphor is *an inflated number collapsing to its true
value under measurement*. Every surface should feel like a calibrated device
that cannot be flattered.

---

## 1. LOCKED COLOR SYSTEM (byte-for-byte; includes a usage matrix)

```
/* Graphite surfaces (cool-tinted; NEVER pure black) */
--ink-base:     #0D1117;   /* page ground */
--ink-deep:     #10141A;   /* recessed wells, input slots */
--ink-panel:    #161B22;   /* plate inner core */
--ink-elevated: #1C232C;   /* raised chips, icon trays, hover fills */
--ink-edge:     #262D38;   /* hairlines, rings, bezel strokes */
--ink-line:     #1d242d;   /* sub-hairline dividers inside plates */

/* Text */
--txt:        #E6EDF3;     /* primary */
--txt-muted:  #8B97A6;     /* secondary, body on graphite */
--txt-faint:  #5c6775;     /* tertiary, eyebrows, fine print */

/* Verdict semantics — LOGIC ONLY */
--robust:  #3FB68B;  --caution: #D9A441;  --overfit: #E5534B;

/* The single interactive accent */
--data: #58A6FF;
```

**Usage matrix (memorize; audit against it):**

| Element | Allowed colors |
|---|---|
| Primary CTA fill | `data` only, text `ink-base` |
| Links, focus rings, active tabs | `data` |
| Chart primary series, axes highlights | `data`; grid lines `ink-edge` |
| Verdict label / gauge needle / verdict chips | the matching semantic color only |
| Plan severity dots | overfit=critical, caution=important, txt-faint=minor, robust=strength |
| Pro badge | `robust` tint (it means "entitlement verified", a logic state) |
| Decorative glows / mesh orbs | `data` at ≤12% alpha, `robust` at ≤7% alpha; never caution/overfit |
| Everything else | ink scale + txt scale |

**Shadow & light physics:**
- Drop shadows are cool graphite, never black:
  `plate: 0 24px 60px -20px rgba(3,7,14,0.7)`;
  `plate-lg: 0 40px 90px -28px rgba(3,7,14,0.8)`.
- Every glass core catches light on its top edge:
  `inset 0 1px 0 rgba(255,255,255,0.05)` (0.06 inside a bezel).
- The only glow in the system: `glow: 0 0 0 1px rgba(88,166,255,0.25),
  0 14px 44px -14px rgba(88,166,255,0.5)` — reserved for the primary CTA and a
  *live* verdict gauge. Nothing else glows, ever.
- One light source, from above. No upward shadows, no ambient occlusion fakery.

**Atmosphere (already the shipped recipe — keep):**
- Body background: `radial-gradient(46rem 40rem at 82% -8%, rgba(88,166,255,0.10), transparent 60%)`,
  `radial-gradient(40rem 36rem at 6% 6%, rgba(63,182,139,0.06), transparent 62%)`,
  over `linear-gradient(180deg,#10141A 0%,#0D1117 34%)`, `background-attachment: fixed`.
- Film grain: fixed `body::after`, inline-SVG `feTurbulence` tile, `opacity 0.035`,
  `pointer-events-none`, z-index 1; `#root` at z-index 2; modals portal to body at z-50.

---

## 2. TYPOGRAPHY — COMPLETE SCALE

Self-hosted variable fonts via `@fontsource-variable` (already installed):
**Bricolage Grotesque Variable** (display), **Geist Variable** (body/UI),
**Geist Mono Variable** (data). No Google `<link>`. No Inter/Roboto/IBM Plex.

| Token | Face | Classes | Use |
|---|---|---|---|
| Display-1 | Bricolage | `font-display text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tightest leading-[0.95]` | One per site (landing H1) |
| Display-2 | Bricolage | `font-display text-4xl sm:text-5xl font-semibold tracking-tight` | Section H2, closing CTA |
| Title | Bricolage | `font-display text-2xl font-semibold tracking-tight` | Plate titles, big bento tile |
| Subtitle | Bricolage | `font-display text-lg font-semibold tracking-tight` | Small bento tiles, modal H2 |
| Body-lg | Geist | `text-lg leading-relaxed text-txt-muted max-w-[52ch]` | Hero sub, section intros |
| Body | Geist | `text-sm/base leading-relaxed text-txt-muted` | Everything narrative |
| Metric-lg | Geist Mono | `font-mono text-3xl font-semibold tabular-nums tracking-tight text-txt` | Proof strip, headline stats |
| Metric | Geist Mono | `font-mono text-sm tabular-nums` | Table values, chip values |
| Eyebrow | Geist Mono | `font-mono text-[11px] font-medium uppercase tracking-eyebrow text-txt-faint` | `.eyebrow` pill / `.mono-label` |
| Fine print | Geist Mono | `text-[10px] uppercase tracking-eyebrow text-txt-faint` | Provenance lines, footnotes |

Rules:
- `text-wrap: balance` on every Display-1/2. Kill orphans.
- Every numeral on the site is Geist Mono + `tabular-nums` — including inside
  buttons, badges, and prose stats. This is the instrument's voice.
- Headline emphasis = *italic of the same family* (the `lying` move), one word
  max, always the emotionally loaded verb. Descender words get `leading-[1.1]`
  + `pb-1` reserve. Never a second family, never a color change mid-headline
  except the single `text-data` italic word.
- Weights: 400/500/600 only (variable axis). 700+ is banned — Bricolage at 600
  already carries display weight; 700 tips it into shouting.

---

## 3. SPACE, GRID, RADIUS — THE PHYSICAL CONSTANTS

- Page container: `max-w-[1400px] mx-auto px-5 sm:px-6`. Nav container:
  `max-w-[1180px]` (the pill floats narrower than content — deliberate).
- Section rhythm: `space-y-28 md:space-y-40` between landing sections; interior
  plate padding `p-6` (small), `p-7 sm:p-9` (bezel cores), `p-8` (hero tiles).
- Radii ladder (concentric math, never uniform):
  `bezel 1.75rem` outer shell → `core 1.375rem` seated core → `rounded-xl`
  wells/chips inside cores → `rounded-full` pills/buttons/nav. An element's
  radius must always be smaller than its parent's by roughly its inset.
- Hairlines: `ring-1 ring-ink-edge` on every plate; interior dividers
  `divide-ink-edge/70` or `border-ink-line`. Never `border-gray-*`.
- Grid only (`grid grid-cols-* gap-5`); flex is for single-axis rows. Any
  `w-[calc(...)]` column math is a defect.
- Full-height sections: `min-h-[100dvh]`, never `h-screen`.

---

## 4. COMPONENT RECIPES (exact, with states)

### 4.1 Plates
- `.card` — single-element glass core: `rounded-core bg-ink-panel ring-1
  ring-ink-edge` + core highlight + plate shadow. Workhorse.
- `.bezel` > `.bezel-core` — true double-bezel for *hero objects only* (gauge
  plate, autopsy comparison, analyze console, auth modal, verdict hero). If
  everything is a bezel, nothing is. Budget: ≤2 bezels visible per viewport.
- Hover (interactive plates only): `hover:ring-txt-faint/40` +
  `hover:-translate-y-0.5`, `duration-500 ease-spatial`. No scale, no glow.

### 4.2 Buttons
- `.btn-primary` — data pill, `px-6 py-3`, glow shadow, `active:scale-[0.98]`.
  With trailing action: text + `.btn-nib` (a `h-7 w-7 rounded-full bg-ink-base/15`
  circle holding `ArrowUpRight` 16 bold) flush right (`pl-6 pr-2.5`). On
  group-hover the nib translates `(2px,-1px)`; the arrow never sits naked.
- `.btn-ghost` — hairline pill on `ink-elevated/50`; hover raises fill and
  brightens ring. Never carries the glow.
- Text-link action: mono eyebrow in `text-data`, `hover:text-txt`, with
  `ArrowRight` 13 bold that translates x+2 on hover.
- Disabled: `opacity-50`, no hover motion, cursor-not-allowed. Loading: swap
  label for `…` or a 3-dot mono pulse — never a spinner glyph.

### 4.3 Wells (inputs)
`.input` — recessed slot: `bg-ink-deep rounded-xl ring-1 ring-ink-edge` +
double inset shadow (top light line + inner depth), focus `ring-2 ring-data/60`.
Textareas for data paste get `font-mono text-xs leading-relaxed` and a
mono placeholder showing a real 6-line sample. Selects/steppers match wells.
Labels are `.label` (mono eyebrow). Error state: `ring-overfit/50` + one mono
sentence in `text-overfit` below — never a toast.

### 4.4 Chips & badges
- Eyebrow pill `.eyebrow`: `rounded-full bg-ink-elevated px-3 py-1 ring-1
  ring-ink-edge` + mono micro-type, optional 1.5px `data` dot.
- Verdict chip: `rounded-full px-2.5 py-1 ring-1` in the semantic tint —
  e.g. caution: `bg-caution/10 ring-caution/30 text-caution`, mono 10px.
- Stat chip (plan tiers, autopsy stats): `rounded-lg bg-ink-deep px-3 py-2
  ring-1 ring-ink-edge` with severity dot + mono label.
- Pro badge (nav): robust tint pill with a live dot.

### 4.5 Iconography
`@phosphor-icons/react`, weight **light** for feature/illustrative icons in
icon trays (`h-11 w-11 rounded-xl bg-ink-elevated ring-1 ring-ink-edge
text-data`), weight **bold** only for ≤16px functional glyphs (arrows, close,
hamburger). One family, no lucide, no hand-rolled SVGs — the only exception is
the brand Mark (plotted line resolving into a checkmark), which is a logo, not
an icon. No emoji anywhere in the UI.

### 4.6 The Verdict Gauge (signature component)
Three-zone arc (overfit→caution→robust), graphite ticks, needle in the
verdict's semantic color, hub ring on `ink-base`. On mount the needle sweeps
from center to its zone over ~1100ms `cubic-bezier(0.22,1,0.36,1)` — a
measurement settling, not a bounce. In a *live* context (hero, fresh result)
its plate may carry the glow. Reuse the existing `VerdictGauge`; never rebuild.

### 4.7 Charts (Recharts, styled to the instrument)
- Primary series: `data` 1.5–2px line; area fills `data` at 8–12% alpha.
- Comparison/benchmark series: `txt-faint`, dashed `4 4`.
- Semantic overlays (drawdown shading, MC cone bands): the semantic color at
  ≤15% alpha. Cone: robust-tinted center band, caution mid, overfit outer.
- Grid: `ink-edge` at 40%, horizontal only. Axis ticks: Geist Mono 11px
  `txt-faint`. No axis lines, no legends when one series — label in the plate
  header instead. Tooltip: `ink-elevated` plate, mono 12px (already themed).
- Every chart sits inside a plate with a `.mono-label` header row:
  label left, current value right (mono, tabular).

---

## 5. MOTION SPECIFICATION (timing table)

Global easing `ease-spatial = cubic-bezier(0.32,0.72,0,1)`. Animate only
transform/opacity/filter. IntersectionObserver via the existing `Reveal`
component — never scroll listeners. All of it collapses under
`prefers-reduced-motion` (already globally enforced).

| Event | Motion | Duration / delay |
|---|---|---|
| Section enters viewport | `translateY(18px) + blur(6px) + opacity 0 → rest` | 780ms; siblings stagger 80ms |
| Gauge on mount | needle sweep center → zone | 1100ms settle curve |
| Truth Collapse (numbers) | inflated value counts down to honest value, `translateY(-0.08em)`+opacity resolve | 900ms, mono tabular so digits don't jitter |
| Button hover | nib translate (2,-1), ring/glow brighten | 500ms |
| Button press | `scale(0.98)` | 150ms |
| Plate hover | `-translate-y-0.5`, ring brighten | 500ms |
| Mobile menu open | overlay fade + links fade-up staggered | 60ms base + 60ms/item |
| Modal open | plate `scale(0.98)+blur(4px) → rest`; fields stagger 60/120/180ms | 500ms |
| Loading (analysis running) | scan line sweeping a hairline track + skeleton plates matching the report layout | scan 1.4s linear infinite (the one permitted loop) |
| Route change | none (instant) — the app must feel like switching instrument modes, not a slideshow |

**The signature "Truth Collapse" is mandatory in two places:** the landing hero
plate (a demo stat deflating on load) and every fresh Results render (the
headline Sharpe deflating from its naive to its adjusted value while the needle
sweeps). It is the brand's thesis performed as motion.

---

## 6. PER-SURFACE BLUEPRINTS (section by section, with copy voice)

**Copy voice everywhere:** honest, surgical, a little dry. Short declaratives.
Never hype ("revolutionary", "supercharge"), never hedging mush. Numbers do the
persuading; the UI just refuses to lie. Fine-print provenance lines under any
demo data ("Live example · Golden Cross, 25 yrs SPY").

### 6.1 Landing (order fixed)
1. **Hero — editorial split** `lg:grid-cols-[1.05fr_0.95fr]`. Left: eyebrow
   ("Honest backtest auditing" + data dot), Display-1 *"Your backtest is /
   {italic data}lying{/} to you."*, Body-lg sub naming the two verdict words in
   `text-txt`, primary CTA "Analyze my strategy" + ghost "See a live report",
   mono fine-print reassurance line. Right: **the gauge plate** (bezel) — mono
   header "Reality Check" + caution verdict chip, gauge at zone 0.5, 3-row
   mono dl (Sharpe 0.69 / Beats random 99.8% / Beats buy & hold No) divided by
   `ink-edge/70`, provenance line. A `data` radial bloom sits behind the plate
   at -z. This plate carries the glow.
2. **Proof strip** — 4 cells fused by `gap-px` over `bg-ink-edge/60` (one
   machined slab, not four cards): Metric-lg number + eyebrow label.
   1,000 random strategies raced · 25 yrs stress-tested · 12 checks ·
   **0 promises of profit** (the zero is the punchline; keep it last).
3. **Feature bento** — `md:grid-cols-4`: Validation Plan `col-span-2 row-span-2`
   (icon tray, Title, body, 4 severity chips, mt-auto "See everything in Pro"
   link), Deflated Sharpe `col-span-2` wide, Monte Carlo + Vs. Random
   `col-span-1` each. Icons light-weight in trays. Section header: eyebrow
   "The full instrument" + Display-2 "Every test a quant fund runs, on your
   own data."
4. **Autopsy zig-zag** — text left (eyebrow "Backtest autopsy", Display-2 with
   italic "*undressed.*", the Golden-Cross story in Body, ghost CTA), bezel
   plate right: two recessed comparison wells (Golden Cross +656% vs Just
   holding +678%, each with mono Sharpe/MaxDD rows) + a caution ribbon
   ("Verdict: inconclusive — beats random, not the benchmark."). On the next
   autopsy section (if added) the plate goes on the LEFT — zig-zag means
   alternate.
5. **Closing CTA** — full-width bezel-radius plate, top-center data bloom,
   Display-2 "Find out what your backtest is hiding.", one-line sub
   ("One paste. One verdict. No signup to see it."), primary + ghost pair,
   centered. This is the only centered section on the page.

### 6.2 Analyze — the instrument console (density 5)
A single centered column, `max-w-3xl`. Order: H1 Title + one-line sub →
**import plate** (`.card`: mono header "Import from your platform", body line,
primary "Import statement", mono fine-print of supported formats) → **the
console (bezel)**: mono header "Your strategy data" + right-aligned text-link
"or try sample data →"; the paste well (mono textarea, 10 rows); beneath it a
`grid-cols-2` of machined selects (frequency, value type, scale, data kind) and
the trials stepper with its tooltip; benchmark paste as a collapsed secondary
well ("Benchmark · optional" disclosure). Footer row: ghost "Run sample" +
primary "Run analysis" with nib. On submit: the console's controls dim to 50%,
a scan line sweeps the top hairline of the console, and skeleton plates appear
below in the exact silhouette of the coming report. Errors render as
overfit-tinted mono lines under the offending well.

### 6.3 Results — the diagnostic dashboard (density 6)
1. Header row: Title "Reality Check Report" + mono meta (observations ·
   frequency · trials) left; ghost "New analysis" right.
2. **Verdict hero plate (bezel, full-width)**: gauge left (or top on mobile),
   right column = verdict chip, Display-2 headline in semantic color, summary
   Body, "WHY" as a mono list with `›` markers, warnings as caution-tinted
   mono lines. Headline Sharpe performs the Truth Collapse on first render.
3. **Diagnostics bento** `md:grid-cols-6`, variable spans (equity `span-4`,
   drawdown `span-2`, distribution `span-2`, rolling Sharpe `span-4`, then
   feature plates `span-3`/`span-2` mixed). Every plate: mono-label header
   (metric name left, headline number right), chart or content, one plain-
   English sentence in Body underneath. Variable heights welcome; the grid
   may run ragged — masonry honesty over forced equality.
4. **Free wall**: the redacted report is a real plate layout blurred under a
   *fixed* frosted overlay (`backdrop-blur` on the overlay, never the scroll
   container) with a centered sealed-access card: lock glyph in an icon tray,
   Title "The full report is Pro", 2-col mono feature list, primary "Unlock
   full report" + text-link "See everything in Pro →". It must read as a
   sealed instrument, not a marketing banner.
5. Footer: the disclaimer line, centered, fine-print.

### 6.4 Pro — the spec sheet
Centered header (eyebrow "TrueSharpe Pro", Display-2, one-line sub). Then ONE
bezel plate — the spec sheet: price row at top (Metric-lg "CA$18.99" + eyebrow
"one-time · not a subscription" + primary CTA with nib, hairline below), then
feature groups as mono-labeled sections, each row = robust check glyph
(Phosphor `Check` bold 14, `text-robust` — allowed: entitlement is logic) +
Body text, rows aligned to a shared baseline grid. Beneath the sheet: a
recessed `ink-deep` well "Free always includes…" and the centered fine-print
disclaimer. If the visitor is already Pro, the price row swaps for a robust
ribbon ("You're Pro — every analysis unlocks the full report.").

### 6.5 Auth modal — sealed access (portaled to body, z-50)
Overlay `bg-black/70 backdrop-blur-sm` (fixed). The plate: bezel, `max-w-lg`,
close X in a nested `ink-elevated` circle top-right. Content order: Title
"Unlock the full report", one-line sub, 4-item mono-dot feature list, social
ghost buttons (Google, GitHub) full-width, "or continue with email" hairline
divider (mono), segmented mono toggle Create account / Log in, two wells,
primary submit. Stage variants (verify / pay / pro) keep the same plate and
swap only the content block; the pay stage shows the price CTA + a robust
polling line; the pro stage shows a robust ribbon. Fields stagger-reveal on
open. Scroll-safe: `overflow-y-auto` on the overlay, `my-auto` on the plate.

### 6.6 Compare / Portfolio / History (inherit + align)
These inherit the primitives. Enforce: consoles follow 6.2's grammar (wells in
plates, mono labels); result columns follow 6.3's plate grammar; History rows
are hairline-divided list rows inside one plate (mono date + verdict chip +
Sharpe, ghost open action) — not cards.

### 6.7 Access gate & unlock sequence (keep, re-skin only)
The gate keeps its logic (visual-only, guest passthrough, Supabase-aware) but
adopts the v3 plate/type recipes; the boot sequence keeps its three mono lines
+ scan but they render inside a small bezel plate. The app reveal keeps the
`unlock` animation AND the class-drop on `animationend` (containing-block
safety — do not regress this).

---

## 7. STATES — NOTHING SHIPS WITHOUT THEM

For every surface, design all five: **default, hover/focus, loading, empty,
error.**
- Loading = skeleton plates matching the final silhouette + one scan line.
  Spinners are banned except the existing 3-dot/ellipsis inside buttons.
- Empty (History, Portfolio) = a composed plate: icon tray, one honest line
  ("No analyses yet. Run one and it lands here."), one primary action. Never
  a bare "No data".
- Error = overfit-tinted mono line in place, plus a ghost retry where
  applicable. Never a browser alert (replace the remaining `alert()` calls).
- Focus = `ring-2 ring-data/60` visible on EVERY interactive element,
  keyboard path tested (tab through the whole analyze→results flow).

---

## 8. ACCESSIBILITY & PERFORMANCE BUDGETS

- Contrast: body text ≥ 4.5:1 (txt-muted on ink-panel passes; never set
  txt-faint on ink-elevated for essential copy). Semantic chips carry their
  tint at ≥3:1 against their fill.
- `prefers-reduced-motion`: global collapse (shipped — keep). `prefers-reduced-
  transparency`: solid `ink-panel` fallback for blurred overlays.
- Touch targets ≥ 40px; the nav pill's mobile trigger is 40×40.
- `backdrop-blur` only on fixed/sticky elements (nav pill, overlays). Grain
  only on the fixed pseudo-element. `will-change` only during an active
  animation. Z-index ladder: content 2 / nav 30 / gate 60 / modals 50 —
  systemic only.
- Images/charts lazy where offscreen; fonts are subset woff2 via fontsource
  (shipped); JS chunk warning at 500kB is known — do not add heavy deps
  (no GSAP, no three.js; the `motion` package is installed and optional —
  prefer CSS + `Reveal` unless spring physics is genuinely needed).

---

## 9. HARD BANS (auto-fail)

Inter/Roboto/Arial/Helvetica/IBM Plex/Open Sans · Google Fonts `<link>` ·
AI-purple gradients or any neon not derived from `data` · a second accent ·
decorative green/amber/red · three equal feature cards · centered-everything
symmetry · edge-to-edge glued navbar · generic gray 1px borders · pure-black
shadows · `linear`/`ease-in-out` · instant state changes · `h-screen` ·
flex %-math columns · `lucide-react` · hand-rolled icon SVGs (logo excepted) ·
emoji in UI · spinners · toasts for validation errors · `useState` for
continuous pointer/scroll values · scroll listeners for reveals · blur on
scrolling containers · uniform radius sitewide · font-weight ≥700 ·
`alert()` · z-index improvisation.

---

## 10. DELIVERY ORDER & QA GATES

Build in passes; each pass must end green before the next:
1. ~~Foundations + Landing + nav~~ (SHIPPED — commit `9a4d26e`).
2. Analyze console + loading choreography (6.2, 7).
3. Results dashboard + free wall + Truth Collapse wiring (6.3).
4. Pro spec sheet + Auth plate restage (6.4, 6.5).
5. Compare/Portfolio/History alignment + gate re-skin (6.6, 6.7).
6. States & a11y sweep (7, 8) + full regression.

**QA gate per pass (all must pass):**
- [ ] `npm run build` clean; zero console/page errors on every route
      (Playwright sweep at 1440×1000 and 390×844).
- [ ] Colors byte-identical to §1; usage matrix audit on every new surface.
- [ ] Every numeral mono+tabular; every plate has its hairline + top light.
- [ ] ≤2 bezels per viewport; radii ladder respected.
- [ ] Motion table timings respected; reduced-motion collapse verified.
- [ ] Keyboard path + focus rings on the changed surfaces.
- [ ] Existing functionality untouched: analyze flow, gating/redaction,
      auth stages, payments polling, PDF, history, portals.
- [ ] Screenshots (desktop full-page + mobile) reviewed before commit;
      commit + push both branches (`claude/new-session-6nsvex` deploys).

**Deliver production React/Tailwind. No placeholders, no lorem, no generic
fallbacks. If a spec item conflicts with live functionality, keep the
functionality, note the deviation, and propose the closest compliant form.**
