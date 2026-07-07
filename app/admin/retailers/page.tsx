import { getRetailers } from '@/lib/data/queries';

export const dynamic = 'force-dynamic';

export default async function AdminRetailers() {
  const retailers = await getRetailers(false);

  return (
    <div>
      <h1 className="text-2xl font-bold">Retailers ({retailers.length})</h1>
      <p className="mt-1 text-sm text-stone-500">
        Retailers are database records, not code — activate Phase-2 banners here as their communities grow.
        Decoder content and cadence notes are editable per retailer (rich text lives in{' '}
        <code className="font-mono">penny_notes_md</code> / <code className="font-mono">decoder_json</code>).
      </p>
      <div className="mt-6 space-y-3">
        {retailers.map((r) => (
          <div key={r.slug} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">
                <span className="chip mr-2 text-white" style={{ backgroundColor: r.brandColor }}>{r.name}</span>
                <span className="text-sm text-stone-500">/{r.slug} · Phase {r.phase}</span>
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {r.decoder.length} decoder signals · UPC lookup {r.supportsUpcLookup ? '✓' : '✗'} · SKU lookup {r.supportsSkuLookup ? '✓' : '✗'}
              </p>
            </div>
            <span className={`chip ${r.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-stone-100 text-stone-500 dark:bg-stone-800'}`}>
              {r.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>
      <p className="card mt-6 p-4 text-sm text-stone-500">
        Editing UI note: retailer CRUD writes go through the database (Drizzle schema <code className="font-mono">retailers</code>).
        In this release, toggling active state and editing decoder JSON is done via SQL or the seed script;
        the form-based editor is scoped in DECISIONS.md #12.
      </p>
    </div>
  );
}
