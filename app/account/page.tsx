import type { Metadata } from 'next';
import Link from 'next/link';
import { getSessionUser, isAuthConfigured } from '@/lib/auth';
import { SignInPanel, SignOutButton } from '../components/AuthPanels';

export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false },
};

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="mt-2 text-stone-500">
          Magic link or Google — no passwords. An account lets you report finds, save a watchlist, and set
          area alerts.
        </p>
        {isAuthConfigured() ? (
          <SignInPanel />
        ) : (
          <div className="card mt-6 p-6 text-sm leading-relaxed text-stone-500">
            <p className="font-semibold text-stone-700 dark:text-stone-300">Demo mode</p>
            <p className="mt-2">
              Authentication needs Supabase environment variables (<code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code>,{' '}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>). Everything read-only —
              the live list, lookup, decoder, guides — works without them. See the README.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Account</h1>
      <div className="card mt-6 p-6">
        <p className="font-semibold">@{user.username}</p>
        <p className="text-sm text-stone-500">{user.email}</p>
        {user.id === 'local-user' && (
          <p className="mt-2 rounded-lg bg-penny-50 px-3 py-2 text-sm text-penny-800 dark:bg-penny-950 dark:text-penny-200">
            🏠 Local mode: this is your personal install. Finds, votes, watchlist, and scout entries save to{' '}
            <code className="font-mono">.data/local-store.json</code> on this machine — no accounts, no cloud.
          </p>
        )}
        <p className="mt-2 text-sm">
          <span className="chip bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            {user.trustLevel === 'trusted' ? '✓ Trusted hunter — reports publish instantly' : 'New hunter — reports enter moderation'}
          </span>
          {user.role !== 'user' && (
            <Link href="/admin" className="chip ml-2 bg-penny-100 text-penny-800 dark:bg-penny-950 dark:text-penny-300">
              🛡️ {user.role} — open admin
            </Link>
          )}
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link href="/alerts" className="card p-5 hover:shadow-md">
          <p className="font-semibold">🔔 Area alerts</p>
          <p className="mt-1 text-sm text-stone-500">Postal code + radius email alerts</p>
        </Link>
        <Link href="/watchlist" className="card p-5 hover:shadow-md">
          <p className="font-semibold">📌 Watchlist</p>
          <p className="mt-1 text-sm text-stone-500">Items you&apos;re tracking</p>
        </Link>
        <Link href={`/u/${user.username}`} className="card p-5 hover:shadow-md">
          <p className="font-semibold">🪙 Public profile</p>
          <p className="mt-1 text-sm text-stone-500">Stats and badge case</p>
        </Link>
        <Link href="/pro" className="card p-5 hover:shadow-md">
          <p className="font-semibold">⚡ PennyRadar Pro</p>
          <p className="mt-1 text-sm text-stone-500">Unlimited alerts, instant notifications</p>
        </Link>
      </div>

      <div className="card mt-4 p-5">
        <p className="font-semibold">Privacy & data (PIPEDA)</p>
        <p className="mt-1 text-sm leading-relaxed text-stone-500">
          Export or delete your data any time: email{' '}
          <a className="font-semibold text-penny-600 hover:underline dark:text-penny-400" href="mailto:privacy@pennyradar.ca">
            privacy@pennyradar.ca
          </a>{' '}
          from your account address and we action it within 30 days. Details in the{' '}
          <Link href="/legal/privacy" className="font-semibold text-penny-600 hover:underline dark:text-penny-400">
            privacy policy
          </Link>.
        </p>
      </div>

      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
  );
}
