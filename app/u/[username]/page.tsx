import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProfile } from '@/lib/data/queries';
import { PROVINCES } from '@/lib/core/geo';
import { formatCad } from '@/lib/core/pricing';
import { formatDate } from '@/lib/utils';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const profile = await getProfile(params.username);
  if (!profile) return {};
  return {
    title: `@${profile.user.username} — Hunter Profile`,
    description: `${profile.user.approvedReports} approved reports · ${formatCad(profile.user.retailValueFound)} retail value found.`,
    alternates: { canonical: `/u/${profile.user.username}` },
  };
}

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const profile = await getProfile(params.username);
  if (!profile) notFound();
  const { user, badges } = profile;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="card p-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-penny-100 text-3xl dark:bg-penny-950" aria-hidden>
          🪙
        </div>
        <h1 className="mt-4 text-2xl font-bold">@{user.username}</h1>
        <p className="mt-1 text-sm text-stone-500">
          {user.homeProvince ? `${PROVINCES[user.homeProvince]} · ` : ''}
          Hunting since {formatDate(user.createdAt)}
          {user.trustLevel === 'trusted' && ' · ✓ Trusted hunter'}
          {user.role === 'moderator' && ' · 🛡️ Moderator'}
        </p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: 'Approved reports', value: String(user.approvedReports) },
            { label: 'Retail value found', value: formatCad(user.retailValueFound) },
            { label: 'Badges', value: String(badges.length) },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="tnum text-xl font-extrabold text-penny-600 dark:text-penny-400">{stat.value}</p>
              <p className="mt-1 text-xs text-stone-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="card mt-6 p-6">
        <h2 className="font-bold">Badge case</h2>
        {badges.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">No badges yet — the First Find badge is one approved report away.</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {badges.map((b) => (
              <li key={b!.slug} className="flex items-center gap-3 rounded-lg bg-stone-50 p-3 dark:bg-stone-800">
                <span className="text-2xl" aria-hidden>{b!.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{b!.name}</p>
                  <p className="text-xs text-stone-500">{b!.criteria}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
