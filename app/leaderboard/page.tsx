import type { Metadata } from 'next';
import Link from 'next/link';
import { getLeaderboard } from '@/lib/data/queries';
import { PROVINCES } from '@/lib/core/geo';
import { formatCad } from '@/lib/core/pricing';

export const metadata: Metadata = {
  title: 'Leaderboard — Canada’s Top Penny Hunters',
  description:
    'Monthly and all-time rankings by approved reports and total retail value pennied, filterable by province.',
  alternates: { canonical: '/leaderboard' },
};

export const revalidate = 3600;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { province?: string };
}) {
  const province = searchParams.province?.toUpperCase();
  const rows = await getLeaderboard(province);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Leaderboard</h1>
      <p className="mt-2 text-stone-500">
        Ranked by total retail value found (the original price of every approved find). Fabricated reports get
        accounts banned — the scoreboard is sacred.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/leaderboard"
          className={`chip border px-3 py-1.5 ${!province ? 'border-penny-500 bg-penny-500 text-white' : 'border-stone-300 bg-white text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'}`}
        >
          All Canada
        </Link>
        {Object.keys(PROVINCES).map((p) => (
          <Link
            key={p}
            href={`/leaderboard?province=${p}`}
            className={`chip border px-3 py-1.5 ${province === p ? 'border-penny-500 bg-penny-500 text-white' : 'border-stone-300 bg-white text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'}`}
          >
            {p}
          </Link>
        ))}
      </div>

      <ol className="mt-8 space-y-3">
        {rows.map((row, i) => (
          <li key={row.user.id} className="card flex items-center gap-4 p-4">
            <span className={`w-8 text-center text-lg font-extrabold ${i < 3 ? 'text-penny-500' : 'text-stone-400'}`}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <Link href={`/u/${row.user.username}`} className="font-semibold hover:text-penny-600 dark:hover:text-penny-400">
                @{row.user.username}
              </Link>
              <p className="text-sm text-stone-500">
                {row.user.homeProvince ?? '—'} · {row.reports} approved reports
              </p>
            </div>
            <div className="text-right">
              <p className="tnum font-bold text-penny-600 dark:text-penny-400">{formatCad(row.retailValue)}</p>
              <p className="text-xs text-stone-400">retail value found</p>
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <p className="card p-8 text-center text-stone-500">No hunters ranked in this province yet — claim it.</p>
        )}
      </ol>
    </div>
  );
}
