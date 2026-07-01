# TrueSharpe — Master Redesign Prompt (v2, "Spatial Instrument")

> Paste this whole brief into your build agent (Claude Code / Cursor / v0). It keeps
> the existing color system byte-for-byte and overhauls everything else.

---

## DESIGN READ (do not skip)

Reading this as: **a premium B2B/prosumer fintech landing + product surface for
quantitatively-literate but design-conscious traders**, with a **cinematic
"spatial instrument" language** (Linear/Vercel structural rigor × Awwwards depth
and motion), leaning toward **Tailwind + Motion (`motion/react`), CSS Grid bento,
double-bezel hardware components, and heavy scroll choreography.**

This is a **redesign — overhaul**. Preserve the color system and the honesty
positioning. Replace the typography, layout, component architecture, motion, and
spacing entirely. The current build reads as a flat "terminal readout." The new
one must read as a **machined measuring instrument you can almost feel** — glass
plates seated in aluminum trays, precise light, deliberate motion.

### The three dials
- `DESIGN_VARIANCE: 8` (structured but asymmetric — bento + editorial splits, never 3 equal cards)
- `MOTION_INTENSITY: 7` (cinematic, physics-based, restrained — motion carries meaning, never decoration)
- `VISUAL_DENSITY: 4` (airy marketing surfaces; the report view alone may push to 6)

---

## 1. LOCKED COLOR SYSTEM (do not change a single hex)

This is the brand. Keep it exactly. Every new surface, shadow, and accent derives
from these tokens only. One accent (`data` blue). The traffic-light triad is
**reserved strictly for verdict logic** — never decorative.

```
/* Graphite surfaces (dark, tinted cool) */
--ink-base:     #0D1117;   /* page */
--ink-deep:     #10141A;   /* recessed wells */
--ink-panel:    #161B22;   /* card inner core */
--ink-elevated: #1C232C;   /* raised surfaces, inputs */
--ink-edge:     #262D38;   /* hairlines, outer bezel */
--ink-line:     #1d242d;   /* faint dividers */

/* Text */
--txt:       #E6EDF3;
--txt-muted: #8B97A6;
--txt-faint: #5c6775;

/* Verdict semantics — LOGIC ONLY, never decoration */
--robust:  #3FB68B;   /* holds up */
--caution: #D9A441;   /* mixed / inconclusive */
--overfit: #E5534B;   /* likely overfit */

/* Single interactive accent — charts, links, focus, primary CTA */
--data: #58A6FF;
```

Rules:
- **Tinted shadows only.** No pure-black `shadow-md`. Shadows are cool graphite:
  `0 24px 60px -20px rgba(3,7,14,0.7)` plus a `data`-tinted glow only on the
  primary CTA and the live verdict gauge.
- **Color-consistency lock:** `data` blue is the *only* interactive accent on the
  whole site. A robust-green button must never appear as a CTA; green/amber/red
  belong to verdicts exclusively.
- Backgrounds are never flat: layer a `radial-gradient` mesh of `data/8%` +
  `robust/6%` orbs behind the hero, and a fixed 3% film-grain noise overlay
  (`position:fixed; inset:0; pointer-events:none; z-index:1`).

---

## 2. NEW TYPOGRAPHY (replace IBM Plex entirely)

Self-host; `font-display: swap`. No Google `<link>` in prod. No Inter/Roboto.

- **Display / headlines:** `Clash Display` (SemiBold/Bold). Huge, tight:
  `text-5xl md:text-7xl tracking-[-0.03em] leading-[0.95]`, `text-wrap: balance`.
- **Body / UI:** `Geist` (400/500/600), `leading-relaxed`, paragraph `max-w-[62ch]`.
- **Data / numerals:** `Geist Mono` with `font-variant-numeric: tabular-nums`
  everywhere a statistic, ratio, percentage, or axis label appears. This is the
  instrument voice — every number is monospaced and tabular.
- **Eyebrow labels:** `Geist Mono`, `text-[11px] uppercase tracking-[0.22em]
  text-txt-faint`, always in a pill badge.
- **Emphasis in headlines:** italic/bold of the *same* family only — never inject
  a second font. Reserve `pb-1` + `leading-[1.1]` on any italic word with a
  descender.

---

## 3. COMPONENT LANGUAGE — "machined hardware" (Double-Bezel)

