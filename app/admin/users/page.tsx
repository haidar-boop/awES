import { loadCore } from '@/lib/data/source';
import { formatCad } from '@/lib/core/pricing';
import { formatDate } from '@/lib/utils';
import { UserAdminButtons } from '../parts';

export const dynamic = 'force-dynamic';

export default async function AdminUsers() {
  const snap = await loadCore();
  const users = [...snap.users].sort((a, b) => b.approvedReports - a.approvedReports);

  return (
    <div>
      <h1 className="text-2xl font-bold">Users ({users.length})</h1>
      <div className="mt-6 space-y-3">
        {users.map((u) => (
          <div key={u.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">
                @{u.username}
                <span className={`chip ml-2 ${
                  u.trustLevel === 'trusted'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : u.trustLevel === 'banned'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
                }`}>
                  {u.trustLevel}
                </span>
                {u.role !== 'user' && <span className="chip ml-1 bg-penny-100 text-penny-800 dark:bg-penny-950 dark:text-penny-300">{u.role}</span>}
              </p>
              <p className="text-sm text-stone-500">
                {u.homeProvince ?? '—'} · joined {formatDate(u.createdAt)} · {u.approvedReports} approved · {formatCad(u.retailValueFound)} found
              </p>
            </div>
            <UserAdminButtons userId={u.id} trustLevel={u.trustLevel} />
          </div>
        ))}
      </div>
    </div>
  );
}
