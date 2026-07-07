/**
 * CAD price formatting, discount math, Canadian cash rounding (penny withdrawn
 * in 2013), and province-aware sales tax examples (spec §10).
 */

export function formatCad(value: number | string, opts: { cents?: boolean } = {}): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return '—';
  if (opts.cents && n < 1) return `${Math.round(n * 100)} ¢`;
  return `$${n.toFixed(2)}`;
}

export function discountPercent(original: number | string | null, current: number | string): number | null {
  const o = typeof original === 'string' ? parseFloat(original) : original;
  const c = typeof current === 'string' ? parseFloat(current) : current;
  if (o == null || !Number.isFinite(o) || o <= 0 || !Number.isFinite(c)) return null;
  const pct = ((o - c) / o) * 100;
  // 99.99% off reads better than a rounded 100% for a $0.01 item
  return pct >= 99.995 ? 99.99 : Math.round(pct * 100) / 100;
}

export function discountLabel(original: number | string | null, current: number | string): string | null {
  const pct = discountPercent(original, current);
  if (pct == null) return null;
  return pct >= 99 ? `${pct.toFixed(2)}% off` : `${Math.round(pct)}% off`;
}

/**
 * Canadian cash rounding: cash totals round to the nearest 5¢.
 * 1–2¢ rounds down, 3–4¢ rounds up (Government of Canada rounding guideline).
 * Card/debit payments charge the exact amount.
 */
export function roundCashTotal(total: number): number {
  return Math.round(Math.round(total * 100) / 5) * 5 / 100;
}

export const CASH_ROUNDING_TIP =
  'Paying cash? Totals round to the nearest 5¢ — a single 1¢ item rounds to $0.00 cash. Card pays the exact amount.';

/** Combined GST/HST/PST rates by province (as of 2026). */
export const TAX_RATES: Record<string, { label: string; rate: number }> = {
  AB: { label: 'GST 5%', rate: 0.05 },
  BC: { label: 'GST + PST 12%', rate: 0.12 },
  MB: { label: 'GST + PST 12%', rate: 0.12 },
  NB: { label: 'HST 15%', rate: 0.15 },
  NL: { label: 'HST 15%', rate: 0.15 },
  NS: { label: 'HST 14%', rate: 0.14 },
  NT: { label: 'GST 5%', rate: 0.05 },
  NU: { label: 'GST 5%', rate: 0.05 },
  ON: { label: 'HST 13%', rate: 0.13 },
  PE: { label: 'HST 15%', rate: 0.15 },
  QC: { label: 'GST + QST 14.975%', rate: 0.14975 },
  SK: { label: 'GST + PST 11%', rate: 0.11 },
  YT: { label: 'GST 5%', rate: 0.05 },
};

export function taxExample(province: string, price: number): string {
  const t = TAX_RATES[province.toUpperCase()];
  if (!t) return '';
  const total = price * (1 + t.rate);
  return `In ${province.toUpperCase()}, tax (${t.label}) applies to the scanned price: ${formatCad(price)} → ${formatCad(total)} at the register.`;
}

/** Price-range filter presets used by the feed (spec §4.1). */
export type PriceFilter = 'penny' | 'under10c' | 'under1' | 'off90' | 'off70';

export function matchesPriceFilter(
  filter: PriceFilter,
  price: number,
  originalPrice: number | null
): boolean {
  switch (filter) {
    case 'penny':
      return price <= 0.01;
    case 'under10c':
      return price <= 0.1;
    case 'under1':
      return price <= 1;
    case 'off90': {
      const pct = discountPercent(originalPrice, price);
      return pct != null && pct >= 90;
    }
    case 'off70': {
      const pct = discountPercent(originalPrice, price);
      return pct != null && pct >= 70;
    }
  }
}

export const CATEGORIES = [
  'Tools',
  'Lighting',
  'Seasonal',
  'Garden',
  'Bath',
  'Hardware',
  'Toys',
  'Grocery',
  'Home Decor',
  'Electronics',
  'Other',
] as const;
export type Category = (typeof CATEGORIES)[number];