No element sits flatly on the background. Every card, input, chart, and the
verdict gauge is a glass core seated in an aluminum tray.

**Double-Bezel card:**
- Outer shell: `bg-white/[0.02] ring-1 ring-ink-edge p-1.5 rounded-[1.75rem]`.
- Inner core: `bg-ink-panel rounded-[calc(1.75rem-0.375rem)]
  shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]` + the cool drop shadow.
- Vary radius by depth: tighter inner, softer outer. Never uniform radius sitewide.

**Buttons (island / button-in-button):**
- Primary: `rounded-full px-6 py-3 bg-data text-ink-base font-medium`, with a
  faint `data` glow. Trailing arrow lives in its own nested circle
  (`w-8 h-8 rounded-full bg-ink-base/10`), flush to the right padding.
- Physics: `group`, `active:scale-[0.98]`, inner icon
  `group-hover:translate-x-1 group-hover:-translate-y-px`, custom easing
  `cubic-bezier(0.32,0.72,0,1)`, `duration-500`.
- Ghost: hairline `ring-1 ring-ink-edge` on `ink-elevated`, no fill.

**Inputs:** recessed wells (`bg-ink-deep`, inset top-hairline), `data` focus ring
`ring-2 ring-data/60`. Paste areas feel like a slot you drop data into.

**Iconography:** `@phosphor-icons/react`, **Light** weight, `strokeWidth` locked
globally. One family only. Never hand-roll SVG icons.

**Eyebrow tags** precede every major H2 (`rounded-full px-3 py-1` mono micro-label).

---

## 4. LAYOUT ARCHITECTURE (per surface)

Container `max-w-[1400px] mx-auto`, `px-6`. Sections breathe: `py-28 md:py-40`,
bottom padding optically +1 step over top. **CSS Grid only** (never flex %-math).
`min-h-[100dvh]` for hero (never `h-screen`). Break symmetry everywhere; **zero
"three equal feature cards."**

### 4.1 Landing — Editorial Split hero + Bento proof
- **Hero (Editorial Split):** left half = massive Clash headline
  ("*Your backtest is lying to you.*" with the verb word italic), a one-line
  sub, and the island CTA. Right half = a **live, breathing verdict gauge** in a
  double-bezel plate, needle settling on a value with spring physics on load
  (the "Truth Collapse" reborn as hardware). Behind it: the mesh + grain.
- **The proof strip:** a horizontal, mono-labeled row of real stats
  ("1,000 random strategies raced · 25 yrs data · 12 robustness tests"),
  tabular-nums, hairline-divided — not badges.
- **Asymmetric Bento** for the feature suite: one `col-span-8 row-span-2` hero
  tile (the Validation Plan) beside stacked `col-span-4` tiles (Deflated Sharpe,
  Monte Carlo, Vs-Random). Mixed sizes, mixed radii. Mobile → single column,
  `gap-6`, all spans reset.
- **Autopsy teaser:** an editorial 2-col zig-zag (not cards) previewing one
  real "Backtest Autopsy" with the verdict plate on alternating sides.

### 4.2 Analyze — the "instrument console"
- Not a form dump. A centered double-bezel console: the paste well as the seated
  glass core, frequency + trials as machined toggles/dials beside it, the
  benchmark field as a secondary recessed slot. One confident island "Run" button
  with the nested-arrow. Skeleton-shaped loading (never a spinner).

### 4.3 Results — the report as a spatial dashboard (density → 6 here)
- **Verdict hero plate** full-width: the gauge, the label in its semantic color,
  the "WHY" reasons as a mono list. This is the one place semantic color leads.
- Below: a Bento of diagnostic plates (equity curve, drawdown, distribution,
  rolling Sharpe, Vs-Random, risk-of-ruin), variable heights, each a double-bezel
  core with a mono eyebrow. Charts use `data` blue + semantic verdict tints only.
- **Free wall:** the teaser is a frosted-glass plate over the locked report —
  `backdrop-blur` on a fixed overlay only — with the island "Unlock" CTA. It must
  look like a sealed instrument you haven't been granted access to yet.

### 4.4 Pro — pricing as spec sheet
- No generic pricing cards. A single premium "spec sheet" plate: feature groups
  as mono-labeled rows with Phosphor check glyphs, all feature lists starting at
  the same Y, the price in large Geist Mono, one island CTA. A quiet
  "Free always includes" recessed well beneath.

