import type { Metadata } from 'next';
import Link from 'next/link';
import { getRetailers, getDealViews } from '@/lib/data/queries';

export const metadata: Metadata = {
  title: 'Retailers — Penny Mechanics by Canadian Store',
  description:
    'How penny items and hidden clearance work at each Canadian retailer: Home Depot Canada, Walmart Canada, Dollar Tree, and the Phase-2 roster.',
  alternates: { canonical: '/retailers' },
};

export const revalidate = 3600;

export default async function RetailersPage() {
  const [active, all, views] = await Promise.all([
    getRetailers(true),
    getRetailers(false),
    getDealViews({}),
  ]);
  const inactive = all.filter((r) => !r.active);
  const countByRetailer = new Map<string, number>();
  for (const v of views) {
    countByRetailer.set(v.retailer.slug, (countByRetailer.get(v.retailer.slug) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Retailers</h1>
      <p className="mt-2 max-w-2xl text-stone-500">
        Every retailer runs its markdown system differently. Each hub collects the live deals, tag decoding,
        cadence notes, and store directory for that banner.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {active.map((r) => (
          <Link key={r.slug} href={`/retailers/${r.slug}`} className="card group p-6 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="chip text-white" style={{ backgroundColor: r.brandColor }}>{r.name}</span>
              <span className="text-sm text-stone-500">{countByRetailer.get(r.slug) ?? 0} live deals</span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {r.pennyNotesMd.split('\n')[0].replace(/\*\*/g, '')}
            </p>
            <p className="mt-3 text-sm font-semibold text-penny-600 group-hover:underline dark:text-penny-400">
              Open hub →
            </p>
          </Link>
        ))}
      </div>

      {inactive.length > 0 && (
        <>
          <h2 className="mt-12 text-xl font-bold">Coming in Phase 2</h2>
          <p className="mt-1 text-sm text-stone-500">
            Decoder notes are already written — these banners activate as their communities grow.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {inactive.map((r) => (
              <span key={r.slug} className="chip border border-stone-300 text-stone-500 dark:border-stone-700">
                {r.name}
              </span>
            ))}
            <span className="chip border border-dashed border-stone-300 text-stone-400 dark:border-stone-700">
              + Superstore, Shoppers, Princess Auto, Staples, Best Buy…
            </span>
          </div>
        </>
      )}
    </div>
  );
}
