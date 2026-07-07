import { getStores } from '@/lib/data/queries';
import { PROVINCES } from '@/lib/core/geo';

export const dynamic = 'force-dynamic';

export default async function AdminStores() {
  const stores = await getStores();
  const byProvince = new Map<string, number>();
  for (const s of stores) byProvince.set(s.province, (byProvince.get(s.province) ?? 0) + 1);

  return (
    <div>
      <h1 className="text-2xl font-bold">Stores ({stores.length})</h1>
      <div className="card mt-4 p-4 text-sm text-stone-500">
        <p className="font-semibold text-stone-700 dark:text-stone-300">CSV import</p>
        <p className="mt-1">
          Load the full national list with{' '}
          <code className="font-mono">npm run db:import-stores stores.csv</code> — columns{' '}
          <code className="font-mono">retailer_slug,name,address,city,province,postal_code,lat,lng</code>.
          Rows without coordinates are geocoded via Nominatim automatically.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {[...byProvince.entries()].sort().map(([prov, n]) => (
          <span key={prov} className="chip bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            {PROVINCES[prov] ?? prov}: {n}
          </span>
        ))}
      </div>
      <div className="mt-6 space-y-2">
        {stores.map((s) => (
          <div key={s.id} className="card flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
            <span className="font-medium">{s.name}</span>
            <span className="text-stone-500">
              {s.city}, {s.province} · {s.postalCode} · {s.lat.toFixed(3)}, {s.lng.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
