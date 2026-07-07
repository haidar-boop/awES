import { loadCore, type CoreSnapshot } from './source';
import type { DealView, StoreRec, RetailerRec, ItemRec, UserRec } from '../types';
import { confidenceRank, type DealStatus } from '../core/confidence';
import { matchesPriceFilter, type PriceFilter } from '../core/pricing';
import { haversineKm, parseFsa, slugifyCity } from '../core/geo';
import { lookupFsa } from '../demo/fsa';
import { normalizeUpc } from '../core/upc';

export interface DealFilters {
  retailers?: string[]; // slugs
  provinces?: string[];
  city?: string;
  price?: PriceFilter;
  category?: string;
  recencyHours?: number;
  verifiedOnly?: boolean;
  includeDead?: boolean;
  near?: { lat: number; lng: number; radiusKm: number };
  sort?: 'newest' | 'confirmed' | 'value' | 'closest';
  status?: DealStatus;
}

function assembleViews(snap: CoreSnapshot): DealView[] {
  const itemById = new Map(snap.items.map((i) => [i.id, i]));
  const retailerById = new Map(snap.retailers.map((r) => [r.id, r]));
  const storeById = new Map(snap.stores.map((s) => [s.id, s]));
  const reportsByDeal = new Map<string, DealView['reports']>();

  for (const rep of snap.reports) {
    if (rep.moderationStatus !== 'approved') continue;
    const store = storeById.get(rep.storeId);
    if (!store) continue;
    const arr = reportsByDeal.get(rep.dealId) ?? [];
    arr.push({ ...rep, store });
    reportsByDeal.set(rep.dealId, arr);
  }

  const views: DealView[] = [];
  for (const deal of snap.deals) {
    const item = itemById.get(deal.itemId);
    if (!item) continue;
    const retailer = retailerById.get(item.retailerId);
    if (!retailer) continue;
    const reports = (reportsByDeal.get(deal.id) ?? []).sort(
      (a, b) => +new Date(b.foundAt) - +new Date(a.foundAt)
    );
    const provinceCounts: Record<string, number> = {};
    for (const r of reports) {
      provinceCounts[r.store.province] = (provinceCounts[r.store.province] ?? 0) + 1;
    }
    views.push({
      deal,
      item,
      retailer,
      reports,
      provinceCounts,
      commentCount: snap.commentCounts[deal.id] ?? 0,
    });
  }
  return views;
}

export async function getDealViews(filters: DealFilters = {}): Promise<DealView[]> {
  const snap = await loadCore();
  let views = assembleViews(snap);

  if (!filters.includeDead && filters.status !== 'dead') {
    views = views.filter((v) => v.deal.status !== 'dead');
  }
  if (filters.status) views = views.filter((v) => v.deal.status === filters.status);
  if (filters.verifiedOnly) views = views.filter((v) => v.deal.status === 'verified');
  if (filters.retailers?.length) {
    const set = new Set(filters.retailers);
    views = views.filter((v) => set.has(v.retailer.slug));
  }
  if (filters.provinces?.length) {
    const set = new Set(filters.provinces.map((p) => p.toUpperCase()));
    views = views.filter((v) => v.reports.some((r) => set.has(r.store.province)));
  }
  if (filters.city) {
    const want = slugifyCity(filters.city);
    views = views.filter((v) => v.reports.some((r) => slugifyCity(r.store.city) === want));
  }
  if (filters.category) {
    views = views.filter((v) => v.item.category === filters.category);
  }
  if (filters.price) {
    views = views.filter((v) =>
      matchesPriceFilter(filters.price!, v.deal.bestPrice, v.item.originalPrice)
    );
  }
  if (filters.recencyHours) {
    const cutoff = Date.now() - filters.recencyHours * 3_600_000;
    views = views.filter((v) => +new Date(v.deal.lastConfirmedAt) >= cutoff);
  }
  if (filters.near) {
    const { lat, lng, radiusKm } = filters.near;
    views = views.filter((v) =>
      v.reports.some((r) => haversineKm(lat, lng, r.store.lat, r.store.lng) <= radiusKm)
    );
  }

  const near = filters.near;
  const sorters: Record<string, (a: DealView, b: DealView) => number> = {
    newest: (a, b) => +new Date(b.deal.firstReportedAt) - +new Date(a.deal.firstReportedAt),
    confirmed: (a, b) =>
      b.deal.confirmCount - a.deal.confirmCount ||
      confidenceRank(b.deal.status) - confidenceRank(a.deal.status),
    value: (a, b) => (b.item.originalPrice ?? 0) - (a.item.originalPrice ?? 0),
    closest: (a, b) => (near ? minDist(a, near) - minDist(b, near) : 0),
  };
  views.sort(sorters[filters.sort ?? 'newest']);
  return views;
}

