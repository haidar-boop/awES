import { getDb, schema } from '../db';
import { and, eq, inArray } from 'drizzle-orm';
import { computeStatus } from '../core/confidence';
import { findDuplicate } from '../core/dedupe';
import { invalidateCore } from './source';

/**
 * Recompute a deal's aggregates + status from its approved reports and votes.
 * Called after report approval, votes, and by the hourly decay cron.
 */
export async function recomputeDeal(dealId: string): Promise<void> {
  const db = getDb();
  const [deal] = await db.select().from(schema.deals).where(eq(schema.deals.id, dealId));
  if (!deal) return;

  const reports = await db
    .select()
    .from(schema.reports)
    .where(and(eq(schema.reports.dealId, dealId), eq(schema.reports.moderationStatus, 'approved')));
  const votes = await db.select().from(schema.votes).where(eq(schema.votes.dealId, dealId));

  const confirmVotes = votes.filter((v) => v.kind === 'confirm');
  const deadVotes = votes.filter((v) => v.kind === 'dead');

  const confirmationTimes = [
    ...reports.map((r) => r.foundAt.getTime()),
    ...confirmVotes.map((v) => v.createdAt.getTime()),
  ];
  const confirmers = new Set([...reports.map((r) => r.userId), ...confirmVotes.map((v) => v.userId)]);
  const hasReceipt = reports.some((r) => r.hasReceipt);
  const lastConfirmedAt = confirmationTimes.length
    ? new Date(Math.max(...confirmationTimes))
    : deal.firstReportedAt;

  const reporterIds = reports.map((r) => r.userId);
  let reporterTrusted = false;
  if (reporterIds.length) {
    const reporters = await db.select().from(schema.users).where(inArray(schema.users.id, reporterIds));
    reporterTrusted = reporters.some((u) => u.trustLevel === 'trusted');
  }

  const status = computeStatus({
    confirmationTimes,
    distinctConfirmers: confirmers.size,
    hasReceipt,
    deadVotes: deadVotes.length,
    firstReportedAt: deal.firstReportedAt.getTime(),
    lastConfirmedAt: lastConfirmedAt.getTime(),
    reporterTrusted,
  });

  const bestPrice = reports.length
    ? Math.min(...reports.map((r) => Number(r.scannedPrice)))
    : Number(deal.bestPrice);

  await db
    .update(schema.deals)
    .set({
      status,
      bestPrice: String(bestPrice),
      confirmCount: confirmationTimes.length ? confirmationTimes.length - 1 : 0,
      deadVotes: deadVotes.length,
      hasReceipt,
      lastConfirmedAt,
    })
    .where(eq(schema.deals.id, dealId));
  invalidateCore();
}

export interface SubmitReportInput {
  userId: string;
  userTrusted: boolean;
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
  foundAt: Date;
  locationNote?: string | null;
  notes?: string | null;
  hasReceipt: boolean;
  photos: { url: string; kind: 'product' | 'tag' | 'receipt'; altText?: string }[];
}

export interface SubmitReportResult {
  dealId: string;
  reportId: string;
  merged: boolean;
  moderationStatus: 'pending' | 'approved';
}

/**
 * The data engine (spec §4.2): create-or-merge a community report.
 * Duplicate (same UPC + store within 7 days) merges as a confirmation.
 */
