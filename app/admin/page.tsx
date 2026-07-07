import { loadCore } from '@/lib/data/source';
import { isDbConfigured, getDb, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { formatCad } from '@/lib/core/pricing';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const snap = await loadCore();
  const now = Date.now();
  const DAY = 86_400_000;

  const approved = snap.reports.filter((r) => r.moderationStatus === 'approved');
  const last7d = approved.filter((r) => now - +new Date(r.foundAt) < 7 * DAY);
  const verified = snap.deals.filter((d) => d.status === 'verified');
  const verificationRate = snap.deals.length
    ? Math.round((verified.length / snap.deals.length) * 100)
    : 0;

  let pendingCount = 0;
  let subscriberCount = 0;
  if (isDbConfigured()) {
    const db = getDb();
    pendingCount = (await db.select().from(schema.reports).where(eq(schema.reports.moderationStatus, 'pending'))).length;
    subscriberCount = (await db.select().from(schema.emailSubscribers)).length;
  }

  const provinceCounts = new Map<string, number>();
  for (const r of approved) {
    const store = snap.stores.find((s) => s.id === r.storeId);
    if (store) provinceCounts.set(store.province, (provinceCounts.get(store.province) ?? 0) + 1);
  }
  const topProvinces = [...provinceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totalValue = snap.users.reduce((sum, u) => sum + u.retailValueFound, 0);

  const stats = [
    { label: 'Live deals', value: String(snap.deals.filter((d) => d.status !== 'dead').length) },
    { label: 'Verified now', value: `${verified.length} (${verificationRate}%)` },
    { label: 'Reports (7 days)', value: String(last7d.length) },
    { label: 'Pending moderation', value: String(pendingCount) },
    { label: 'Hunters', value: String(snap.users.length) },
    { label: 'Email subscribers', value: String(subscriberCount) },
    { label: 'Retail value found', value: formatCad(totalValue) },
    { label: 'Tracked stores', value: String(snap.stores.length) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {!isDbConfigured() && (
        <p className="card mt-4 border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Demo mode: read-only stats from seed data. Set DATABASE_URL for live counts and moderation.
        </p>
      )}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="tnum text-2xl font-extrabold text-penny-600 dark:text-penny-400">{s.value}</p>
            <p className="mt-1 text-xs text-stone-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="card mt-6 p-5">
        <h2 className="font-bold">Top provinces by reports</h2>
        <div className="mt-3 space-y-2">
          {topProvinces.map(([prov, count]) => (
            <div key={prov} className="flex items-center gap-3">
              <span className="w-8 text-sm font-semibold">{prov}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                <div
                  className="h-full rounded-full bg-penny-500"
                  style={{ width: `${(count / (topProvinces[0]?.[1] ?? 1)) * 100}%` }}
                />
              </div>
              <span className="tnum w-10 text-right text-sm text-stone-500">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
