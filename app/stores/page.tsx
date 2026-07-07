import type { Metadata } from 'next';
import Link from 'next/link';
import { getStores } from '@/lib/data/queries';
import { resolvePostal } from '@/lib/data/queries';
import { formatKm, PROVINCES } from '@/lib/core/geo';

export const metadata: Metadata = {
  title: 'Store Finder — Tracked Canadian Stores',
  description:
    'Find tracked Home Depot, Walmart, and Dollar Tree locations near you by city or postal code, with penny-friendliness ratings and recent activity.',
  alternates: { canonical: '/stores' },
};

export const revalidate = 3600;

export default async function StoresPage({
  searchParams,
}: {
  searchParams: { q?: string; postal?: string };
}) {
  const near = searchParams.postal ? resolvePostal(searchParams.postal) : null;
  const stores = await getStores({
    q: searchParams.q,
    near: near ? { lat: near.lat, lng: near.lng, radiusKm: 100 } : undefined,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Store finder</h1>
      <p className="mt-2 text-stone-500">
        Search by city, store name, or postal code / FSA. The friendliness score is the community&apos;s 1–5
        rating of how often penny finds get honoured there.
      </p>

      <form className="mt-6 flex flex-col gap-2 sm:flex-row" action="/stores">
        <label className="sr-only" htmlFor="store-q">City or store name</label>
        <input id="store-q" name="q" defaultValue={searchParams.q} placeholder="City or store name…" className="input flex-1" />
        <label className="sr-only" htmlFor="store-postal">Postal code</label>
        <input id="store-postal" name="postal" defaultValue={searchParams.postal} placeholder="Postal code / FSA" className="input sm:!w-48" />
        <button type="submit" className="btn-primary">Search</button>
      </form>
      {searchParams.postal && !near && (
        <p className="mt-2 text-sm text-red-500">
          Couldn&apos;t place that postal code — try the 3-character FSA (e.g. T2P).
        </p>
      )}

      <div className="mt-6 space-y-3">
        {stores.slice(0, 40).map((s) => (
          <Link
            key={s.id}
            href={`/stores/${s.retailer.slug}/${s.province.toLowerCase()}/${s.slug}`}
            className="card flex flex-wrap items-center justify-between gap-3 p-4 transition-shadow hover:shadow-md"
          >
            <div>
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-stone-500">
                {s.address} · {s.city}, {PROVINCES[s.province] ?? s.province} {s.postalCode}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {s.distanceKm != null && <span className="text-stone-500">{formatKm(s.distanceKm)}</span>}
              {s.friendlinessAvg != null && (
                <span className="chip bg-penny-100 text-penny-800 dark:bg-penny-950 dark:text-penny-300">
                  🪙 {Number(s.friendlinessAvg).toFixed(1)}/5
                </span>
              )}
            </div>
          </Link>
        ))}
        {stores.length === 0 && (
          <p className="card p-6 text-center text-stone-500">
            No stores matched. The launch database covers the 15 largest metros — the full national list loads
            via the admin CSV importer.
          </p>
        )}
      </div>
    </div>
  );
}
