import { describe, it, expect } from 'vitest';
import {
  roundCashTotal,
  discountPercent,
  discountLabel,
  formatCad,
  matchesPriceFilter,
  taxExample,
} from '@/lib/core/pricing';

describe('Canadian cash rounding', () => {
  it('a single 1¢ item rounds to $0.00 cash', () => {
    expect(roundCashTotal(0.01)).toBe(0);
  });
  it('1-2¢ rounds down, 3-4¢ rounds up', () => {
    expect(roundCashTotal(1.01)).toBe(1.0);
    expect(roundCashTotal(1.02)).toBe(1.0);
    expect(roundCashTotal(1.03)).toBe(1.05);
    expect(roundCashTotal(1.04)).toBe(1.05);
    expect(roundCashTotal(1.05)).toBe(1.05);
  });
  it('6-7¢ rounds down to 5¢, 8-9¢ rounds up to 10¢', () => {
    expect(roundCashTotal(0.06)).toBe(0.05);
    expect(roundCashTotal(0.08)).toBe(0.1);
  });
});

describe('discount math', () => {
  it('caps a $149 → $0.01 deal at 99.99% (never shows 100%)', () => {
    expect(discountPercent(149.0, 0.01)).toBe(99.99);
    expect(discountLabel(149.0, 0.01)).toBe('99.99% off');
  });
  it('regular discounts round to whole percent labels', () => {
    expect(discountLabel(100, 25)).toBe('75% off');
  });
  it('handles missing original price', () => {
    expect(discountPercent(null, 0.01)).toBeNull();
    expect(discountLabel(null, 0.01)).toBeNull();
  });
});

describe('price filters', () => {
  it('penny filter matches only $0.01', () => {
    expect(matchesPriceFilter('penny', 0.01, 149)).toBe(true);
    expect(matchesPriceFilter('penny', 0.02, 149)).toBe(false);
  });
  it('under10c and under1', () => {
    expect(matchesPriceFilter('under10c', 0.04, null)).toBe(true);
    expect(matchesPriceFilter('under10c', 0.25, null)).toBe(false);
    expect(matchesPriceFilter('under1', 0.97, null)).toBe(true);
  });
  it('90%+ off requires original price', () => {
    expect(matchesPriceFilter('off90', 1.0, 20.0)).toBe(true);
    expect(matchesPriceFilter('off90', 5.0, 20.0)).toBe(false);
    expect(matchesPriceFilter('off90', 0.01, null)).toBe(false);
  });
});

describe('formatting', () => {
  it('formats CAD', () => {
    expect(formatCad(0.01)).toBe('$0.01');
    expect(formatCad(0.01, { cents: true })).toBe('1 ¢');
    expect(formatCad(149)).toBe('$149.00');
  });
  it('tax example is province-aware', () => {
    expect(taxExample('ON', 1)).toContain('HST 13%');
    expect(taxExample('AB', 1)).toContain('GST 5%');
  });
});
