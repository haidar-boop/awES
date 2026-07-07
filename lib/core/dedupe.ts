/**
 * Duplicate detection (spec §4.2): a new report on the same UPC + store within
 * 7 days of an existing report merges into the existing deal as a confirmation
 * instead of creating a new deal.
 */
import { normalizeUpc } from './upc';

export const DEDUPE_WINDOW_DAYS = 7;
const DAY = 86_400_000;

export interface ExistingReportKey {
  upc: string;
  storeId: string;
  foundAt: number; // ms epoch
}

export interface IncomingReportKey {
  upc: string;
  storeId: string;
  foundAt: number;
}

/** True when the incoming report should merge as a confirmation of an existing deal. */
export function isDuplicateReport(existing: ExistingReportKey, incoming: IncomingReportKey): boolean {
  const a = normalizeUpc(existing.upc);
  const b = normalizeUpc(incoming.upc);
  if (!a || !b || a !== b) return false;
  if (existing.storeId !== incoming.storeId) return false;
  return Math.abs(incoming.foundAt - existing.foundAt) <= DEDUPE_WINDOW_DAYS * DAY;
}

/**
 * Given the reports already attached to a deal, decide whether an incoming
 * report is a store-level duplicate (confirmation) of any of them.
 */
export function findDuplicate<T extends ExistingReportKey>(
  reports: T[],
  incoming: IncomingReportKey
): T | undefined {
  return reports.find((r) => isDuplicateReport(r, incoming));
}
