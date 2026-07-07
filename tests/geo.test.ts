import { describe, it, expect } from 'vitest';
import { parseFsa, fsaProvince, haversineKm, withinRadius, formatPostalCode, isProvinceCode } from '@/lib/core/geo';
import { lookupFsa } from '@/lib/demo/fsa';

describe('postal code / FSA parsing', () => {
  it('accepts full postal codes with and without space', () => {
    expect(parseFsa('T2P 1J9')).toBe('T2P');
    expect(parseFsa('m5v3l9')).toBe('M5V');
    expect(parseFsa('V6B-1A1')).toBe('V6B');
  });

  it('accepts bare 3-char FSA', () => {
    expect(parseFsa('T2P')).toBe('T2P');
    expect(parseFsa('m5v')).toBe('M5V');
  });

  it('rejects invalid input', () => {
    expect(parseFsa('12345')).toBeNull();
    expect(parseFsa('D1A')).toBeNull(); // D is not a valid FSA first letter
    expect(parseFsa('')).toBeNull();
  });

  it('maps FSA to province', () => {
    expect(fsaProvince('T2P')).toBe('AB');
    expect(fsaProvince('M5V')).toBe('ON');
    expect(fsaProvince('V6B')).toBe('BC');
    expect(fsaProvince('H2X')).toBe('QC');
  });

  it('formats postal codes', () => {
    expect(formatPostalCode('t2p1j9')).toBe('T2P 1J9');
  });

  it('validates province codes', () => {
    expect(isProvinceCode('on')).toBe(true);
    expect(isProvinceCode('ZZ')).toBe(false);
  });
});

describe('acceptance-criteria FSAs resolve to correct centroids', () => {
  it('T2P → downtown Calgary', () => {
    const c = lookupFsa('T2P')!;
    expect(c.province).toBe('AB');
    expect(haversineKm(c.lat, c.lng, 51.045, -114.057)).toBeLessThan(5);
  });
  it('M5V → downtown Toronto', () => {
    const c = lookupFsa('M5V')!;
    expect(c.province).toBe('ON');
    expect(haversineKm(c.lat, c.lng, 43.645, -79.39)).toBeLessThan(5);
  });
  it('V6B → downtown Vancouver', () => {
    const c = lookupFsa('V6B')!;
    expect(c.province).toBe('BC');
    expect(haversineKm(c.lat, c.lng, 49.28, -123.11)).toBeLessThan(5);
  });
});

describe('haversine + radius', () => {
  it('Calgary to Edmonton ≈ 280 km', () => {
    const d = haversineKm(51.0447, -114.0719, 53.5461, -113.4938);
    expect(d).toBeGreaterThan(270);
    expect(d).toBeLessThan(305);
  });

  it('withinRadius respects the boundary', () => {
    const yyc = { lat: 51.0447, lng: -114.0719 };
    const airdrie = { lat: 51.2917, lng: -114.0144 }; // ~28 km north
    expect(withinRadius(yyc, airdrie, 50)).toBe(true);
    expect(withinRadius(yyc, airdrie, 10)).toBe(false);
  });
});
