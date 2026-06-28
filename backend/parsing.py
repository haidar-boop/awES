"""CSV / paste parsing, validation and normalization.

Turns messy user input (a pasted column, an exported CSV with dates and
headers, a trade-by-trade P&L list, an equity curve, percentages or decimals)
into a clean per-period returns array plus a record of what we did and any
warnings the UI should surface.
"""
from __future__ import annotations

import io
from dataclasses import dataclass, field

import numpy as np
import pandas as pd


class ParseError(ValueError):
    """Raised for input we cannot turn into a usable series."""


MAX_BYTES = 5 * 1024 * 1024  # 5 MB upload cap

# Column-name hints (lower-cased, substring match).
VALUE_HINTS = ["return", "ret", "pnl", "p&l", "profit", "equity", "balance",
               "value", "nav", "close", "cumulative", "pct", "%"]
DATE_HINTS = ["date", "time", "timestamp", "datetime", "day"]


@dataclass
class ParsedData:
    returns: np.ndarray
    value_type: str          # "returns" or "equity" (as interpreted)
    data_kind: str           # "timeseries" or "trades"
    pnl: np.ndarray | None = None  # raw per-trade P&L when data_kind == "trades"
    n: int = 0
    conversions: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def to_meta(self) -> dict:
        return {
            "n": self.n,
            "value_type": self.value_type,
            "data_kind": self.data_kind,
            "conversions": self.conversions,
            "warnings": self.warnings,
        }


def _coerce_numeric_column(raw: str) -> tuple[np.ndarray, list[str]]:
    """Extract the most plausible numeric value column from raw CSV/paste text."""
    notes: list[str] = []
    if raw is None or not raw.strip():
        raise ParseError("No data provided.")
    if len(raw.encode("utf-8")) > MAX_BYTES:
        raise ParseError("Input exceeds the 5 MB limit.")

    text = raw.strip()
    # Try a real CSV parse first; fall back to whitespace/line parsing.
    df = None
    for sep in [",", ";", "\t", r"\s+"]:
        try:
            candidate = pd.read_csv(
                io.StringIO(text), sep=sep, engine="python",
                comment="#", skip_blank_lines=True,
            )
            if candidate.shape[1] >= 1 and len(candidate) >= 1:
                df = candidate
                break
        except Exception:
            continue

    if df is None:
        # Last resort: split on any whitespace/newline, keep numbers.
        tokens = []
        for tok in text.replace(",", " ").split():
            try:
                tokens.append(float(tok))
            except ValueError:
                pass
        if not tokens:
            raise ParseError("Could not find any numbers in the input.")
        return np.array(tokens, dtype=float), notes

    # Drop obvious date/index columns and non-numeric columns.
    cols = list(df.columns)
    numeric_cols = []
    for c in cols:
        name = str(c).lower()
        if any(h in name for h in DATE_HINTS):
            continue
        series = pd.to_numeric(df[c], errors="coerce")
        if series.notna().sum() >= max(2, int(0.5 * len(series))):
            numeric_cols.append((c, series))

    if not numeric_cols:
        # Maybe header-less single column read as the index/header; retry raw.
        series = pd.to_numeric(df.iloc[:, -1], errors="coerce")
        if series.notna().sum() < 2:
            raise ParseError("Could not find a numeric column to analyze.")
        numeric_cols = [(cols[-1], series)]

    # Prefer a column whose name matches a value hint; else the last numeric one.
    chosen = None
    for c, series in numeric_cols:
        if any(h in str(c).lower() for h in VALUE_HINTS):
            chosen = (c, series)
            break
    if chosen is None:
        chosen = numeric_cols[-1]

    if len(numeric_cols) > 1:
        notes.append(f"Multiple numeric columns found; analyzed '{chosen[0]}'.")

    arr = chosen[1].to_numpy(dtype=float)
    return arr, notes


def _clean(arr: np.ndarray) -> tuple[np.ndarray, list[str]]:
    notes = []
    n0 = len(arr)
    arr = arr[np.isfinite(arr)]
    dropped = n0 - len(arr)
    if dropped > 0:
        notes.append(f"Dropped {dropped} missing/invalid (NaN/Inf) value(s).")
    return arr, notes


