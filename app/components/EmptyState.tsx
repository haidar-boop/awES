import Link from 'next/link';

/** Empty states always teach (spec §8). */
export function EmptyState({
  title = 'No deals here yet',
  area,
}: {
  title?: string;
  area?: string;
}) {
  return (
    <div className="card mx-auto max-w-xl p-8 text-center">
      <p className="text-4xl" aria-hidden>🪙</p>
      <h2 className="mt-3 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-stone-500">
        {area ? `No live reports in ${area} right now — which means the first find is up for grabs.` : 'No live reports match those filters right now.'}
        {' '}Penny waves move fast: learn the tag signals so you can spot the next one yourself.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/decoder" className="btn-secondary">Learn the tag decoder</Link>
        <Link href="/report" className="btn-primary">🪙 Be the first to report</Link>
      </div>
    </div>
  );
}
