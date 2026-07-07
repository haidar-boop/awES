import type { Metadata } from 'next';
import Link from 'next/link';
import { getStories } from '@/lib/data/queries';
import { formatCad } from '@/lib/core/pricing';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'The Receipt Wall — Best Penny Hauls in Canada',
  description:
    'Real receipts, real hauls: the community’s best penny finds and hidden-clearance scores, with the stories behind them.',
  alternates: { canonical: '/wall' },
};

export const revalidate = 3600;

export default async function WallPage() {
  const stories = await getStories();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">The Receipt Wall 🧾</h1>
      <p className="mt-2 max-w-2xl text-stone-500">
        The hall of fame: hauls with receipts, curated from community submissions. Post yours from your
        profile after a find is verified — bragging is not just allowed, it&apos;s the point.
      </p>

      <div className="mt-8 space-y-6">
        {stories.map((s) => (
          <article key={s.id} className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-xl font-bold">{s.title}</h2>
              <div className="flex gap-2">
                <span className="chip bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                  retail {formatCad(s.retailValue)}
                </span>
                <span className="chip bg-penny-100 font-bold text-penny-800 dark:bg-penny-950 dark:text-penny-300">
                  paid {formatCad(s.paidTotal)}
                </span>
              </div>
            </div>
            <p className="mt-3 leading-relaxed text-stone-600 dark:text-stone-400">{s.body}</p>
            <p className="mt-4 text-sm text-stone-400">
              {s.user ? (
                <Link href={`/u/${s.user.username}`} className="font-semibold text-penny-600 hover:underline dark:text-penny-400">
                  @{s.user.username}
                </Link>
              ) : 'anonymous hunter'}{' '}
              · {formatDate(s.createdAt)}
            </p>
          </article>
        ))}
        {stories.length === 0 && (
          <p className="card p-8 text-center text-stone-500">No stories yet — the wall is waiting for its first haul.</p>
        )}
      </div>

      <div className="card mt-8 bg-penny-50 p-6 text-center dark:bg-penny-950/50">
        <p className="font-semibold">Got a haul worth framing?</p>
        <p className="mt-1 text-sm text-stone-500">Submissions are admin-curated: photo + receipt + a short story.</p>
        <Link href="/contact" className="btn-primary mt-4">Submit your story</Link>
      </div>
    </div>
  );
}
