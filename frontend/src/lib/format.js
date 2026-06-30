export function pct(x, digits = 1) {
  if (x === null || x === undefined || Number.isNaN(x)) return "n/a";
  return `${(x * 100).toFixed(digits)}%`;
}

export function num(x, digits = 2) {
  if (x === null || x === undefined || Number.isNaN(x)) return "n/a";
  if (!Number.isFinite(x)) return "∞";
  return x.toFixed(digits);
}

export function int(x) {
  if (x === null || x === undefined || Number.isNaN(x)) return "n/a";
  if (!Number.isFinite(x)) return "∞";
  return Math.round(x).toLocaleString();
}

// Verdict presentation. `zone` (0..1) places the gauge needle; `accent` is the
// raw hex for canvas/SVG; class fields drive the diagnostic panel styling.
export const VERDICT_META = {
  green: {
    label: "Holds up so far",
    code: "ROBUST",
    accent: "#3FB68B",
    zone: 0.84,
    text: "text-robust",
    bg: "bg-robust",
    chip: "bg-robust/10 text-robust",
    soft: "border-robust/40",
  },
  yellow: {
    label: "Inconclusive",
    code: "INCONCLUSIVE",
    accent: "#D9A441",
    zone: 0.5,
    text: "text-caution",
    bg: "bg-caution",
    chip: "bg-caution/10 text-caution",
    soft: "border-caution/40",
  },
  red: {
    label: "Likely overfit",
    code: "OVERFIT",
    accent: "#E5534B",
    zone: 0.16,
    text: "text-overfit",
    bg: "bg-overfit",
    chip: "bg-overfit/10 text-overfit",
    soft: "border-overfit/40",
  },
};

export const STATUS_META = {
  pass: { dot: "bg-robust", text: "text-robust", label: "Pass" },
  warn: { dot: "bg-caution", text: "text-caution", label: "Caution" },
  fail: { dot: "bg-overfit", text: "text-overfit", label: "Fail" },
  info: { dot: "bg-txt-faint", text: "text-txt-muted", label: "Info" },
};
