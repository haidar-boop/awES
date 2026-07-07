/**
 * Seed the database with launch data: retailers (+decoder content), stores,
 * FSA centroids, badges, sample users/deals/reports/stories, and articles.
 *
 * Usage: DATABASE_URL=postgres://... npm run db:seed
 * Idempotent-ish: skips seeding if retailers already exist (pass --force to wipe sample data first).
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../lib/db/schema';
import { RETAILERS } from '../lib/demo/retailers';
import { STORES } from '../lib/demo/stores';
import { ITEMS, DEALS, REPORTS } from '../lib/demo/deals';
import { USERS, BADGES, USER_BADGES, STORIES } from '../lib/demo/community';
import { FSA_CENTROIDS } from '../lib/demo/fsa';
import { ARTICLES } from '../lib/content/articles';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required. (Without it the app runs in demo mode and needs no seeding.)');
    process.exit(1);
  }
  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  const existing = await db.select().from(schema.retailers).limit(1);
  if (existing.length && !process.argv.includes('--force')) {
    console.log('Database already seeded (retailers exist). Use --force to re-seed.');
    process.exit(0);
  }

  console.log('Seeding retailers…');
  const retailerIdMap = new Map<string, string>();
  for (const r of RETAILERS) {
    const [row] = await db
      .insert(schema.retailers)
      .values({
        name: r.name,
        slug: r.slug,
        logoUrl: r.logoUrl,
        brandColor: r.brandColor,
        pennyNotesMd: r.pennyNotesMd,
        cadenceNotesMd: r.cadenceNotesMd,
        decoderJson: r.decoder,
        supportsUpcLookup: r.supportsUpcLookup,
        supportsSkuLookup: r.supportsSkuLookup,
        phase: r.phase,
        active: r.active,
      })
      .onConflictDoNothing()
      .returning();
    if (row) retailerIdMap.set(r.id, row.id);
  }

  console.log('Seeding stores…');
  const storeIdMap = new Map<string, string>();
  for (const s of STORES) {
    const [row] = await db
      .insert(schema.stores)
      .values({
        retailerId: retailerIdMap.get(s.retailerId)!,
        name: s.name,
        slug: s.slug,
        address: s.address,
        city: s.city,
        province: s.province,
        postalCode: s.postalCode,
        lat: s.lat,
        lng: s.lng,
        friendlinessAvg: s.friendlinessAvg != null ? String(s.friendlinessAvg) : null,
        friendlinessCount: s.friendlinessCount,
      })
      .returning();
    storeIdMap.set(s.id, row.id);
  }

  console.log('Seeding FSA centroids…');
  for (const c of FSA_CENTROIDS) {
    await db.insert(schema.fsaCentroids).values(c).onConflictDoNothing();
  }

  console.log('Seeding badges…');
  const badgeIdMap = new Map<string, string>();
  for (const b of BADGES) {
    const [row] = await db.insert(schema.badges).values(b).onConflictDoNothing().returning();
    if (row) badgeIdMap.set(b.slug, row.id);
  }

  console.log('Seeding sample users…');
  const userIdMap = new Map<string, string>();
  for (const u of USERS) {
    const [row] = await db
      .insert(schema.users)
      .values({
        email: u.email,
        username: u.username,
        homeProvince: u.homeProvince,
        trustLevel: u.trustLevel,
        role: u.role,
        approvedReports: u.approvedReports,
        retailValueFound: String(u.retailValueFound),
        createdAt: new Date(u.createdAt),
      })
      .returning();
    userIdMap.set(u.id, row.id);
    for (const slug of USER_BADGES[u.id] ?? []) {
      const badgeId = badgeIdMap.get(slug);
      if (badgeId) {
        await db.insert(schema.userBadges).values({ userId: row.id, badgeId }).onConflictDoNothing();
      }
    }
  }

  console.log('Seeding items, deals, reports…');
  const itemIdMap = new Map<string, string>();
  for (const i of ITEMS) {
    const [row] = await db
      .insert(schema.items)
      .values({
        upc: i.upc,
        sku: i.sku,
        retailerId: retailerIdMap.get(i.retailerId)!,
        name: i.name,
        brand: i.brand,
        category: i.category,
        originalPrice: i.originalPrice != null ? String(i.originalPrice) : null,
      })
      .returning();
    itemIdMap.set(i.id, row.id);
  }
  const dealIdMap = new Map<string, string>();
  for (const d of DEALS) {
    const [row] = await db
      .insert(schema.deals)
      .values({
        itemId: itemIdMap.get(d.itemId)!,
        status: d.status,
        bestPrice: String(d.bestPrice),
        firstReportedAt: new Date(d.firstReportedAt),
        lastConfirmedAt: new Date(d.lastConfirmedAt),
        confirmCount: d.confirmCount,
        deadVotes: d.deadVotes,
        hasReceipt: d.hasReceipt,
        featured: d.featured,
        isSample: true,
        createdBy: d.createdBy ? userIdMap.get(d.createdBy) : null,
      })
      .returning();
    dealIdMap.set(d.id, row.id);
  }
  for (const r of REPORTS) {
    const [row] = await db
      .insert(schema.reports)
      .values({
        dealId: dealIdMap.get(r.dealId)!,
        userId: userIdMap.get(r.userId)!,
        storeId: storeIdMap.get(r.storeId)!,
        scannedPrice: String(r.scannedPrice),
        quantitySeen: r.quantitySeen,
        foundAt: new Date(r.foundAt),
        locationNote: r.locationNote,
        notes: r.notes,
        hasReceipt: r.hasReceipt,
        moderationStatus: r.moderationStatus,
      })
      .returning();
    // Derive price history from approved reports (spec §6).
    const deal = DEALS.find((d) => d.id === r.dealId)!;
    await db.insert(schema.priceHistory).values({
      itemId: itemIdMap.get(deal.itemId)!,
      storeId: storeIdMap.get(r.storeId)!,
      price: String(r.scannedPrice),
      observedAt: new Date(r.foundAt),
    });
    void row;
  }

  console.log('Seeding stories…');
  for (const s of STORIES) {
    await db.insert(schema.stories).values({
      userId: userIdMap.get(s.userId),
      title: s.title,
      body: s.body,
      retailValue: String(s.retailValue),
      paidTotal: String(s.paidTotal),
      approved: s.approved,
      createdAt: new Date(s.createdAt),
    });
  }

  console.log('Seeding articles…');
  for (const a of ARTICLES) {
    await db
      .insert(schema.articles)
      .values({
        slug: a.slug,
        title: a.title,
        description: a.description,
        bodyMd: a.body,
        faqJson: a.faq,
        publishedAt: new Date(a.updated),
        updatedAt: new Date(a.updated),
      })
      .onConflictDoNothing();
  }

  console.log('✅ Seed complete.');
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