function minDist(v: DealView, near: { lat: number; lng: number }): number {
  let min = Infinity;
  for (const r of v.reports) {
    const d = haversineKm(near.lat, near.lng, r.store.lat, r.store.lng);
    if (d < min) min = d;
  }
  return min;
}

/** Resolve a "near me" origin from a postal code / FSA string. */
export function resolvePostal(input: string): { lat: number; lng: number; fsa: string } | null {
  const fsa = parseFsa(input);
  if (!fsa) return null;
  const c = lookupFsa(fsa);
  return c ? { lat: c.lat, lng: c.lng, fsa } : null;
}

export async function getDealView(dealId: string): Promise<DealView | null> {
  const snap = await loadCore();
  return assembleViews(snap).find((v) => v.deal.id === dealId) ?? null;
}

export async function getItemPage(upcRaw: string) {
  const upc = normalizeUpc(upcRaw) ?? upcRaw;
  const snap = await loadCore();
  const item = snap.items.find((i) => i.upc === upc);
  if (!item) return null;
  const views = assembleViews(snap).filter((v) => v.item.id === item.id);
  // Price history ladder derived from approved reports (oldest first)
  const history = views
    .flatMap((v) => v.reports.map((r) => ({ price: r.scannedPrice, at: r.foundAt, store: r.store })))
    .sort((a, b) => +new Date(a.at) - +new Date(b.at));
  if (item.originalPrice != null) {
    history.unshift({
      price: item.originalPrice,
      at: new Date(Date.now() - 200 * 86_400_000).toISOString(),
      store: null as unknown as StoreRec,
    });
  }
  return { item, views, history, retailer: snap.retailers.find((r) => r.id === item.retailerId)! };
}

export async function searchByUpcOrSku(query: string) {
  const snap = await loadCore();
  const upc = normalizeUpc(query);
  const digits = query.replace(/\D/g, '');
  return snap.items.filter((i) => (upc && i.upc === upc) || (digits.length >= 6 && i.sku === digits));
}

export async function getRetailers(activeOnly = true): Promise<RetailerRec[]> {
  const snap = await loadCore();
  return activeOnly ? snap.retailers.filter((r) => r.active) : snap.retailers;
}

export async function getRetailer(slug: string): Promise<RetailerRec | null> {
  const snap = await loadCore();
  return snap.retailers.find((r) => r.slug === slug) ?? null;
}

export interface StoreFilters {
  retailerSlug?: string;
  province?: string;
  city?: string;
  near?: { lat: number; lng: number; radiusKm: number };
  q?: string;
}

