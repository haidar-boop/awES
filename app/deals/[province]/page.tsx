import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDealViews, getStores, getAreaStats } from '@/lib/data/queries';
import { PROVINCES, PROVINCE_CODES, isProvinceCode } from '@/lib/core/geo';
import { DealCard } from '../../components/DealCard';
import { EmptyState } from '../../components/EmptyState';
import { JsonLd, breadcrumbLd } from '../../components/JsonLd';
import { siteUrl } from '@/lib/utils';

export const revalidate = 300;

export function generateStaticParams() {
  return PROVINCE_CODES.map((p) => ({ province: p.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: { province: string } }): Promise<Metadata> {
  const code = params.province.toUpperCase();
  if (!isProvinceCode(code)) return {};
  const name = PROVINCES[code];
  const stats = await getAreaStats(code);
  return {
    title: `Penny Deals in ${name} — Live Penny List & Hidden Clearance`,
    description: `${stats.thisMonth} penny finds reported in ${name} this month. Live community-verified list of $0.01 items and hidden clearance at Home Depot, Walmart, and Dollar Tree in ${name}.`,
    alternates: { canonical: `/deals/${params.province.toLowerCase()}` },
    // Thin-content protection (spec §4.11)
    robots: stats.total >= 3 ? undefined : { index: false, follow: true },
  };
}

export default async function ProvincePage({ params }: { params: { province: string } }) {
  const code = params.province.toUpperCase();
  if (!isProvinceCode(code)) notFound();
  const name = PROVINCES[code];

  const [views, stores, stats] = await Promise.all([
    getDealViews({ provinces: [code], sort: 'newest' }),
    getStores({ province: code }),
    getAreaStats(code),
  ]);

  const cities = [...new Set(stores.map((s) => s.city))].sort();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd
        data={breadcrumbLd(siteUrl(), [
          { name: 'Home', path: '/' },
          { name: 'Deals', path: '/deals' },
          { name: name, path: `/deals/${params.province.toLowerCase()}` },
        ])}
      />
      <h1 className="text-3xl font-bold">Penny deals in {name}</h1>
      <p className="mt-2 text-stone-500">
        {stats.thisMonth} finds reported this month · {stats.verified} currently verified · {stores.length} tracked stores
      </p>

      {cities.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {cities.map((city) => (
            <Link
              key={city}
              href={`/deals/${params.province.toLowerCase()}/${city.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')}`}
              className="chip border border-stone-300 bg-white text-stone-600 hover:border-penny-500 hover:text-penny-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
            >
              {city}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        {views.length === 0 ? (
          <EmptyState area={name} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {views.map((view) => (
              <DealCard key={view.deal.id} view={view} />
            ))}
          </div>
        )}
      </div>

      <div className="card mt-10 p-6">
        <h2 className="text-lg font-bold">Hunting in {name}?</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          Penny items are systematic, not luck: retailers drop unsold clearance SKUs to $0.01 as an internal
          pull signal, and items missed by staff still scan for a penny. Learn the tag signals in the{' '}
          <Link href="/decoder" className="font-semibold text-penny-600 hover:underline dark:text-penny-400">tag decoder</Link>, verify with the{' '}
          <Link href="/lookup" className="font-semibold text-penny-600 hover:underline dark:text-penny-400">UPC lookup</Link>, and report your finds to power the {name} list.
          Note: tax in {code} applies to the scanned price, and cash totals round to the nearest 5¢.
        </p>
      </div>
    </div>
  );
}
