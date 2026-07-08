/**
 * LOCAL MODE (single-user, no cloud): when DATABASE_URL is unset, your own
 * finds, votes, watchlist, and scout entries persist to a JSON file at
 * .data/local-store.json (gitignored). This is the personal-tool storage
 * tier — see DECISIONS.md #21.
 *
 * Server-side only (fs). All records reuse the shared lib/types shapes so
 * the read model merges them seamlessly with the demo seed.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import type { ItemRec, DealRec, ReportRec } from '../types';
import { normalizeUpc } from '../core/upc';
import { isDuplicateReport } from '../core/dedupe';
import { isDbConfigured } from '../db';

export interface LocalVote {
  dealId: string;
  kind: 'confirm' | 'dead';
  createdAt: string;
}

export interface ScoutRec {
  id: string;
  upc: string | null;
  name: string;
  retailerSlug: string;
  storeLabel: string;
  taggedPrice: number;
  /** Clearance date printed on the tag — the 14-week clock starts here. */
  clearanceDate: string; // ISO date
  note: string | null;
  createdAt: string;
  lastCheckedAt: string | null;
  done: boolean;
}

interface LocalData {
  items: ItemRec[];
  deals: DealRec[];
  reports: ReportRec[];
  votes: LocalVote[];
  watchlist: string[]; // item ids
  scouts: ScoutRec[];
}

const EMPTY: LocalData = { items: [], deals: [], reports: [], votes: [], watchlist: [], scouts: [] };
/**
 * Storage location: LOCAL_DATA_DIR env override → serverless /tmp (Vercel's
 * only writable path; ephemeral — set DATABASE_URL there for real
 * persistence, see README) → ./.data next to the project.
 */
const DATA_DIR =
  process.env.LOCAL_DATA_DIR ?? (process.env.VERCEL ? '/tmp/.data' : join(process.cwd(), '.data'));
const FILE = join(DATA_DIR, 'local-store.json');

export const isLocalMode = () => !isDbConfigured();

export const LOCAL_USER = {
  id: 'local-user',
  email: 'you@local',
  username: 'you',
  role: 'admin' as const,
  trustLevel: 'trusted' as const,
};

function load(): LocalData {
  try {
    if (!existsSync(FILE)) return structuredClone(EMPTY);
    const parsed = JSON.parse(readFileSync(FILE, 'utf8')) as Partial<LocalData>;
    return { ...structuredClone(EMPTY), ...parsed };
  } catch {
    return structuredClone(EMPTY);
  }
}

function save(data: LocalData) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

export function getLocalData(): LocalData {
  return load();
}

export interface LocalReportInput {
  retailerId: string;
  storeId: string;
  upc: string;
  sku?: string | null;
  itemName: string;
  brand?: string | null;
  category: string;
  originalPrice?: number | null;
  scannedPrice: number;
  quantitySeen?: number | null;
  foundAt: string; // ISO
  locationNote?: string | null;
  notes?: string | null;
  hasReceipt: boolean;
}

/**
 * Local mirror of the DB report pipeline: find-or-create item, dedupe
 * against existing reports (same UPC + store within 7 days merges as a
 * confirmation), auto-publish (you're always trusted in your own app).
 * `existingDeals` lets reports attach to demo/seed deals for the same item.
 */
