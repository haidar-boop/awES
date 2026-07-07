import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { isDbConfigured, getDb, schema } from '@/lib/db';
import { recomputeDeal } from '@/lib/data/mutations';
import { rateLimit } from '@/lib/ratelimit';

const VoteSchema = z.object({
  dealId: z.string().uuid(),
  kind: z.enum(['confirm', 'dead']),
  storeId: z.string().uuid().optional(),
});

/** "✅ Found it too" and "❌ Gone at my store" (spec §4.4). */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in to vote' }, { status: 401 });
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Demo mode: votes are disabled', demo: true }, { status: 503 });
  }

  const rl = await rateLimit(`vote:${user.id}`, 60, 3_600_000);
  if (!rl.ok) return NextResponse.json({ error: 'Slow down' }, { status: 429 });

  const parsed = VoteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });

  const db = getDb();
  await db
    .insert(schema.votes)
    .values({ userId: user.id, dealId: parsed.data.dealId, kind: parsed.data.kind, storeId: parsed.data.storeId })
    .onConflictDoNothing();
  await recomputeDeal(parsed.data.dealId);

  return NextResponse.json({ ok: true });
}