export async function submitReport(input: SubmitReportInput): Promise<SubmitReportResult> {
  const db = getDb();

  // 1. Find or create the item for this UPC + retailer.
  let [item] = await db
    .select()
    .from(schema.items)
    .where(and(eq(schema.items.upc, input.upc), eq(schema.items.retailerId, input.retailerId)));
  if (!item) {
    [item] = await db
      .insert(schema.items)
      .values({
        upc: input.upc,
        sku: input.sku ?? null,
        retailerId: input.retailerId,
        name: input.itemName,
        brand: input.brand ?? null,
        category: input.category,
        originalPrice: input.originalPrice != null ? String(input.originalPrice) : null,
      })
      .returning();
  }

  // 2. Find the most recent live deal for this item.
  const liveDeals = await db
    .select()
    .from(schema.deals)
    .where(eq(schema.deals.itemId, item.id))
    .orderBy(schema.deals.firstReportedAt);
  const activeDeal = liveDeals.filter((d) => d.status !== 'dead').pop();

  // 3. Duplicate check against the active deal's reports.
  let merged = false;
  let dealId: string;
  if (activeDeal) {
    const existingReports = await db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.dealId, activeDeal.id));
    const dup = findDuplicate(
      existingReports.map((r) => ({ upc: input.upc, storeId: r.storeId, foundAt: r.foundAt.getTime() })),
      { upc: input.upc, storeId: input.storeId, foundAt: input.foundAt.getTime() }
    );
    merged = Boolean(dup);
    dealId = activeDeal.id;
  } else {
    const [deal] = await db
      .insert(schema.deals)
      .values({
        itemId: item.id,
        bestPrice: String(input.scannedPrice),
        firstReportedAt: input.foundAt,
        lastConfirmedAt: input.foundAt,
        createdBy: input.userId,
      })
      .returning();
    dealId = deal.id;
  }

  // 4. Insert the report. Trusted users auto-publish (spec §4.2).
  const moderationStatus = input.userTrusted ? 'approved' : 'pending';
  const [report] = await db
    .insert(schema.reports)
    .values({
      dealId,
      userId: input.userId,
      storeId: input.storeId,
      scannedPrice: String(input.scannedPrice),
      quantitySeen: input.quantitySeen ?? null,
      foundAt: input.foundAt,
      locationNote: input.locationNote ?? null,
      notes: input.notes ?? null,
      hasReceipt: input.hasReceipt,
      moderationStatus,
    })
    .returning();

  if (input.photos.length) {
    await db.insert(schema.reportPhotos).values(
      input.photos.slice(0, 3).map((p) => ({
        reportId: report.id,
        url: p.url,
        kind: p.kind,
        altText: p.altText ?? `${input.itemName} — ${p.kind} photo`,
      }))
    );
  }

  if (moderationStatus === 'approved') {
    await onReportApproved(report.id);
  }

  return { dealId, reportId: report.id, merged, moderationStatus };
}

/**
 * Post-approval side effects: price history, deal recompute, reporter stats,
 * trust promotion at 5 approved reports, First Find badge.
 */
export async function onReportApproved(reportId: string): Promise<void> {
  const db = getDb();
  const [report] = await db.select().from(schema.reports).where(eq(schema.reports.id, reportId));
  if (!report) return;
  const [deal] = await db.select().from(schema.deals).where(eq(schema.deals.id, report.dealId));
  if (!deal) return;

  await db.insert(schema.priceHistory).values({
    itemId: deal.itemId,
    storeId: report.storeId,
    price: report.scannedPrice,
    observedAt: report.foundAt,
  });

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, report.userId));
  if (user) {
    const [item] = await db.select().from(schema.items).where(eq(schema.items.id, deal.itemId));
    const approvedReports = user.approvedReports + 1;
    const addedValue = item?.originalPrice ? Number(item.originalPrice) : 0;
    await db
      .update(schema.users)
      .set({
        approvedReports,
        retailValueFound: String(Number(user.retailValueFound) + addedValue),
        trustLevel:
          user.trustLevel === 'new' && approvedReports >= 5 ? 'trusted' : user.trustLevel,
      })
      .where(eq(schema.users.id, user.id));

    if (approvedReports === 1) {
      const [badge] = await db.select().from(schema.badges).where(eq(schema.badges.slug, 'first-find'));
      if (badge) {
        await db
          .insert(schema.userBadges)
          .values({ userId: user.id, badgeId: badge.id })
          .onConflictDoNothing();
      }
    }
  }

  await recomputeDeal(report.dealId);
}
