import { isDbConfigured, getDb, schema } from '../db';
import type {
  RetailerRec, StoreRec, ItemRec, DealRec, ReportRec, UserRec, BadgeRec, StoryRec, DecoderSignal,
} from '../types';
import type { DealStatus } from '../core/confidence';

export interface CoreSnapshot {
  retailers: RetailerRec[];
  stores: StoreRec[];
  items: ItemRec[];
  deals: DealRec[];
  reports: ReportRec[];
  users: UserRec[];
  badges: BadgeRec[];
  userBadges: Record<string, string[]>;
  stories: StoryRec[];
  commentCounts: Record<string, number>;
}

/**
 * Unified read model. In demo mode (no DATABASE_URL) it serves the seed
 * modules; with a database it loads all core tables into the same shapes,
 * cached for 60s per server instance. At launch scale (thousands of rows)
 * this keeps a single, unit-testable code path for all feed assembly.
 * See DECISIONS.md #2 for the scaling plan.
 */
let cache: { at: number; snap: CoreSnapshot } | null = null;
const TTL = 60_000;

export async function loadCore(): Promise<CoreSnapshot> {
  if (!isDbConfigured()) return demoSnapshot();
  if (cache && Date.now() - cache.at < TTL) return cache.snap;
  const snap = await dbSnapshot();
  cache = { at: Date.now(), snap };
  return snap;
}

export function invalidateCore() {
  cache = null;
}

function demoSnapshot(): CoreSnapshot {
  // Lazy requires keep demo data out of the bundle when a DB is configured.
  const { RETAILERS } = require('../demo/retailers') as typeof import('../demo/retailers');
  const { STORES } = require('../demo/stores') as typeof import('../demo/stores');
  const { ITEMS, DEALS, REPORTS } = require('../demo/deals') as typeof import('../demo/deals');
  const { USERS, BADGES, USER_BADGES, STORIES } = require('../demo/community') as typeof import('../demo/community');
  const { getLocalData, LOCAL_USER } = require('../local/store') as typeof import('../local/store');

  // Merge your local finds (LOCAL MODE, DECISIONS.md #21) over the seed data.
  const local = getLocalData();
  const deals: DealRec[] = [...DEALS.map((d) => ({ ...d })), ...local.deals];

  // Overlay local votes onto any deal (including seed deals).
  for (const deal of deals) {
    const votes = local.votes.filter((v) => v.dealId === deal.id);
    if (!votes.length) continue;
    const confirms = votes.filter((v) => v.kind === 'confirm');
    const deads = votes.filter((v) => v.kind === 'dead');
    deal.deadVotes += deads.length;
    if (deal.deadVotes >= 3) deal.status = 'dead';
    if (confirms.length) {
      deal.confirmCount += confirms.length;
      const latest = confirms.map((v) => v.createdAt).sort().pop()!;
      if (latest > deal.lastConfirmedAt) deal.lastConfirmedAt = latest;
      if (deal.status !== 'dead' && deal.status !== 'verified') deal.status = 'likely';
    }
  }

  const approvedLocal = local.reports.length;
  const localValue = local.reports.reduce((sum, r) => {
    const item = [...ITEMS, ...local.items].find((i) => i.id === deals.find((d) => d.id === r.dealId)?.itemId);
    return sum + (item?.originalPrice ?? 0);
  }, 0);

  const users: UserRec[] = [
    ...USERS,
    {
      id: LOCAL_USER.id,
      username: LOCAL_USER.username,
      email: LOCAL_USER.email,
      avatarUrl: null,
      homeProvince: null,
      trustLevel: 'trusted',
      role: 'admin',
      approvedReports: approvedLocal,
      retailValueFound: localValue,
      createdAt: new Date().toISOString(),
    },
  ];

  const userBadges = { ...USER_BADGES };
  if (approvedLocal >= 1) userBadges[LOCAL_USER.id] = ['first-find'];

  return {
    retailers: RETAILERS,
    stores: STORES,
    items: [...ITEMS, ...local.items],
    deals,
    reports: [...REPORTS, ...local.reports],
    users,
    badges: BADGES,
    userBadges,
    stories: STORIES,
    commentCounts: {},
  };
}

