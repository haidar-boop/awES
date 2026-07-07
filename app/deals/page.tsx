import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getDealViews, getRetailers } from '@/lib/data/queries';
import { parseDealFilters, type SearchParams } from '@/lib/data/searchparams';
import { DealCard } from '../components/DealCard';
import { FiltersBar } from '../components/FiltersBar';
import { EmptyState } from '../components/EmptyState';
import { JsonLd, breadcrumbLd } from '../components/JsonLd';
import { siteUrl } from '@/lib/utils';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Live Penny List — Deals Scanning $0.01 in Canada Right Now',
  description:
    'Filterable live feed of community-reported penny items and hidden clearance across Canada. Filter by retailer, province, price, and distance from your postal code.',
  alternates: { canonical: '/deals' },
};

export const revalidate = 300;

export default async function DealsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseDealFilters(searchParams);
  const [views, retailers] = await Promise.all([getDealViews(filters), getRetailers()]);

  return (
    <div className="mx-auto max-w-6xl px-4">
      <JsonLd data={breadcrumbLd(siteUrl(), [{ name: 'Home', path: '/' }, { name: 'Deals', path: '/deals' }])} />
      <div className="flex items-end justify-between gap-4 py-6">
        <div>
          <h1 className="text-3xl font-bold">Live penny list</h1>
          <p className="mt-1 text-sm text-stone-500">
            {views.length} deal{views.length === 1 ? '' : 's'} · community-reported, not guaranteed ·{' '}
            <Link href="/deals/map" className="font-semibold text-penny-600 hover:underline dark:text-penny-400">
              map view →
            </Link>
          </p>
        </div>
      </div>

      <Suspense>
        <FiltersBar retailers={retailers.map((r) => ({ slug: r.slug, name: r.name }))} />
      </Suspense>

      <div className="py-6">
        {views.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {views.map((view) => (
              <DealCard key={view.deal.id} view={view} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
