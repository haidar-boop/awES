'use client';

import { useState } from 'react';
import { PROVINCES } from '@/lib/core/geo';

export function EmailCapture() {
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('busy');
    const res = await fetch('/api/email-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, province: province || undefined }),
    }).catch(() => null);
    setState(res?.ok ? 'done' : 'error');
  };

  if (state === 'done') {
    return <p className="mt-6 font-semibold text-white">✓ You&apos;re in — watch for the next digest!</p>;
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-6 flex max-w-lg flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor="digest-email">Email address</label>
      <input
        id="digest-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="input flex-1 !border-transparent"
      />
      <label className="sr-only" htmlFor="digest-province">Province</label>
      <select
        id="digest-province"
        value={province}
        onChange={(e) => setProvince(e.target.value)}
        className="input !w-auto !border-transparent"
      >
        <option value="">Province…</option>
        {Object.entries(PROVINCES).map(([code, name]) => (
          <option key={code} value={code}>{name}</option>
        ))}
      </select>
      <button type="submit" disabled={state === 'busy'} className="btn-secondary whitespace-nowrap !border-transparent">
        {state === 'busy' ? 'Subscribing…' : 'Get the digest'}
      </button>
      {state === 'error' && <p className="text-sm text-penny-100">Something went wrong — try again.</p>}
    </form>
  );
}