export function submitReportLocal(
  input: LocalReportInput,
  existing: { items: ItemRec[]; deals: DealRec[]; reports: ReportRec[] }
): { dealId: string; reportId: string; merged: boolean } {
  const data = load();
  const upc = normalizeUpc(input.upc) ?? input.upc;

  const allItems = [...existing.items, ...data.items];
  let item = allItems.find((i) => i.upc === upc && i.retailerId === input.retailerId);
  if (!item) {
    item = {
      id: `li-${randomUUID().slice(0, 8)}`,
      upc,
      sku: input.sku ?? null,
      retailerId: input.retailerId,
      name: input.itemName,
      brand: input.brand ?? null,
      category: input.category,
      imageUrl: null,
      originalPrice: input.originalPrice ?? null,
    };
    data.items.push(item);
  }

  const allDeals = [...existing.deals, ...data.deals];
  const itemId = item.id;
  const activeDeal = allDeals
    .filter((d) => d.itemId === itemId && d.status !== 'dead')
    .sort((a, b) => +new Date(a.firstReportedAt) - +new Date(b.firstReportedAt))
    .pop();

  let dealId: string;
  let merged = false;
  if (activeDeal) {
    dealId = activeDeal.id;
    const allReports = [...existing.reports, ...data.reports].filter((r) => r.dealId === dealId);
    merged = allReports.some((r) =>
      isDuplicateReport(
        { upc, storeId: r.storeId, foundAt: +new Date(r.foundAt) },
        { upc, storeId: input.storeId, foundAt: +new Date(input.foundAt) }
      )
    );
    // If the active deal is one of OUR local deals, bump its aggregates.
    const localDeal = data.deals.find((d) => d.id === dealId);
    if (localDeal) {
      localDeal.confirmCount += 1;
      localDeal.lastConfirmedAt = input.foundAt;
      localDeal.bestPrice = Math.min(localDeal.bestPrice, input.scannedPrice);
      if (input.hasReceipt) {
        localDeal.hasReceipt = true;
        localDeal.status = 'verified';
      }
    }
  } else {
    dealId = `ld-${randomUUID().slice(0, 8)}`;
    data.deals.push({
      id: dealId,
      itemId,
      status: input.hasReceipt ? 'verified' : 'likely',
      bestPrice: input.scannedPrice,
      firstReportedAt: input.foundAt,
      lastConfirmedAt: input.foundAt,
      confirmCount: 0,
      deadVotes: 0,
      hasReceipt: input.hasReceipt,
      featured: false,
      isSample: false,
      createdBy: LOCAL_USER.id,
    });
  }

  const reportId = `lr-${randomUUID().slice(0, 8)}`;
  data.reports.push({
    id: reportId,
    dealId,
    userId: LOCAL_USER.id,
    storeId: input.storeId,
    scannedPrice: input.scannedPrice,
    quantitySeen: input.quantitySeen ?? null,
    foundAt: input.foundAt,
    locationNote: input.locationNote ?? null,
    notes: input.notes ?? null,
    hasReceipt: input.hasReceipt,
    moderationStatus: 'approved',
  });

  save(data);
  return { dealId, reportId, merged };
}

export function voteLocal(dealId: string, kind: 'confirm' | 'dead') {
  const data = load();
  // One vote per kind per deal (single user).
  if (!data.votes.some((v) => v.dealId === dealId && v.kind === kind)) {
    data.votes.push({ dealId, kind, createdAt: new Date().toISOString() });
    save(data);
  }
}

export function toggleWatchlistLocal(itemId: string, on: boolean) {
  const data = load();
  data.watchlist = data.watchlist.filter((id) => id !== itemId);
  if (on) data.watchlist.push(itemId);
  save(data);
}

export function getWatchlistLocal(): string[] {
  return load().watchlist;
}

// ── Scout tracker (feature: revisit reminders on the 14-week pattern) ──────

export const PENNY_WATCH_DAYS = 98; // ~14 weeks from the tag's clearance date

export function scoutDueDate(clearanceDate: string): Date {
  return new Date(+new Date(clearanceDate) + PENNY_WATCH_DAYS * 86_400_000);
}

export function listScouts(): ScoutRec[] {
  return load().scouts.sort(
    (a, b) => +scoutDueDate(a.clearanceDate) - +scoutDueDate(b.clearanceDate)
  );
}

export function addScout(input: Omit<ScoutRec, 'id' | 'createdAt' | 'lastCheckedAt' | 'done'>): ScoutRec {
  const data = load();
  const scout: ScoutRec = {
    ...input,
    id: `sc-${randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    lastCheckedAt: null,
    done: false,
  };
  data.scouts.push(scout);
  save(data);
  return scout;
}

export function updateScout(id: string, patch: Partial<Pick<ScoutRec, 'lastCheckedAt' | 'done' | 'note'>>) {
  const data = load();
  const scout = data.scouts.find((s) => s.id === id);
  if (scout) {
    Object.assign(scout, patch);
    save(data);
  }
}

export function deleteScout(id: string) {
  const data = load();
  data.scouts = data.scouts.filter((s) => s.id !== id);
  save(data);
}
