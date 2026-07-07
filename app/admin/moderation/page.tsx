import { isDbConfigured, getDb, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { formatCad } from '@/lib/core/pricing';
import { formatDate } from '@/lib/utils';
import { ModerateButtons, PurgeSamplesButton } from '../parts';

export const dynamic = 'force-dynamic';

export default async function ModerationPage() {
  if (!isDbConfigured()) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Moderation queue</h1>
        <p className="card mt-4 p-6 text-sm text-stone-500">
          Demo mode: the queue needs a database. With DATABASE_URL set, pending reports from new accounts
          appear here for approve/reject with reasons.
        </p>
      </div>
    );
  }

  const db = getDb();
  const pending = await db
    .select({
      report: schema.reports,
      item: schema.items,
      store: schema.stores,
      user: schema.users,
    })
    .from(schema.reports)
    .innerJoin(schema.deals, eq(schema.reports.dealId, schema.deals.id))
    .innerJoin(schema.items, eq(schema.deals.itemId, schema.items.id))
    .innerJoin(schema.stores, eq(schema.reports.storeId, schema.stores.id))
    .innerJoin(schema.users, eq(schema.reports.userId, schema.users.id))
    .where(eq(schema.reports.moderationStatus, 'pending'))
    .limit(50);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Moderation queue ({pending.length})</h1>
        <PurgeSamplesButton />
      </div>
      <div className="mt-6 space-y-4">
        {pending.map(({ report, item, store, user }) => (
          <div key={report.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {item.name}
                  <span className="ml-2 font-mono text-sm text-stone-500">UPC {item.upc}</span>
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {formatCad(Number(report.scannedPrice))} at {store.name} ({store.city}, {store.province}) ·{' '}
                  found {formatDate(report.foundAt)} · by @{user.username} ({user.approvedReports} approved)
                  {report.hasReceipt && ' · 🧾 receipt attached'}
                </p>
                {report.locationNote && <p className="mt-1 text-sm italic text-stone-400">“{report.locationNote}”</p>}
                {report.notes && <p className="mt-1 text-sm text-stone-500">{report.notes}</p>}
              </div>
              <ModerateButtons reportId={report.id} />
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <p className="card p-8 text-center text-stone-500">Queue is clear. 🎉</p>
        )}
      </div>
    </div>
  );
}
