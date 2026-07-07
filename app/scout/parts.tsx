'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { BarcodeScanner } from '../components/BarcodeScanner';

export function ScoutForm({ retailers }: { retailers: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [upc, setUpc] = useState('');
  const [retailerSlug, setRetailerSlug] = useState(retailers[0]?.slug ?? '');
  const [storeLabel, setStoreLabel] = useState('');
  const [taggedPrice, setTaggedPrice] = useState('');
  const [clearanceDate, setClearanceDate] = useState('');
  const [note, setNote] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/scout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        upc: upc || undefined,
        retailerSlug,
        storeLabel,
        taggedPrice: parseFloat(taggedPrice),
        clearanceDate,
        note: note || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setName(''); setUpc(''); setStoreLabel(''); setTaggedPrice(''); setClearanceDate(''); setNote('');
      setOpen(false);
      router.refresh();
    } else {
      setError(data.error ?? 'Could not save');
    }
  };

  if (!open) {
    return (
      <button className="btn-primary mt-6" onClick={() => setOpen(true)}>
        🏷️ Log a scouted tag
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
      <h2 className="font-bold">Log a scouted tag</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="sc-name" className="mb-1 block text-sm font-medium">What is it? *</label>
          <input id="sc-name" className="input" placeholder="e.g. Hampton Bay ceiling fan" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="sc-upc" className="mb-1 block text-sm font-medium">UPC (optional)</label>
          <div className="flex gap-2">
            <input id="sc-upc" className="input flex-1 font-mono" inputMode="numeric" value={upc} onChange={(e) => setUpc(e.target.value)} />
            <button type="button" onClick={() => setScanning(true)} className="btn-secondary !px-3" aria-label="Scan barcode" title="Scan with camera">
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="sc-retailer" className="mb-1 block text-sm font-medium">Retailer *</label>
          <select id="sc-retailer" className="input" value={retailerSlug} onChange={(e) => setRetailerSlug(e.target.value)}>
            {retailers.map((r) => (
              <option key={r.slug} value={r.slug}>{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sc-store" className="mb-1 block text-sm font-medium">Store *</label>
          <input id="sc-store" className="input" placeholder="e.g. Calgary Sunridge" value={storeLabel} onChange={(e) => setStoreLabel(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="sc-price" className="mb-1 block text-sm font-medium">Tagged price *</label>
          <input id="sc-price" className="input tnum" inputMode="decimal" placeholder="3.02" value={taggedPrice} onChange={(e) => setTaggedPrice(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="sc-date" className="mb-1 block text-sm font-medium">Clearance date on the tag *</label>
          <input id="sc-date" type="date" className="input" value={clearanceDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setClearanceDate(e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sc-note" className="mb-1 block text-sm font-medium">Note</label>
          <input id="sc-note" className="input" placeholder="aisle 12 endcap, 4 units, top stock too" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Start the 14-week clock'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {error && <p className="text-sm font-medium text-red-500" role="alert">{error}</p>}
      {scanning && (
        <BarcodeScanner
          onDetect={(scanned) => {
            setUpc(scanned);
            setScanning(false);
          }}
          onClose={() => setScanning(false)}
        />
      )}
    </form>
  );
}

export function ScoutActions({
  id,
  upc,
  retailerSlug,
  isDue,
  archived = false,
}: {
  id: string;
  upc: string | null;
  retailerSlug: string;
  isDue: boolean;
  archived?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const patch = async (action: 'checked' | 'done' | 'reopen') => {
    setBusy(true);
    await fetch('/api/scout', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    setBusy(false);
    router.refresh();
  };

  const remove = async () => {
    await fetch(`/api/scout?id=${id}`, { method: 'DELETE' });
    router.refresh();
  };

  if (archived) {
    return (
      <span className="flex gap-2">
        <button className="text-xs font-semibold text-penny-600 hover:underline" onClick={() => patch('reopen')}>
          Reopen
        </button>
        <button className="text-xs font-semibold text-stone-400 hover:text-red-500" onClick={remove}>
          Delete
        </button>
      </span>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {isDue && (
        <Link
          href={`/report?${new URLSearchParams({ ...(upc ? { upc } : {}), retailer: retailerSlug })}`}
          className="btn-primary !py-1.5 text-sm"
        >
          🪙 It pennied — report it
        </Link>
      )}
      <button className="btn-secondary !py-1.5 text-sm" disabled={busy} onClick={() => patch('checked')}>
        ✓ Checked today
      </button>
      <button className="btn-secondary !py-1.5 text-sm" disabled={busy} onClick={() => patch('done')}>
        Archive
      </button>
      <button className="btn-secondary !py-1.5 text-sm !text-red-500" disabled={busy} onClick={remove}>
        Delete
      </button>
    </div>
  );
}
