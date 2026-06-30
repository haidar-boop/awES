# TrueSharpe — Feature Roadmap

Built one feature at a time. Each ships fully finished: backend module + tests,
frontend component in the instrument design system, build verified, `dist`
rebuilt, pushed. New analyses are gated through the existing Pro mechanism — no
one-off paywalls. Statistics are never changed by a feature unless that feature
*is* the statistic.

Derived from a competitive scan of BacktestBase, Build Alpha, StrategyQuant,
ErgodicLabs, and the academic robustness literature (PSR / DSR / PBO).

## Done
- [x] Instrument-grade visual redesign (graphite terminal theme, verdict gauge,
      Truth Collapse hero, de-emoji)
- [x] Access gate with system-unlock transition
- [x] Social sign-up (Google, GitHub) via Supabase OAuth
- [x] **#1 Platform import** — MT4 / MT5 HTML statements, TradingView / MT5 XLSX,
      cTrader / generic CSV → auto-extracts the P&L (or balance) column into the
      analyze flow. `backend/statement_import.py` + `/api/import`.

- [x] **#2 Trade-dependency test** — "remove the top N trades; does the edge
      survive?" + outlier-concentration flag. `engine/dependency.py`, free,
      surfaced as a card on Results.

- [x] **#3 Risk of Ruin** — probability of hitting -X% / ruin thresholds, read
      off the Monte Carlo paths, + worst-case (5th-pct) drawdown and chance of a
      losing run. `engine/ruin.py`, Pro (derived from the paid simulation).

- [x] **#4 Returns-over-time heatmap** — buckets the series into ~monthly
      (frequency-aware) periods and colors each by compounded return, showing
      whether the edge is steady or lumpy. `engine/heatmap.py`, free. (No real
      dates are claimed — the parser strips them — so buckets are sequential.)

- [x] **#5 Position sizing / Kelly** — full + fractional (½ / ¼ / 1/10) Kelly
      leverage and the volatility each implies, with an honest "size below the
      math" caveat. `engine/kelly.py`, Pro.

- [x] **#6 Compare two strategies** — side-by-side verdicts + metrics with
      winner highlighting and an equity overlay. New `/compare` page that
      composes the existing `/api/analyze` twice (no backend change). Free.

- [x] **#7 Save / strategy history** — per-user saved reports on Supabase
      Postgres with Row-Level Security (you must be signed in; RLS guarantees
      you only ever see your own). Save button on Results, gated `/history`
      page. One-time table setup: `supabase/saved_analyses.sql`. Frontend-only
      (Supabase client + RLS, no backend change).

## Next (build order)
- [ ] **#8 Drawdown recovery** — recovery-time + underwater framing.
- [ ] **#9 Monte Carlo skip-trades variant** — stress missed-trade sensitivity.
- [ ] **#10 Walk-forward analysis** — rolling in/out windows (full version of
      the current OOS degradation check).
- [ ] **#11 Portfolio combination + correlation matrix** — multi-strategy.
- [ ] **#12 Vs. Random test** — compare to the best strategy luck produces.
- [ ] **#13 Noise / perturbation test** — needs price series.
- [ ] **#14 Parameter-permutation stability** — needs parameterized input.
- [ ] **#15 "Validation Plan"** — turn a result into prioritized, specific next
      steps (the honest version of a generated plan; Pro feature).

## Parked / backlog (revisit later)
- **Real calendar dates in the heatmap** — #4 groups returns into *sequential*
  buckets because the parser strips dates. To show true Jan–Dec months /
  seasonality, capture dates through `parsing.py` and group by real month when
  the user's data includes them (fall back to sequential when it doesn't).
- **Trade-dependency + risk-of-ruin in the PDF report** — both are in the web
  UI but not yet written into the downloadable PDF.

## Deliberately NOT building (off-brand)
- Strategy generation / optimization — manufactures the overfitting we exist to
  catch. We validate, we don't generate.
- Signals / alerts / predictive outputs — breaks the "never predicts profit"
  promise.