async function dbSnapshot(): Promise<CoreSnapshot> {
  const db = getDb();
  const [retailers, stores, items, deals, reports, users, badges, userBadges, stories, comments] =
    await Promise.all([
      db.select().from(schema.retailers),
      db.select().from(schema.stores),
      db.select().from(schema.items),
      db.select().from(schema.deals),
      db.select().from(schema.reports),
      db.select().from(schema.users),
      db.select().from(schema.badges),
      db.select().from(schema.userBadges),
      db.select().from(schema.stories),
      db.select().from(schema.comments),
    ]);

  const badgeSlugById = new Map(badges.map((b) => [b.id, b.slug]));
  const ub: Record<string, string[]> = {};
  for (const row of userBadges) {
    const slug = badgeSlugById.get(row.badgeId);
    if (!slug) continue;
    (ub[row.userId] ??= []).push(slug);
  }
  const commentCounts: Record<string, number> = {};
  for (const c of comments) {
    if (!c.hidden) commentCounts[c.dealId] = (commentCounts[c.dealId] ?? 0) + 1;
  }

  return {
    retailers: retailers.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      logoUrl: r.logoUrl,
      brandColor: r.brandColor,
      pennyNotesMd: r.pennyNotesMd ?? '',
      cadenceNotesMd: r.cadenceNotesMd ?? '',
      decoder: (r.decoderJson as DecoderSignal[] | null) ?? [],
      supportsUpcLookup: r.supportsUpcLookup,
      supportsSkuLookup: r.supportsSkuLookup,
      phase: (r.phase as 1 | 2) ?? 1,
      active: r.active,
    })),
    stores: stores.map((s) => ({
      id: s.id,
      retailerId: s.retailerId,
      name: s.name,
      slug: s.slug,
      address: s.address,
      city: s.city,
      province: s.province,
      postalCode: s.postalCode ?? '',
      lat: s.lat ?? 0,
      lng: s.lng ?? 0,
      friendlinessAvg: s.friendlinessAvg ? Number(s.friendlinessAvg) : null,
      friendlinessCount: s.friendlinessCount,
    })),
    items: items.map((i) => ({
      id: i.id,
      upc: i.upc,
      sku: i.sku,
      retailerId: i.retailerId,
      name: i.name,
      brand: i.brand,
      category: i.category,
      imageUrl: i.imageUrl,
      originalPrice: i.originalPrice ? Number(i.originalPrice) : null,
    })),
    deals: deals.map((d) => ({
      id: d.id,
      itemId: d.itemId,
      status: d.status as DealStatus,
      bestPrice: Number(d.bestPrice),
      firstReportedAt: d.firstReportedAt.toISOString(),
      lastConfirmedAt: d.lastConfirmedAt.toISOString(),
      confirmCount: d.confirmCount,
      deadVotes: d.deadVotes,
      hasReceipt: d.hasReceipt,
      featured: d.featured,
      isSample: d.isSample,
      createdBy: d.createdBy,
    })),
    reports: reports.map((r) => ({
      id: r.id,
      dealId: r.dealId,
      userId: r.userId,
      storeId: r.storeId,
      scannedPrice: Number(r.scannedPrice),
      quantitySeen: r.quantitySeen,
      foundAt: r.foundAt.toISOString(),
      locationNote: r.locationNote,
      notes: r.notes,
      hasReceipt: r.hasReceipt,
      moderationStatus: r.moderationStatus,
    })),
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      avatarUrl: u.avatarUrl,
      homeProvince: u.homeProvince,
      trustLevel: u.trustLevel,
      role: u.role,
      approvedReports: u.approvedReports,
      retailValueFound: Number(u.retailValueFound),
      createdAt: u.createdAt.toISOString(),
    })),
    badges: badges.map((b) => ({ slug: b.slug, name: b.name, icon: b.icon, criteria: b.criteria })),
    userBadges: ub,
    stories: stories
      .filter((s) => s.approved)
      .map((s) => ({
        id: s.id,
        userId: s.userId ?? '',
        title: s.title,
        body: s.body,
        photoUrl: s.photoUrl,
        retailValue: s.retailValue ? Number(s.retailValue) : 0,
        paidTotal: s.paidTotal ? Number(s.paidTotal) : 0,
        approved: s.approved,
        createdAt: s.createdAt.toISOString(),
      })),
    commentCounts,
  };
}
