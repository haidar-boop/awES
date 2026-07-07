import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { isDbConfigured, getDb, schema } from '@/lib/db';
import { rateLimit, REPORT_LIMIT_NEW_USER } from '@/lib/ratelimit';
import { isValidUpc, normalizeUpc } from '@/lib/core/upc';
import { CATEGORIES } from '@/lib/core/pricing';
import { submitReport } from '@/lib/data/mutations';
import { eq } from 'drizzle-orm';

const PhotoSchema = z.object({
  url: z.string().url(),
  kind: z.enum(['product', 'tag', 'receipt']),
  altText: z.string().max(200).optional(),
});

const ReportSchema = z.object({
  retailerId: z.string().min(1),
  storeId: z.string().min(1),
  upc: z.string().refine(isValidUpc, 'Invalid UPC — check digit failed'),
  sku: z.string().max(20).optional(),
  itemName: z.string().min(3).max(200),
  brand: z.string().max(80).optional(),
  category: z.enum(CATEGORIES),
  originalPrice: z.number().positive().max(100_000).optional(),
  scannedPrice: z.number().min(0.01).max(100_000),
  quantitySeen: z.number().int().min(0).max(10_000).optional(),
  foundAt: z.string().datetime().or(z.string().date()),
  locationNote: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  hasReceipt: z.boolean().default(false),
  photos: z.array(PhotoSchema).max(3).default([]),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to report a find' }, { status: 401 });
  }
  if (user.trustLevel === 'banned') {
    return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Demo mode: reports are disabled without a database. Set DATABASE_URL.', demo: true },
      { status: 503 }
    );
  }

  const parsed = ReportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid submission' },
      { status: 400 }
    );
  }
  const body = parsed.data;

  // Receipt claims require a receipt photo — this is what auto-verifies deals.
  const hasReceiptPhoto = body.photos.some((p) => p.kind === 'receipt');
  const hasReceipt = body.hasReceipt && hasReceiptPhoto;

  const trusted = user.trustLevel === 'trusted' || user.role !== 'user';
  if (!trusted) {
    const rl = await rateLimit(
      `report:${user.id}`,
      REPORT_LIMIT_NEW_USER.limit,
      REPORT_LIMIT_NEW_USER.windowMs
    );
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Daily submission limit reached (10/day for new accounts)' },
        { status: 429 }
      );
    }
  }

  // Validate store belongs to retailer.
  const db = getDb();
  const [store] = await db.select().from(schema.stores).where(eq(schema.stores.id, body.storeId));
  if (!store || store.retailerId !== body.retailerId) {
    return NextResponse.json({ error: 'Store not found for that retailer' }, { status: 400 });
  }

  const result = await submitReport({
    userId: user.id,
    userTrusted: trusted,
    retailerId: body.retailerId,
    storeId: body.storeId,
    upc: normalizeUpc(body.upc)!,
    sku: body.sku,
    itemName: body.itemName,
    brand: body.brand,
    category: body.category,
    originalPrice: body.originalPrice,
    scannedPrice: body.scannedPrice,
    quantitySeen: body.quantitySeen,
    foundAt: new Date(body.foundAt),
    locationNote: body.locationNote,
    notes: body.notes,
    hasReceipt,
    photos: body.photos,
  });

  return NextResponse.json({
    ...result,
    message: result.merged
      ? 'Merged as a confirmation of an existing deal — thanks for confirming!'
      : result.moderationStatus === 'approved'
        ? 'Published! Your report is live.'
        : 'Submitted! Your report is in the moderation queue.',
  });
}
