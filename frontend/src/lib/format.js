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

export const VERDICT_META = {
  green: {
    label: "Holds up so far",
    emoji: "🟢",
    ring: "ring-verdict-green",
    bg: "bg-green-600",
    text: "text-green-600",
    soft: "bg-green-50 dark:bg-green-950/40 border-green-600/40",
  },
  yellow: {
    label: "Inconclusive",
    emoji: "🟡",
    ring: "ring-verdict-yellow",
    bg: "bg-amber-500",
    text: "text-amber-600",
    soft: "bg-amber-50 dark:bg-amber-950/40 border-amber-500/40",
  },
  red: {
    label: "Likely overfit",
    emoji: "🔴",
    ring: "ring-verdict-red",
    bg: "bg-red-600",
    text: "text-red-600",
    soft: "bg-red-50 dark:bg-red-950/40 border-red-600/40",
  },
};

export const STATUS_META = {
  pass: { dot: "bg-green-500", text: "text-green-600", label: "Pass" },
  warn: { dot: "bg-amber-500", text: "text-amber-600", label: "Caution" },
  fail: { dot: "bg-red-500", text: "text-red-600", label: "Fail" },
  info: { dot: "bg-slate-400", text: "text-slate-500", label: "Info" },
};
