import type { Metadata } from 'next';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { isDbConfigured, getDb, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getDealViews } from '@/lib/data/queries';
import { DealCard } from '../components/DealCard';

export const metadata: Metadata = { title: 'Watchlist', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function WatchlistPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Watchlist</h1>
        <p className="mt-2 text-stone-500">Sign in to save items and get notified when they&apos;re reported near you.</p>
        <Link href="/account" className="btn-primary mt-6">Sign in</Link>
      </div>
    );
  }

  let itemIds: string[] = [];
  if (isDbConfigured()) {
    const rows = await getDb().select().from(schema.watchlist).where(eq(schema.watchlist.userId, user.id));
    itemIds = rows.map((r) => r.itemId);
  }
  const views = (await getDealViews({ includeDead: true })).filter((v) => itemIds.includes(v.item.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Watchlist</h1>
      <p className="mt-2 text-stone-500">
        You get an email when a watched item is newly reported, confirmed, or spotted within your alert radius.
      </p>
      <div className="mt-8">
        {views.length === 0 ? (
          <div className="card p-8 text-center text-stone-500">
            <p>Nothing saved yet. Hit the 📌 on any deal to track it here.</p>
            <Link href="/deals" className="btn-primary mt-4">Browse the live list</Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {views.map((v) => (
              <DealCard key={v.deal.id} view={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
