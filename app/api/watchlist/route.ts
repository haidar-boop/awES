import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { isDbConfigured, getDb, schema } from '@/lib/db';
import { and, eq } from 'drizzle-orm';

const Body = z.object({ itemId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in to save items' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: 'Demo mode', demo: true }, { status: 503 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  await getDb()
    .insert(schema.watchlist)
    .values({ userId: user.id, itemId: parsed.data.itemId })
    .onConflictDoNothing();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: 'Demo mode', demo: true }, { status: 503 });

  const itemId = new URL(req.url).searchParams.get('itemId');
  if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });

  await getDb()
    .delete(schema.watchlist)
    .where(and(eq(schema.watchlist.userId, user.id), eq(schema.watchlist.itemId, itemId)));
  return NextResponse.json({ ok: true });
}
