import { getDealViews } from '@/lib/data/queries';
import { formatCad, discountLabel } from '@/lib/core/pricing';
import { siteUrl } from '@/lib/utils';

export const revalidate = 300;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** RSS feed of verified deals (spec §9) — for Discord bots and syndication. */
export async function GET() {
  const views = (await getDealViews({ status: 'verified', sort: 'newest' })).slice(0, 50);

  const items = views
    .map((v) => {
      const url = siteUrl(`/item/${v.item.upc}`);
      const provinces = Object.entries(v.provinceCounts)
        .map(([p, n]) => `${p} ×${n}`)
        .join(', ');
      const desc = `${v.retailer.name} — ${v.item.originalPrice ? `was ${formatCad(v.item.originalPrice)}, ` : ''}now ${formatCad(v.deal.bestPrice)}${
        discountLabel(v.item.originalPrice, v.deal.bestPrice) ? ` (${discountLabel(v.item.originalPrice, v.deal.bestPrice)})` : ''
      }. Reported in: ${provinces || 'Canada'}. UPC ${v.item.upc}.`;
      return `<item>
  <title>${esc(`${formatCad(v.deal.bestPrice)} — ${v.item.name}`)}</title>
  <link>${url}</link>
  <guid isPermaLink="true">${url}</guid>
  <pubDate>${new Date(v.deal.lastConfirmedAt).toUTCString()}</pubDate>
  <description>${esc(desc)}</description>
</item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>PennyRadar Canada — Verified Penny Deals</title>
  <link>${siteUrl('/deals')}</link>
  <description>Community-verified penny items and hidden clearance across Canada. Prices community-reported, not guaranteed.</description>
  <language>en-ca</language>
  <ttl>15</ttl>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
