'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

async function moderate(action: string, targetId?: string, reason?: string) {
  const res = await fetch('/api/admin/moderate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, targetId, reason }),
  });
  return res.ok;
}

export function ModerateButtons({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const act = async (action: 'approve_report' | 'reject_report') => {
    setBusy(true);
    const reason =
      action === 'reject_report' ? prompt('Reason for rejection (sent to logs):') ?? undefined : undefined;
    if (action === 'reject_report' && reason === undefined) {
      setBusy(false);
      return;
    }
    await moderate(action, reportId, reason);
    router.refresh();
  };
  return (
    <div className="flex gap-2">
      <button className="btn-primary !py-1.5" disabled={busy} onClick={() => act('approve_report')}>
        ✓ Approve
      </button>
      <button className="btn-secondary !py-1.5" disabled={busy} onClick={() => act('reject_report')}>
        ✗ Reject
      </button>
    </div>
  );
}

export function DealAdminButtons({ dealId, featured }: { dealId: string; featured: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const act = async (action: string) => {
    setBusy(true);
    await moderate(action, dealId);
    router.refresh();
  };
  return (
    <div className="flex gap-2">
      <button
        className="btn-secondary !py-1.5 text-sm"
        disabled={busy}
        onClick={() => act(featured ? 'unfeature_deal' : 'feature_deal')}
      >
        {featured ? '★ Unfeature' : '☆ Feature'}
      </button>
      <button className="btn-secondary !py-1.5 text-sm" disabled={busy} onClick={() => act('mark_dead')}>
        Mark dead
      </button>
    </div>
  );
}

export function UserAdminButtons({ userId, trustLevel }: { userId: string; trustLevel: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const act = async (action: string) => {
    setBusy(true);
    await moderate(action, userId);
    router.refresh();
  };
  return (
    <div className="flex gap-2">
      {trustLevel !== 'trusted' && (
        <button className="btn-secondary !py-1.5 text-sm" disabled={busy} onClick={() => act('trust_user')}>
          ✓ Trust
        </button>
      )}
      {trustLevel !== 'banned' && (
        <button
          className="btn-secondary !py-1.5 text-sm !text-red-600"
          disabled={busy}
          onClick={() => confirm('Ban this user? Their pending reports are voided.') && act('ban_user')}
        >
          Ban
        </button>
      )}
    </div>
  );
}

export function PurgeSamplesButton() {
  const router = useRouter();
  return (
    <button
      className="btn-secondary !py-1.5 text-sm"
      onClick={async () => {
        if (confirm('Retire all sample deals (marks them dead)?')) {
          await moderate('purge_samples');
          router.refresh();
        }
      }}
    >
      Purge sample deals
    </button>
  );
}
