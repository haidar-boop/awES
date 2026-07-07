import type { Metadata } from 'next';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { isDbConfigured, getDb, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { AlertForm, DeleteAlertButton } from './parts';
import { getRetailers } from '@/lib/data/queries';

export const metadata: Metadata = { title: 'Area Alerts', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  const user = await getSessionUser();
  const retailers = await getRetailers();

  let alerts: (typeof schema.alerts.$inferSelect)[] = [];
  if (user && isDbConfigured()) {
    alerts = await getDb()
      .select()
      .from(schema.alerts)
      .where(and(eq(schema.alerts.userId, user.id), eq(schema.alerts.active, true)));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Area alerts</h1>
      <p className="mt-2 text-stone-500">
        Postal code + radius + sensitivity → an email the moment a matching deal is reported near you.
        Free accounts get 1 alert on a daily digest;{' '}
        <Link href="/pro" className="font-semibold text-penny-600 hover:underline dark:text-penny-400">Pro</Link>{' '}
        unlocks unlimited alerts and instant delivery.
      </p>

      {!user ? (
        <div className="card mt-6 p-6 text-center">
          <p className="font-semibold">Sign in to set up alerts</p>
          <Link href="/account" className="btn-primary mt-4">Sign in</Link>
        </div>
      ) : (
        <>
          {alerts.length > 0 && (
            <div className="mt-6 space-y-3">
              {alerts.map((a) => (
                <div key={a.id} className="card flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">
                      {a.postalCode} · {a.radiusKm} km · {a.sensitivity === 'penny' ? 'Penny only' : a.sensitivity === 'amazing' ? '95%+ off' : a.sensitivity === 'great' ? '80%+ off' : 'All clearance'}
                    </p>
                    <p className="text-sm text-stone-500">{a.frequency === 'instant' ? '⚡ Instant' : '📬 Daily digest'}</p>
                  </div>
                  <DeleteAlertButton id={a.id} />
                </div>
              ))}
            </div>
          )}
          <AlertForm retailers={retailers.map((r) => ({ id: r.id, name: r.name }))} />
        </>
      )}
    </div>
  );
}