### 4.5 Auth — sealed access
- The modal (portaled to `document.body`) is a floating double-bezel plate,
  centered, with the staggered-mask reveal on open (links/fields fade-up
  `translate-y-3 → 0`, `delay-[60/120/180]`). Social buttons are ghost islands
  with brand glyphs. Close (X) in a nested circle, top-right.

### Navigation
- **Fluid island nav:** a floating glass pill, detached `mt-6 mx-auto w-max
  rounded-full`, `backdrop-blur` (fixed element only). Hamburger morphs to X on
  mobile; menu opens as a full-screen `backdrop-blur-3xl` overlay with staggered
  link reveals.

---

## 5. MOTION CHOREOGRAPHY (Motion / `motion/react`)

Meaningful, physical, restrained. Custom easing `cubic-bezier(0.32,0.72,0,1)`,
durations 500–800ms. **Animate only `transform` + `opacity`.**

- **Scroll entry:** every section fades up + de-blurs
  (`y:16, blur:8px, opacity:0 → 0, 0, 1`) via `whileInView` (IntersectionObserver;
  never a scroll listener). Stagger children.
- **The signature moment — "Truth Collapse":** on the hero and on every results
  render, an inflated number visibly deflates to its honest value and the gauge
  needle springs and settles (`useMotionValue`/`useSpring`, never `useState` for
  the continuous value). This is the brand's one hero animation — make it
  gorgeous and reuse it as the load state.
- **Magnetic CTAs**, pressed-scale feedback, nested-icon kinetic drift on hover.
- `prefers-reduced-motion`: collapse all of the above to instant, keep opacity.

---

## 6. HARD BANS (auto-fail if present)

- Fonts: Inter, Roboto, Arial, Helvetica, Open Sans — and the old IBM Plex.
- The AI-purple/blue-glow gradient aesthetic (our accent is the *specific* `data`
  blue only, used with intent — no random neon).
- Three equal feature cards. Centered-everything symmetry. Edge-to-edge sticky
  navbar glued to the top.
- Generic 1px solid-gray borders; harsh pure-black `shadow-md`.
- `linear`/`ease-in-out` transitions; instant state changes.
- `h-screen`; flexbox `w-[calc(...)]` column math; `lucide-react`; hand-rolled
  icon SVGs; emoji in UI.
- Any second accent color. Any decorative use of green/amber/red.

---

## 7. TECH CONSTRAINTS

- React + Tailwind (match the repo's existing version). Motion via `motion/react`.
- Verify every dependency against `package.json` before importing; output the
  install command if missing (Clash Display/Geist/Geist Mono, `@phosphor-icons/react`,
  `motion`).
- Interactive/motion components are isolated leaves with `'use client'` where
  applicable. `useMotionValue`/`useScroll` for continuous values — never `useState`.
- Performance: `backdrop-blur` on fixed/sticky only; grain on a fixed
  `pointer-events-none` layer; `will-change` sparingly; systemic z-index only.
- Accessibility: visible `data` focus rings, keyboard paths, AA contrast on
  graphite, honor `prefers-reduced-motion` and `prefers-reduced-transparency`
  (solid-fill fallback for glass).

---

## 8. PRE-FLIGHT CHECKLIST (last filter before shipping)

- [ ] Color hexes are byte-identical to §1; `data` is the only interactive accent;
      green/amber/red appear only on verdict logic.
- [ ] No banned font/icon/border/shadow/layout/motion from §6.
- [ ] Every card/input/gauge uses the double-bezel outer-shell + inner-core.
- [ ] A layout archetype (bento / editorial split / zig-zag) was consciously used
      per section — zero three-equal-card rows.
- [ ] Every statistic renders in Geist Mono, tabular-nums.
- [ ] Hero + results both fire the "Truth Collapse" gauge moment.
- [ ] `min-h-[100dvh]` heroes; CSS Grid layouts; mobile collapses to single column.
- [ ] `prefers-reduced-motion` and reduced-transparency fallbacks verified.
- [ ] Focus rings, keyboard nav, AA contrast confirmed.

**Deliver production-quality React/Tailwind — no generic fallbacks.**
