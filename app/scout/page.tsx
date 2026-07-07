import type { Metadata } from 'next';
import Link from 'next/link';
import { listScouts, scoutDueDate, PENNY_WATCH_DAYS } from '@/lib/local/store';
import { getRetailers } from '@/lib/data/queries';
import { formatCad } from '@/lib/core/pricing';
import { formatDate } from '@/lib/utils';
import { ScoutForm, ScoutActions } from './parts';

export const metadata: Metadata = {
  title: 'Scout Tracker — Your Penny-Watch List',
  description:
    'Log late-stage clearance tags you spot, and the tracker tells you when the 14-week penny window opens at your stores.',
  robots: { index: false },
};

export const dynamic = 'force-dynamic';

type DueStatus = 'due' | 'soon' | 'upcoming';

function dueStatus(due: Date): { status: DueStatus; label: string } {
  const days = Math.ceil((+due - Date.now()) / 86_400_000);
  if (days <= 0) return { status: 'due', label: days === 0 ? 'Due today' : `Window open ${-days}d` };
  if (days <= 7) return { status: 'soon', label: `Due in ${days}d` };
  return { status: 'upcoming', label: `~${formatDate(due)}` };
}

const STATUS_STYLE: Record<DueStatus, string> = {
  due: 'bg-penny-500 text-white',
  soon: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  upcoming: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
};

export default async function ScoutPage() {
  const [scouts, retailers] = await Promise.all([Promise.resolve(listScouts()), getRetailers()]);
  const active = scouts.filter((s) => !s.done);
  const archived = scouts.filter((s) => s.done);
  const retailerName = (slug: string) => retailers.find((r) => r.slug === slug)?.name ?? slug;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">🔭 Scout tracker</h1>
      <p className="mt-2 text-stone-500">
        Spot a late-stage tag (.02/.03/.04 at Home Depot)? Log it with the clearance date printed on the tag.
        The tracker computes when the <strong>{PENNY_WATCH_DAYS}-day (~14 week) penny window</strong> opens and
        surfaces what&apos;s due — so you drive back exactly when it matters. Entries are saved on this device.
      </p>

      {active.length > 0 && (
        <div className="mt-8 space-y-3">
          {active.map((s) => {
            const due = scoutDueDate(s.clearanceDate);
            const { status, label } = dueStatus(due);
            return (
              <div key={s.id} className={`card p-4 ${status === 'due' ? 'border-penny-500' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {s.name}
                      <span className="ml-2 text-sm font-normal text-stone-500">
                        {formatCad(s.taggedPrice)} tagged
                      </span>
                    </p>
                    <p className="mt-0.5 text-sm text-stone-500">
                      {retailerName(s.retailerSlug)} · {s.storeLabel} · tag dated {formatDate(s.clearanceDate)}
                      {s.upc && (
                        <>
                          {' · '}
                          <Link href={`/item/${s.upc}`} className="font-mono text-penny-600 hover:underline dark:text-penny-400">
                            {s.upc}
                          </Link>
                        </>
                      )}
                    </p>
                    {s.note && <p className="mt-1 text-sm italic text-stone-400">“{s.note}”</p>}
                    {s.lastCheckedAt && (
                      <p className="mt-1 text-xs text-stone-400">Last checked {formatDate(s.lastCheckedAt)}</p>
                    )}
                  </div>
                  <span className={`chip ${STATUS_STYLE[status]}`}>{label}</span>
                </div>
                <ScoutActions
                  id={s.id}
                  upc={s.upc}
                  retailerSlug={s.retailerSlug}
                  isDue={status !== 'upcoming'}
                />
              </div>
            );
          })}
        </div>
      )}

      {active.length === 0 && (
        <div className="card mt-8 p-8 text-center text-stone-500">
          <p className="text-3xl" aria-hidden>🏷️</p>
          <p className="mt-2">
            Nothing on watch yet. Next store run, photograph late-stage clearance tags and log them below —
            future-you gets a &quot;due this week&quot; list instead of a shoebox of tag photos.
          </p>
        </div>
      )}

      <ScoutForm retailers={retailers.map((r) => ({ slug: r.slug, name: r.name }))} />

      {archived.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-semibold text-stone-500">
            Archive ({archived.length})
          </summary>
          <div className="mt-3 space-y-2">
            {archived.map((s) => (
              <div key={s.id} className="card flex items-center justify-between gap-3 p-3 text-sm opacity-70">
                <span>
                  {s.name} · {retailerName(s.retailerSlug)} · tagged {formatCad(s.taggedPrice)}
                </span>
                <ScoutActions id={s.id} upc={s.upc} retailerSlug={s.retailerSlug} isDue={false} archived />
              </div>
            ))}
          </div>
        </details>
      )}

      <p className="mt-8 text-xs leading-relaxed text-stone-400">
        The 14-week pattern is a community heuristic, not a guarantee — some cycles run 6–8 months. When a
        scout comes due, verify with the barcode at a price checker before committing to the aisle crawl.
        Read more in the <Link href="/guides/home-depot-canada-penny-guide" className="underline hover:text-penny-600">Home Depot guide</Link>.
      </p>
    </div>
  );
}
