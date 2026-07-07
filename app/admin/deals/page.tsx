import { getDealViews } from '@/lib/data/queries';
import { formatCad } from '@/lib/core/pricing';
import { timeAgo } from '@/lib/utils';
import { ConfidenceBadge } from '../../components/ConfidenceBadge';
import { DealAdminButtons } from '../parts';

export const dynamic = 'force-dynamic';

export default async function AdminDeals() {
  const views = await getDealViews({ includeDead: true, sort: 'newest' });

  return (
    <div>
      <h1 className="text-2xl font-bold">Deals ({views.length})</h1>
      <p className="mt-1 text-sm text-stone-500">
        Feature a deal for the homepage hero, or mark it dead. Merging happens automatically on duplicate UPC +
        store reports.
      </p>
      <div className="mt-6 space-y-3">
        {views.map((v) => (
          <div key={v.deal.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {v.deal.featured && <span title="Featured">★ </span>}
                {formatCad(v.deal.bestPrice)} — {v.item.name}
                {v.deal.isSample && <span className="chip ml-2 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">sample</span>}
              </p>
              <p className="text-sm text-stone-500">
                {v.retailer.name} · {v.reports.length} report{v.reports.length === 1 ? '' : 's'} · updated {timeAgo(v.deal.lastConfirmedAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ConfidenceBadge status={v.deal.status} />
              <DealAdminButtons dealId={v.deal.id} featured={v.deal.featured} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
