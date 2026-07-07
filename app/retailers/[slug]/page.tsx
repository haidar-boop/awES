import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRetailer, getRetailers, getDealViews, getStores } from '@/lib/data/queries';
import { PROVINCES } from '@/lib/core/geo';
import { DealCard } from '../../components/DealCard';
import { Markdown } from '../../components/Markdown';
import { JsonLd, breadcrumbLd } from '../../components/JsonLd';
import { EmptyState } from '../../components/EmptyState';
import { siteUrl } from '@/lib/utils';
import { ARTICLES } from '@/lib/content/articles';

export const revalidate = 300;

export async function generateStaticParams() {
  const retailers = await getRetailers(false);
  return retailers.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const retailer = await getRetailer(params.slug);
  if (!retailer) return {};
  return {
    title: `${retailer.name} Penny List — Live Deals, Tag Decoder & Stores`,
    description: `How penny items work at ${retailer.name}: live community-reported deals, clearance tag decoding, markdown cadence, and the store directory by province.`,
    alternates: { canonical: `/retailers/${retailer.slug}` },
  };
}

const GUIDE_BY_RETAILER: Record<string, string> = {
  'home-depot-canada': 'home-depot-canada-penny-guide',
  'walmart-canada': 'walmart-canada-hidden-clearance',
  'dollar-tree-canada': 'dollar-tree-canada-penny-list',
};

export default async function RetailerHub({ params }: { params: { slug: string } }) {
  const retailer = await getRetailer(params.slug);
  if (!retailer) notFound();

  const [views, stores] = await Promise.all([
    getDealViews({ retailers: [retailer.slug], sort: 'newest' }),
    getStores({ retailerSlug: retailer.slug }),
  ]);

  const byProvince = new Map<string, typeof stores>();
  for (const s of stores) {
    const list = byProvince.get(s.province) ?? [];
    list.push(s);
    byProvince.set(s.province, list);
  }
  const guide = ARTICLES.find((a) => a.slug === GUIDE_BY_RETAILER[retailer.slug]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd
        data={breadcrumbLd(siteUrl(), [
          { name: 'Home', path: '/' },
          { name: 'Retailers', path: '/retailers' },
          { name: retailer.name, path: `/retailers/${retailer.slug}` },
        ])}
      />
      <span className="chip text-white" style={{ backgroundColor: retailer.brandColor }}>{retailer.name}</span>
      <h1 className="mt-3 text-3xl font-bold">{retailer.name} penny list</h1>
      <p className="mt-1 text-stone-500">{views.length} live deals · {stores.length} tracked stores</p>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Live deals</h2>
        <div className="mt-4">
          {views.length === 0 ? (
            <EmptyState area={retailer.name} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {views.slice(0, 9).map((v) => (
                <DealCard key={v.deal.id} view={v} />
              ))}
            </div>
          )}
        </div>
        {views.length > 9 && (
          <Link href={`/deals?retailer=${retailer.slug}`} className="btn-secondary mt-4">
            All {views.length} {retailer.name} deals →
          </Link>
        )}
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-xl font-bold">How pennies work here</h2>
          <Markdown className="mt-3 text-sm">{retailer.pennyNotesMd}</Markdown>
        </section>
        <section className="card p-6">
          <h2 className="text-xl font-bold">Markdown cadence</h2>
          <Markdown className="mt-3 text-sm">{retailer.cadenceNotesMd}</Markdown>
          <Link href="/decoder" className="mt-4 inline-block text-sm font-semibold text-penny-600 hover:underline dark:text-penny-400">
            Full tag decoder with quiz →
          </Link>
          {guide && (
            <Link href={`/guides/${guide.slug}`} className="mt-2 block text-sm font-semibold text-penny-600 hover:underline dark:text-penny-400">
              📖 {guide.title} →
            </Link>
          )}
        </section>
      </div>

      {stores.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Store directory</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...byProvince.entries()]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([prov, list]) => (
                <div key={prov}>
                  <h3 className="font-semibold text-stone-500">{PROVINCES[prov] ?? prov}</h3>
                  <ul className="mt-2 space-y-1.5">
                    {list.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/stores/${retailer.slug}/${s.province.toLowerCase()}/${s.slug}`}
                          className="text-sm text-penny-600 hover:underline dark:text-penny-400"
                        >
                          {s.name.replace(`${retailer.name.replace(' Canada', '')} — `, '')}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
