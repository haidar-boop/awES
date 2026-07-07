import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { getDealViews, getRetailers } from '@/lib/data/queries';
import { parseDealFilters, type SearchParams } from '@/lib/data/searchparams';
import { DealMap } from '../../components/DealMap';
import { FiltersBar } from '../../components/FiltersBar';

export const metadata: Metadata = {
  title: 'Penny Deal Map — Reports by Store Across Canada',
  description:
    'Every community-reported penny item and hidden clearance find, plotted by store and colour-coded by confidence.',
  alternates: { canonical: '/deals/map' },
};

export const revalidate = 300;

export default async function DealsMapPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseDealFilters(searchParams);
  const [views, retailers] = await Promise.all([getDealViews(filters), getRetailers()]);

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="flex items-end justify-between gap-4 py-6">
        <div>
          <h1 className="text-3xl font-bold">Deal map</h1>
          <p className="mt-1 text-sm text-stone-500">
            Pins cluster by store · colour = confidence ·{' '}
            <Link href="/deals" className="font-semibold text-penny-600 hover:underline dark:text-penny-400">
              list view →
            </Link>
          </p>
        </div>
        <div className="hidden items-center gap-3 text-xs text-stone-500 sm:flex" aria-hidden>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-emerald-600" /> Verified</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-600" /> Likely</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-stone-500" /> Unconfirmed</span>
        </div>
      </div>
      <Suspense>
        <FiltersBar retailers={retailers.map((r) => ({ slug: r.slug, name: r.name }))} />
      </Suspense>
      <div className="py-6">
        <DealMap views={views} />
      </div>
    </div>
  );
}
