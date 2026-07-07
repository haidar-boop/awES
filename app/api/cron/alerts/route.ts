import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, getDb, schema } from '@/lib/db';
import { getDealViews } from '@/lib/data/queries';
import { haversineKm } from '@/lib/core/geo';
import { discountPercent, formatCad } from '@/lib/core/pricing';
import { sendEmail, alertEmail } from '@/lib/email';
import { siteUrl } from '@/lib/utils';
import { eq, and } from 'drizzle-orm';

const SENSITIVITY_MIN_PCT: Record<string, number> = { penny: 99, amazing: 95, great: 80, all: 50 };

/**
 * Alert matcher (spec §4.5, every 5 min): finds deals confirmed since each
 * instant alert's last match and emails the owner. Daily-frequency alerts are
 * batched by the same logic with a 24h window (run piggybacks on cadence).
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDbConfigured()) return NextResponse.json({ ok: true, demo: true, matched: 0 });

  const db = getDb();
  const alerts = await db.select().from(schema.alerts).where(eq(schema.alerts.active, true));
  const views = await getDealViews({ recencyHours: 24 });
  let matched = 0;

  for (const alert of alerts) {
    if (alert.lat == null || alert.lng == null) continue;
    const since =
      alert.frequency === 'instant'
        ? alert.lastMatchedAt?.getTime() ?? Date.now() - 15 * 60_000
        : Date.now() - 24 * 3_600_000;
    if (alert.frequency === 'daily' && alert.lastMatchedAt && Date.now() - alert.lastMatchedAt.getTime() < 20 * 3_600_000) {
      continue; // daily digests at most once per ~day
    }

    const minPct = SENSITIVITY_MIN_PCT[alert.sensitivity] ?? 99;
    const retailerFilter = (alert.retailerIds as string[] | null) ?? [];

    const matches = views.filter((v) => {
      if (+new Date(v.deal.lastConfirmedAt) <= since) return false;
      if (retailerFilter.length && !retailerFilter.includes(v.retailer.id)) return false;
      const pct = discountPercent(v.item.originalPrice, v.deal.bestPrice);
      if (alert.sensitivity === 'penny') {
        if (v.deal.bestPrice > 0.05) return false;
      } else if ((pct ?? 0) < minPct) return false;
      return v.reports.some(
        (r) => haversineKm(alert.lat!, alert.lng!, r.store.lat, r.store.lng) <= alert.radiusKm
      );
    });

    if (!matches.length) continue;

    const [user] = await db.select().from(schema.users).where(and(eq(schema.users.id, alert.userId)));
    if (!user) continue;

    const tpl = alertEmail({
      username: user.username,
      areaLabel: alert.postalCode,
      deals: matches.slice(0, 10).map((v) => ({
        name: v.item.name,
        retailer: v.retailer.name,
        original: v.item.originalPrice ? formatCad(v.item.originalPrice) : '—',
        price: formatCad(v.deal.bestPrice),
        where: v.reports[0] ? `${v.reports[0].store.city}, ${v.reports[0].store.province}` : 'Canada',
        url: siteUrl(`/item/${v.item.upc}`),
      })),
    });
    await sendEmail({ to: user.email, ...tpl, template: 'alert', userId: user.id });
    await db.update(schema.alerts).set({ lastMatchedAt: new Date() }).where(eq(schema.alerts.id, alert.id));
    matched++;
  }

  return NextResponse.json({ ok: true, matched });
}