def _looks_like_equity(arr: np.ndarray) -> bool:
    """Heuristic: equity curves are (mostly) positive, monotone-ish, far from 0."""
    if len(arr) < 3:
        return False
    if np.any(arr <= 0):
        return False
    # Returns hover near 0; equity values are typically >> 1 and drift.
    median_abs = np.median(np.abs(arr))
    # If typical magnitude is large and values rarely flip sign, treat as equity.
    return bool(median_abs > 1.5)


def parse_input(
    raw: str,
    value_type: str = "auto",      # "returns" | "equity" | "auto"
    is_percentage: str | bool = "auto",  # True | False | "auto"
    data_kind: str = "auto",       # "timeseries" | "trades" | "auto"
) -> ParsedData:
    """Parse + normalize raw input into a per-period returns array."""
    arr, parse_notes = _coerce_numeric_column(raw)
    arr, clean_notes = _clean(arr)
    conversions: list[str] = []
    warnings: list[str] = list(parse_notes) + list(clean_notes)

    if len(arr) == 0:
        raise ParseError("No usable numeric values after cleaning.")

    # --- decide value_type -------------------------------------------------
    detected_equity = _looks_like_equity(arr)
    if value_type == "auto":
        value_type = "equity" if detected_equity else "returns"
        conversions.append(f"Auto-detected input as an {value_type} series.")
    elif value_type == "equity" and not detected_equity and np.any(arr <= 0):
        warnings.append(
            "You marked this as an equity curve but it contains non-positive "
            "values; results may be unreliable."
        )

    pnl = None
    # --- trades vs timeseries ---------------------------------------------
    if data_kind == "auto":
        # We cannot reliably auto-distinguish; default to timeseries unless the
        # caller asked for trades.
        data_kind = "timeseries"

    if data_kind == "trades":
        # Trade P&L: keep raw P&L for trade stats; build a returns proxy by
        # treating each trade's P&L as a fractional return on a unit of risk.
        pnl = arr.copy()
        # Normalize to "returns" scale for the time-series stats: use P&L as-is
        # if it already looks like fractional returns, else scale by mean stake.
        if _looks_like_equity(np.abs(arr)) and np.median(np.abs(arr)) > 1.5:
            # Looks like currency P&L; express as fraction of average abs trade.
            scale = np.mean(np.abs(arr))
            returns = arr / scale if scale > 0 else arr
            conversions.append(
                "Trade P&L looked like currency amounts; scaled to fractional "
                "returns by the average absolute trade size."
            )
        else:
            returns = arr.copy()
        value_type = "returns"
    else:
        # --- equity -> returns --------------------------------------------
        if value_type == "equity":
            if np.any(arr <= 0):
                raise ParseError(
                    "Equity curve contains zero/negative values; cannot convert "
                    "to returns."
                )
            returns = arr[1:] / arr[:-1] - 1.0
            conversions.append("Converted equity curve to per-period returns.")
        else:
            returns = arr.copy()

    # --- percentage vs decimal --------------------------------------------
    if value_type == "returns" or data_kind == "trades":
        if is_percentage == "auto":
            # If typical magnitude > 1 (e.g. 2.5 meaning 2.5%), likely percent.
            median_abs = np.median(np.abs(returns[returns != 0])) if np.any(returns != 0) else 0
            if median_abs > 1.0:
                returns = returns / 100.0
                conversions.append(
                    "Values looked like percentages (e.g. 2.5 = 2.5%); divided "
                    "by 100."
                )
        elif is_percentage in (True, "true", "True"):
            returns = returns / 100.0
            conversions.append("Treated values as percentages; divided by 100.")

    returns = returns[np.isfinite(returns)]

    # --- suspicious-data warnings -----------------------------------------
    if len(returns) >= 2 and np.std(returns, ddof=1) == 0:
        warnings.append("Returns are constant (zero variance) -- results are degenerate.")
    if len(returns) >= 5 and np.all(returns >= 0):
        warnings.append(
            "Every period is non-negative -- a strategy that never loses is "
            "highly suspicious; double-check your data."
        )
    if len(returns) < 30:
        warnings.append(
            f"Only {len(returns)} observations -- below the ~30-60 needed for "
            "statistics to be trustworthy."
        )

    return ParsedData(
        returns=returns,
        value_type=value_type,
        data_kind=data_kind,
        pnl=pnl,
        n=len(returns),
        conversions=conversions,
        warnings=warnings,
    )
