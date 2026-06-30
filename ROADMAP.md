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

## Next (build order)
- [ ] **#4 Monthly / calendar returns heatmap** — P&L by period.
- [ ] **#5 Position sizing / Kelly** — Full → ½ → ¼ → 1/10 Kelly readout.
- [ ] **#6 Compare two strategies** — side-by-side verdicts + metrics.
- [ ] **#7 Save / strategy history** — Supabase Postgres (not Render's
      ephemeral disk).
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

## Deliberately NOT building (off-brand)
- Strategy generation / optimization — manufactures the overfitting we exist to
  catch. We validate, we don't generate.
- Signals / alerts / predictive outputs — breaks the "never predicts profit"
  promise.
