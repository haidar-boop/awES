/**
 * Canadian geography: provinces, postal codes / FSAs, haversine distances.
 * All distances in kilometres (spec §10.7).
 */

export const PROVINCES: Record<string, string> = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  NS: 'Nova Scotia',
  NT: 'Northwest Territories',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Quebec',
  SK: 'Saskatchewan',
  YT: 'Yukon',
};

export const PROVINCE_CODES = Object.keys(PROVINCES);

export function isProvinceCode(code: string): boolean {
  return code.toUpperCase() in PROVINCES;
}

/** First letter of an FSA → province (K/L/M/N/P share ON; X covers NT+NU). */
const FSA_LETTER_PROVINCE: Record<string, string> = {
  A: 'NL', B: 'NS', C: 'PE', E: 'NB', G: 'QC', H: 'QC', J: 'QC',
  K: 'ON', L: 'ON', M: 'ON', N: 'ON', P: 'ON', R: 'MB', S: 'SK',
  T: 'AB', V: 'BC', X: 'NT', Y: 'YT',
};

/**
 * Accepts a full postal code ("A1A 1A1") or a bare FSA ("A1A"), case and
 * space insensitive. Returns the normalized 3-char FSA or null.
 */
export function parseFsa(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[\s-]/g, '');
  const m = cleaned.match(/^([ABCEGHJ-NPRSTVXY]\d[A-Z])(\d[A-Z]\d)?$/);
  return m ? m[1] : null;
}

export function fsaProvince(fsa: string): string | null {
  return FSA_LETTER_PROVINCE[fsa.charAt(0).toUpperCase()] ?? null;
}

export function formatPostalCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[\s-]/g, '');
  return cleaned.length === 6 ? `${cleaned.slice(0, 3)} ${cleaned.slice(3)}` : cleaned;
}

/** Great-circle distance in km. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export function withinRadius(origin: GeoPoint, point: GeoPoint, radiusKm: number): boolean {
  return haversineKm(origin.lat, origin.lng, point.lat, point.lng) <= radiusKm;
}

export const RADIUS_OPTIONS_KM = [10, 25, 50, 100] as const;

export function formatKm(km: number): string {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export function slugifyCity(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
