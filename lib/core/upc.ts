/**
 * UPC-A (12-digit) / EAN-13 (13-digit) validation and normalization.
 * Home Depot Canada SKUs (6–10 digit internal codes) are passed through as-is.
 */

export function normalizeUpc(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11) return '0' + digits; // dropped leading zero
  if (digits.length === 12 || digits.length === 13) return digits;
  return null;
}

/** GS1 check-digit validation for UPC-A / EAN-13. */
export function isValidUpc(raw: string): boolean {
  const upc = normalizeUpc(raw);
  if (!upc) return false;
  const digits = upc.split('').map(Number);
  const check = digits.pop()!;
  // From the rightmost payload digit leftwards, weights alternate 3,1,3,1…
  let sum = 0;
  digits.reverse().forEach((d, i) => {
    sum += d * (i % 2 === 0 ? 3 : 1);
  });
  return (10 - (sum % 10)) % 10 === check;
}

export function isLikelySku(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 10;
}

export type LookupKind = 'upc' | 'sku' | 'invalid';

export function classifyLookup(raw: string): { kind: LookupKind; value: string } {
  const digits = raw.replace(/\D/g, '');
  const upc = normalizeUpc(digits);
  if (upc && isValidUpc(upc)) return { kind: 'upc', value: upc };
  if (isLikelySku(digits)) return { kind: 'sku', value: digits };
  return { kind: 'invalid', value: digits };
}

/** Compute the check digit for an 11/12-digit payload (used by the barcode modal). */
export function computeCheckDigit(payload: string): number {
  const digits = payload.replace(/\D/g, '').split('').map(Number);
  let sum = 0;
  digits.reverse().forEach((d, i) => {
    sum += d * (i % 2 === 0 ? 3 : 1);
  });
  return (10 - (sum % 10)) % 10;
}
