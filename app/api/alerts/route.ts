import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { isDbConfigured, getDb, schema } from '@/lib/db';
import { parseFsa } from '@/lib/core/geo';
import { lookupFsa } from '@/lib/demo/fsa';
import { and, eq } from 'drizzle-orm';

const AlertSchema = z.object({
  postalCode: z.string().refine((v) => parseFsa(v) !== null, 'Enter a valid postal code or FSA'),
  radiusKm: z.union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)]).default(25),
  retailerIds: z.array(z.string()).optional(),
  sensitivity: z.enum(['penny', 'amazing', 'great', 'all']).default('penny'),
  frequency: z.enum(['instant', 'daily']).default('daily'),
});

async function isPro(userId: string): Promise<boolean> {
  const db = getDb();
  const [sub] = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, userId));
  return sub?.status === 'active' && sub.plan !== 'free';
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in to create alerts' }, { status: 401 });
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Demo mode: alerts are disabled', demo: true }, { status: 503 });
  }

  const parsed = AlertSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid alert' }, { status: 400 });
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(schema.alerts)
    .where(and(eq(schema.alerts.userId, user.id), eq(schema.alerts.active, true)));

  // Free tier: 1 area alert, daily digest only. Pro: unlimited + instant (spec §4.5).
  const pro = await isPro(user.id);
  if (!pro && existing.length >= 1) {
    return NextResponse.json(
      { error: 'Free accounts get 1 area alert — upgrade to Pro for unlimited alerts', upgrade: true },
      { status: 402 }
    );
  }
  const frequency = !pro && parsed.data.frequency === 'instant' ? 'daily' : parsed.data.frequency;

  const fsa = parseFsa(parsed.data.postalCode)!;
  const centroid = lookupFsa(fsa);

  const [alert] = await db
    .insert(schema.alerts)
    .values({
      userId: user.id,
      postalCode: fsa,
      lat: centroid?.lat,
      lng: centroid?.lng,
      radiusKm: parsed.data.radiusKm,
      retailerIds: parsed.data.retailerIds ?? [],
      sensitivity: parsed.data.sensitivity,
      frequency,
    })
    .returning();

  return NextResponse.json({ ok: true, id: alert.id, frequency });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: 'Demo mode', demo: true }, { status: 503 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = getDb();
  await db
    .update(schema.alerts)
    .set({ active: false })
    .where(and(eq(schema.alerts.id, id), eq(schema.alerts.userId, user.id)));
  return NextResponse.json({ ok: true });
}
