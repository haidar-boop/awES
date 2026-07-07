'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RADIUS_OPTIONS_KM } from '@/lib/core/geo';

export function AlertForm({ retailers }: { retailers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [postalCode, setPostalCode] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);
  const [sensitivity, setSensitivity] = useState('penny');
  const [frequency, setFrequency] = useState('daily');
  const [retailerIds, setRetailerIds] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ text: string; upgrade?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postalCode, radiusKm, sensitivity, frequency, retailerIds: retailerIds.length ? retailerIds : undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMsg({ text: `✓ Alert created (${data.frequency})` });
      router.refresh();
    } else {
      setMsg({ text: data.error ?? 'Failed to create alert', upgrade: data.upgrade });
    }
  };

  return (
    <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
      <h2 className="font-bold">New alert</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="alert-postal" className="mb-1 block text-sm font-medium">Postal code or FSA *</label>
          <input id="alert-postal" className="input" placeholder="T2P or T2P 1J9" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="alert-radius" className="mb-1 block text-sm font-medium">Radius</label>
          <select id="alert-radius" className="input" value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))}>
            {RADIUS_OPTIONS_KM.map((km) => (
              <option key={km} value={km}>{km} km</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="alert-sens" className="mb-1 block text-sm font-medium">Sensitivity</label>
          <select id="alert-sens" className="input" value={sensitivity} onChange={(e) => setSensitivity(e.target.value)}>
            <option value="penny">Penny only ($0.01–$0.05)</option>
            <option value="amazing">Amazing (95%+ off)</option>
            <option value="great">Great (80%+ off)</option>
            <option value="all">All clearance (50%+)</option>
          </select>
        </div>
        <div>
          <label htmlFor="alert-freq" className="mb-1 block text-sm font-medium">Delivery</label>
          <select id="alert-freq" className="input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="daily">Daily digest (free)</option>
            <option value="instant">Instant (Pro)</option>
          </select>
        </div>
      </div>
      <fieldset>
        <legend className="mb-1 text-sm font-medium">Retailers (all if none selected)</legend>
        <div className="flex flex-wrap gap-2">
          {retailers.map((r) => (
            <button
              type="button"
              key={r.id}
              onClick={() =>
                setRetailerIds((ids) => (ids.includes(r.id) ? ids.filter((i) => i !== r.id) : [...ids, r.id]))
              }
              className={`chip border px-3 py-1.5 ${
                retailerIds.includes(r.id)
                  ? 'border-penny-500 bg-penny-500 text-white'
                  : 'border-stone-300 text-stone-600 dark:border-stone-700 dark:text-stone-300'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </fieldset>
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? 'Creating…' : '🔔 Create alert'}
      </button>
      {msg && (
        <p className="text-sm font-medium" role="status">
          {msg.text}{' '}
          {msg.upgrade && (
            <Link href="/pro" className="font-semibold text-penny-600 underline dark:text-penny-400">
              See Pro →
            </Link>
          )}
        </p>
      )}
    </form>
  );
}

export function DeleteAlertButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="btn-secondary !py-1.5 text-sm"
      onClick={async () => {
        await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
        router.refresh();
      }}
    >
      Remove
    </button>
  );
}
