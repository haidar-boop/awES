'use client';

import { useState } from 'react';

export function ProCheckout() {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const go = async (plan: 'monthly' | 'yearly') => {
    setBusy(plan);
    setMsg(null);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) ?? {};
    setBusy(null);
    if (data.url) location.href = data.url;
    else if (data.demo) setMsg('Demo mode: connect Stripe keys to enable checkout (see README).');
    else setMsg(data.error ?? 'Checkout failed — are you signed in?');
  };

  return (
    <div className="mt-8">
      <div className="grid gap-2">
        <button className="btn-primary w-full" onClick={() => go('monthly')} disabled={busy !== null}>
          {busy === 'monthly' ? 'Redirecting…' : 'Go Pro — $7/month'}
        </button>
        <button className="btn-secondary w-full" onClick={() => go('yearly')} disabled={busy !== null}>
          {busy === 'yearly' ? 'Redirecting…' : '$49/year'}
        </button>
      </div>
      {msg && <p className="mt-3 text-sm font-medium text-stone-500" role="status">{msg}</p>}
    </div>
  );
}
