import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { isDbConfigured, getDb, schema } from '@/lib/db';
import { recomputeDeal } from '@/lib/data/mutations';
import { rateLimit } from '@/lib/ratelimit';

// IDs are UUIDs in DB mode but short strings in local/demo mode.
const VoteSchema = z.object({
  dealId: z.string().min(1).max(64),
  kind: z.enum(['confirm', 'dead']),
  storeId: z.string().min(1).max(64).optional(),
});

/** "✅ Found it too" and "❌ Gone at my store" (spec §4.4). */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in to vote' }, { status: 401 });

  const parsed = VoteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });

  // LOCAL MODE: record the vote in the JSON store.
  if (!isDbConfigured()) {
    const { voteLocal } = await import('@/lib/local/store');
    voteLocal(parsed.data.dealId, parsed.data.kind);
    revalidatePath('/', 'layout');
    return NextResponse.json({ ok: true });
  }

  const rl = await rateLimit(`vote:${user.id}`, 60, 3_600_000);
  if (!rl.ok) return NextResponse.json({ error: 'Slow down' }, { status: 429 });

  const db = getDb();
  await db
    .insert(schema.votes)
    .values({ userId: user.id, dealId: parsed.data.dealId, kind: parsed.data.kind, storeId: parsed.data.storeId })
    .onConflictDoNothing();
  await recomputeDeal(parsed.data.dealId);

  return NextResponse.json({ ok: true });
}
