import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, getDb, schema } from '@/lib/db';
import { getDealViews, getLeaderboard } from '@/lib/data/queries';
import { formatCad } from '@/lib/core/pricing';
import { PROVINCES } from '@/lib/core/geo';
import { sendEmail, digestEmail } from '@/lib/email';
import { siteUrl } from '@/lib/utils';
import { eq } from 'drizzle-orm';

/**
 * Weekly digest (spec §4.5): "This week's penny finds in {province}" —
 * top 10 deals + leaderboard highlights per subscriber province.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDbConfigured()) return NextResponse.json({ ok: true, demo: true, sent: 0 });

  const db = getDb();
  const subscribers = await db.select().from(schema.emailSubscribers);
  const optedInUsers = await db.select().from(schema.users).where(eq(schema.users.emailDigest, true));

  const recipients = [
    ...subscribers.map((s) => ({ email: s.email, province: s.province ?? 'ON', userId: undefined as string | undefined })),
    ...optedInUsers.map((u) => ({ email: u.email, province: u.homeProvince ?? 'ON', userId: u.id })),
  ];
  const byProvince = new Map<string, typeof recipients>();
  for (const r of recipients) {
    const list = byProvince.get(r.province) ?? [];
    list.push(r);
    byProvince.set(r.province, list);
  }

  let sent = 0;
  for (const [province, recips] of byProvince) {
    const views = (await getDealViews({ provinces: [province], recencyHours: 24 * 7, sort: 'confirmed' })).slice(0, 10);
    if (!views.length) continue;
    const leaders = (await getLeaderboard(province)).slice(0, 3);

    const tpl = digestEmail({
      province: PROVINCES[province] ?? province,
      deals: views.map((v) => ({
        name: v.item.name,
        retailer: v.retailer.name,
        original: v.item.originalPrice ? formatCad(v.item.originalPrice) : '—',
        price: formatCad(v.deal.bestPrice),
        where: v.reports[0] ? `${v.reports[0].store.city}, ${v.reports[0].store.province}` : province,
        url: siteUrl(`/item/${v.item.upc}`),
      })),
      leaders: leaders.map((l) => ({ username: l.user.username, value: formatCad(l.retailValue) })),
    });

    for (const r of recips) {
      await sendEmail({ to: r.email, ...tpl, template: 'digest', userId: r.userId });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
