import { describe, it, expect } from 'vitest';
import { isValidUpc, normalizeUpc, classifyLookup, computeCheckDigit } from '@/lib/core/upc';

describe('UPC validation', () => {
  it('accepts valid UPC-A codes', () => {
    expect(isValidUpc('012345678905')).toBe(true); // canonical GS1 example
    expect(isValidUpc('036000291452')).toBe(true);
  });

  it('accepts valid EAN-13 codes', () => {
    expect(isValidUpc('4006381333931')).toBe(true);
  });

  it('rejects bad check digits', () => {
    expect(isValidUpc('012345678906')).toBe(false);
    expect(isValidUpc('036000291453')).toBe(false);
  });

  it('rejects wrong lengths', () => {
    expect(isValidUpc('1234')).toBe(false);
    expect(isValidUpc('')).toBe(false);
  });

  it('normalizes 11-digit input by restoring the leading zero', () => {
    expect(normalizeUpc('12345678905')).toBe('012345678905');
    expect(isValidUpc('12345678905')).toBe(true);
  });

  it('strips spaces and dashes', () => {
    expect(isValidUpc('0 12345 67890 5')).toBe(true);
  });

  it('computeCheckDigit matches known codes', () => {
    expect(computeCheckDigit('01234567890')).toBe(5);
    expect(computeCheckDigit('03600029145')).toBe(2);
  });
});

describe('classifyLookup', () => {
  it('classifies a valid UPC', () => {
    expect(classifyLookup('012345678905')).toEqual({ kind: 'upc', value: '012345678905' });
  });
  it('classifies a Home Depot SKU (6-10 digits, not a valid UPC)', () => {
    expect(classifyLookup('1001034521').kind).toBe('sku');
    expect(classifyLookup('123456').kind).toBe('sku');
  });
  it('rejects garbage', () => {
    expect(classifyLookup('abc').kind).toBe('invalid');
    expect(classifyLookup('12').kind).toBe('invalid');
  });
});
