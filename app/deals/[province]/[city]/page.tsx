import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDealViews, getStores, getAreaStats, getCities } from '@/lib/data/queries';
import { PROVINCES, isProvinceCode } from '@/lib/core/geo';
import { DealCard } from '../../../components/DealCard';
import { EmptyState } from '../../../components/EmptyState';
import { JsonLd, breadcrumbLd } from '../../../components/JsonLd';
import { siteUrl } from '@/lib/utils';

export const revalidate = 300;

export async function generateStaticParams() {
  const cities = await getCities();
  return cities.map((c) => ({ province: c.province.toLowerCase(), city: c.slug }));
}

async function resolveCity(provinceParam: string, citySlug: string) {
  const code = provinceParam.toUpperCase();
  if (!isProvinceCode(code)) return null;
  const cities = await getCities();
  const city = cities.find((c) => c.province === code && c.slug === citySlug);
  return city ? { code, city } : null;
}

export async function generateMetadata({
  params,
}: {
  params: { province: string; city: string };
}): Promise<Metadata> {
  const resolved = await resolveCity(params.province, params.city);
  if (!resolved) return {};
  const stats = await getAreaStats(resolved.code, resolved.city.city);
  return {
    title: `Penny Deals in ${resolved.city.city}, ${resolved.code} — Live Penny List & Hidden Clearance`,
    description: `${stats.thisMonth} penny finds reported in ${resolved.city.city} this month. Community-verified $0.01 items and hidden clearance near you.`,
    alternates: { canonical: `/deals/${params.province}/${params.city}` },
    robots: stats.total >= 3 ? undefined : { index: false, follow: true },
  };
}

export default async function CityPage({ params }: { params: { province: string; city: string } }) {
  const resolved = await resolveCity(params.province, params.city);
  if (!resolved) notFound();
  const { code, city } = resolved;

  const [views, stores, stats] = await Promise.all([
    getDealViews({ provinces: [code], city: city.city, sort: 'newest' }),
    getStores({ province: code, city: city.city }),
    getAreaStats(code, city.city),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd
        data={breadcrumbLd(siteUrl(), [
          { name: 'Home', path: '/' },
          { name: 'Deals', path: '/deals' },
          { name: PROVINCES[code], path: `/deals/${params.province}` },
          { name: city.city, path: `/deals/${params.province}/${params.city}` },
        ])}
      />
      <nav className="text-sm text-stone-500" aria-label="Breadcrumb">
        <Link href="/deals" className="hover:underline">Deals</Link> ›{' '}
        <Link href={`/deals/${params.province}`} className="hover:underline">{PROVINCES[code]}</Link> › {city.city}
      </nav>
      <h1 className="mt-2 text-3xl font-bold">Penny deals in {city.city}, {code}</h1>
      <p className="mt-2 text-stone-500">
        {stats.thisMonth} finds reported this month · {stores.length} tracked store{stores.length === 1 ? '' : 's'}
      </p>

      {stores.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {stores.map((s) => (
            <Link
              key={s.id}
              href={`/stores/${s.retailer.slug}/${s.province.toLowerCase()}/${s.slug}`}
              className="chip border border-stone-300 bg-white text-stone-600 hover:border-penny-500 hover:text-penny-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        {views.length === 0 ? (
          <EmptyState area={`${city.city}, ${code}`} />
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
