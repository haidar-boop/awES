import Link from 'next/link';
import { getSessionUser, isAuthConfigured } from '@/lib/auth';

export const metadata = { title: 'Admin', robots: { index: false } };
export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/moderation', label: 'Moderation queue' },
  { href: '/admin/deals', label: 'Deals' },
  { href: '/admin/retailers', label: 'Retailers' },
  { href: '/admin/stores', label: 'Stores' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/articles', label: 'Articles' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const allowed = user && (user.role === 'admin' || user.role === 'moderator');

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">🛡️ Admin</h1>
        <p className="mt-3 text-stone-500">
          {user
            ? 'Your account doesn’t have moderator access.'
            : isAuthConfigured()
              ? 'Sign in with a moderator or admin account.'
              : 'Demo mode: configure Supabase auth and set ADMIN_EMAILS to unlock the admin panel (see README).'}
        </p>
        <Link href="/account" className="btn-primary mt-6">Go to account</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
      <aside className="hidden w-48 shrink-0 md:block">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Admin</p>
        <nav className="mt-3 grid gap-1" aria-label="Admin">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