export async function getStores(filters: StoreFilters = {}): Promise<(StoreRec & { retailer: RetailerRec; distanceKm?: number })[]> {
  const snap = await loadCore();
  const retailerById = new Map(snap.retailers.map((r) => [r.id, r]));
  let stores = snap.stores.map((s) => ({ ...s, retailer: retailerById.get(s.retailerId)! }));

  if (filters.retailerSlug) stores = stores.filter((s) => s.retailer.slug === filters.retailerSlug);
  if (filters.province) {
    const want = filters.province.toUpperCase();
    stores = stores.filter((s) => s.province === want);
  }
  if (filters.city) {
    const want = slugifyCity(filters.city);
    stores = stores.filter((s) => slugifyCity(s.city) === want);
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    stores = stores.filter(
      (s) => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)
    );
  }
  if (filters.near) {
    const { lat, lng, radiusKm } = filters.near;
    stores = stores
      .map((s) => ({ ...s, distanceKm: haversineKm(lat, lng, s.lat, s.lng) }))
      .filter((s) => s.distanceKm! <= radiusKm)
      .sort((a, b) => a.distanceKm! - b.distanceKm!);
  }
  return stores;
}

export async function getStorePage(retailerSlug: string, province: string, storeSlug: string) {
  const snap = await loadCore();
  const retailer = snap.retailers.find((r) => r.slug === retailerSlug);
  if (!retailer) return null;
  const store = snap.stores.find(
    (s) =>
      s.retailerId === retailer.id &&
      s.province.toLowerCase() === province.toLowerCase() &&
      s.slug === storeSlug
  );
  if (!store) return null;
  const views = assembleViews(snap)
    .filter((v) => v.reports.some((r) => r.storeId === store.id))
    .sort((a, b) => +new Date(b.deal.lastConfirmedAt) - +new Date(a.deal.lastConfirmedAt));
  return { retailer, store, views };
}

export async function getAreaStats(province: string, city?: string) {
  const views = await getDealViews({ provinces: [province], city, includeDead: true });
  const monthAgo = Date.now() - 30 * 86_400_000;
  const thisMonth = views.filter((v) => +new Date(v.deal.firstReportedAt) >= monthAgo);
  return {
    total: views.length,
    thisMonth: thisMonth.length,
    verified: views.filter((v) => v.deal.status === 'verified').length,
  };
}

export interface LeaderRow {
  user: UserRec;
  badges: string[];
  reports: number;
  retailValue: number;
}

export async function getLeaderboard(province?: string): Promise<LeaderRow[]> {
  const snap = await loadCore();
  let users = snap.users.filter((u) => u.trustLevel !== 'banned');
  if (province) users = users.filter((u) => u.homeProvince === province.toUpperCase());
  return users
    .map((user) => ({
      user,
      badges: snap.userBadges[user.id] ?? [],
      reports: user.approvedReports,
      retailValue: user.retailValueFound,
    }))
    .sort((a, b) => b.retailValue - a.retailValue);
}

export async function getProfile(username: string) {
  const snap = await loadCore();
  const user = snap.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) return null;
  const badgeBySlug = new Map(snap.badges.map((b) => [b.slug, b]));
  const badges = (snap.userBadges[user.id] ?? [])
    .map((slug) => badgeBySlug.get(slug))
    .filter(Boolean);
  const reports = snap.reports.filter(
    (r) => r.userId === user.id && r.moderationStatus === 'approved'
  );
  return { user, badges, reportCount: reports.length };
}

export async function getStories() {
  const snap = await loadCore();
  const userById = new Map(snap.users.map((u) => [u.id, u]));
  return snap.stories
    .filter((s) => s.approved)
    .map((s) => ({ ...s, user: userById.get(s.userId) ?? null }))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function getFeatured(): Promise<DealView[]> {
  const views = await getDealViews({ sort: 'confirmed' });
  const featured = views.filter((v) => v.deal.featured);
  return featured.length ? featured : views.slice(0, 3);
}

/** Cities with any store, for programmatic SEO pages. */
export async function getCities(): Promise<{ city: string; slug: string; province: string }[]> {
  const snap = await loadCore();
  const seen = new Map<string, { city: string; slug: string; province: string }>();
  for (const s of snap.stores) {
    const key = `${s.province}/${slugifyCity(s.city)}`;
    if (!seen.has(key)) seen.set(key, { city: s.city, slug: slugifyCity(s.city), province: s.province });
  }
  return [...seen.values()].sort((a, b) => a.city.localeCompare(b.city));
}
