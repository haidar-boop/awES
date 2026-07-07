import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, getDb, schema } from '@/lib/db';
import { recomputeDeal } from '@/lib/data/mutations';
import { ne } from 'drizzle-orm';

/**
 * Hourly confidence-decay job (spec §4.4/§7): recomputes every non-dead deal
 * so verified→likely→unconfirmed→dead transitions happen without traffic.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDbConfigured()) return NextResponse.json({ ok: true, demo: true, decayed: 0 });

  const db = getDb();
  const live = await db.select({ id: schema.deals.id }).from(schema.deals).where(ne(schema.deals.status, 'dead'));
  for (const d of live) {
    await recomputeDeal(d.id);
  }
  return NextResponse.json({ ok: true, decayed: live.length });
}
