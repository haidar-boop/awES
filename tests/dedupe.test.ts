import { describe, it, expect } from 'vitest';
import { isDuplicateReport, findDuplicate } from '@/lib/core/dedupe';

const DAY = 86_400_000;
const NOW = Date.parse('2026-07-06T12:00:00Z');

const existing = { upc: '012345678905', storeId: 'store-1', foundAt: NOW - 3 * DAY };

describe('isDuplicateReport', () => {
  it('same UPC + same store within 7 days → duplicate (merge as confirmation)', () => {
    expect(isDuplicateReport(existing, { upc: '012345678905', storeId: 'store-1', foundAt: NOW })).toBe(true);
  });

  it('normalizes UPC formatting (11-digit form with dropped leading zero matches)', () => {
    expect(isDuplicateReport(existing, { upc: '12345678905', storeId: 'store-1', foundAt: NOW })).toBe(true);
  });

  it('different store → not a duplicate', () => {
    expect(isDuplicateReport(existing, { upc: '012345678905', storeId: 'store-2', foundAt: NOW })).toBe(false);
  });

  it('same store more than 7 days apart → new deal, not confirmation', () => {
    expect(
      isDuplicateReport(existing, { upc: '012345678905', storeId: 'store-1', foundAt: NOW + 5 * DAY })
    ).toBe(false);
  });

  it('different UPC → not a duplicate', () => {
    expect(isDuplicateReport(existing, { upc: '036000291452', storeId: 'store-1', foundAt: NOW })).toBe(false);
  });

  it('findDuplicate locates the matching report in a list', () => {
    const reports = [
      { upc: '036000291452', storeId: 'store-1', foundAt: NOW - DAY, id: 'a' },
      { upc: '012345678905', storeId: 'store-1', foundAt: NOW - 2 * DAY, id: 'b' },
    ];
    expect(findDuplicate(reports, { upc: '012345678905', storeId: 'store-1', foundAt: NOW })?.id).toBe('b');
    expect(findDuplicate(reports, { upc: '012345678905', storeId: 'store-9', foundAt: NOW })).toBeUndefined();
  });
});
