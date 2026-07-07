import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getStorePage, getStores } from '@/lib/data/queries';
import { PROVINCES } from '@/lib/core/geo';
import { DealCard } from '../../../../components/DealCard';
import { JsonLd, breadcrumbLd } from '../../../../components/JsonLd';
import { EmptyState } from '../../../../components/EmptyState';
import { siteUrl } from '@/lib/utils';

export const revalidate = 300;

export async function generateStaticParams() {
  const stores = await getStores();
  return stores.map((s) => ({
    retailer: s.retailer.slug,
    prov: s.province.toLowerCase(),
    slug: s.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { retailer: string; prov: string; slug: string };
}): Promise<Metadata> {
  const page = await getStorePage(params.retailer, params.prov, params.slug);
  if (!page) return {};
  return {
    title: `${page.store.name} — Penny Finds & Markdowns at This Store`,
    description: `Everything reported at ${page.store.name} (${page.store.city}, ${page.store.province}): live penny items, hidden clearance, and the community penny-friendliness rating.`,
    alternates: { canonical: `/stores/${params.retailer}/${params.prov}/${params.slug}` },
  };
}

export default async function StorePage({
  params,
}: {
  params: { retailer: string; prov: string; slug: string };
}) {
  const page = await getStorePage(params.retailer, params.prov, params.slug);
  if (!page) notFound();
  const { store, retailer, views } = page;

  const mapsUrl = `https://www.openstreetmap.org/?mlat=${store.lat}&mlon=${store.lng}#map=16/${store.lat}/${store.lng}`;
  const activity = views.filter(
    (v) => Date.now() - +new Date(v.deal.lastConfirmedAt) < 30 * 86_400_000
  ).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: store.name,
          address: {
            '@type': 'PostalAddress',
            streetAddress: store.address,
            addressLocality: store.city,
            addressRegion: store.province,
            postalCode: store.postalCode,
            addressCountry: 'CA',
          },
          geo: { '@type': 'GeoCoordinates', latitude: store.lat, longitude: store.lng },
          parentOrganization: { '@type': 'Organization', name: retailer.name },
        }}
      />
      <JsonLd
        data={breadcrumbLd(siteUrl(), [
          { name: 'Home', path: '/' },
          { name: 'Stores', path: '/stores' },
          { name: retailer.name, path: `/retailers/${retailer.slug}` },
          { name: store.name, path: `/stores/${params.retailer}/${params.prov}/${params.slug}` },
        ])}
      />

      <nav className="text-sm text-stone-500" aria-label="Breadcrumb">
        <Link href="/stores" className="hover:underline">Stores</Link> ›{' '}
        <Link href={`/retailers/${retailer.slug}`} className="hover:underline">{retailer.name}</Link> › {store.city}
      </nav>
      <h1 className="mt-2 text-3xl font-bold">{store.name}</h1>
      <p className="mt-1 text-stone-500">
        {store.address}, {store.city}, {PROVINCES[store.province]} {store.postalCode} ·{' '}
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-penny-600 hover:underline dark:text-penny-400">
          map & directions →
        </a>
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {store.friendlinessAvg != null && (
          <span className="chip bg-penny-100 px-3 py-1.5 text-penny-800 dark:bg-penny-950 dark:text-penny-300">
            🪙 Penny-friendliness {Number(store.friendlinessAvg).toFixed(1)}/5 ({store.friendlinessCount} ratings)
          </span>
        )}
        <span className="chip bg-stone-100 px-3 py-1.5 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          {activity} active deal{activity === 1 ? '' : 's'} in the last 30 days
        </span>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Reported at this store</h2>
        <div className="mt-4">
          {views.length === 0 ? (
            <EmptyState area={store.name} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {views.map((v) => (
                <DealCard key={v.deal.id} view={v} />
              ))}
            </div>
          )}
        </div>
      </section>

      <p className="mt-8 text-xs text-stone-400">
        Friendliness ratings reflect community experience of whether penny scans get honoured here — they are
        anecdotes, not store policy. Staff always have the right to refuse a pennied item.
      </p>
    </div>
  );
}
