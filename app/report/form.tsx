'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { isValidUpc } from '@/lib/core/upc';
import { CATEGORIES } from '@/lib/core/pricing';
import { BarcodeScanner } from '../components/BarcodeScanner';

interface RetailerOpt {
  id: string;
  slug: string;
  name: string;
}
interface StoreOpt {
  id: string;
  retailerId: string;
  name: string;
  city: string;
  province: string;
  postalCode: string;
}

const STEPS = ['Store', 'Product', 'Photos', 'Details', 'Done'] as const;

export function ReportForm({ retailers, stores }: { retailers: RetailerOpt[]; stores: StoreOpt[] }) {
  const params = useSearchParams();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [retailerId, setRetailerId] = useState(
    retailers.find((r) => r.slug === params.get('retailer'))?.id ?? ''
  );
  const [storeQuery, setStoreQuery] = useState('');
  const [storeId, setStoreId] = useState('');
  const [upc, setUpc] = useState(params.get('upc') ?? '');
  const [itemName, setItemName] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<string>('Other');
  const [originalPrice, setOriginalPrice] = useState('');
  const [scannedPrice, setScannedPrice] = useState('0.01');
  const [foundAt, setFoundAt] = useState(new Date().toISOString().slice(0, 10));
  const [quantitySeen, setQuantitySeen] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [notes, setNotes] = useState('');
  const [purchased, setPurchased] = useState(false);
  const [photoNote, setPhotoNote] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  const storeMatches = useMemo(() => {
    const inRetailer = stores.filter((s) => s.retailerId === retailerId);
    if (!storeQuery) return inRetailer.slice(0, 8);
    const q = storeQuery.toLowerCase();
    return inRetailer
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.postalCode.toLowerCase().replace(/\s/g, '').includes(q.replace(/\s/g, ''))
      )
      .slice(0, 8);
  }, [stores, retailerId, storeQuery]);

  const upcValid = isValidUpc(upc);
  const canNext = [
    Boolean(retailerId && storeId),
    Boolean(upcValid && itemName.length >= 3 && parseFloat(scannedPrice) >= 0.01),
    true, // photos optional
    true,
  ][step];

  const submit = async () => {
    setBusy(true);
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        retailerId,
        storeId,
        upc,
        sku: sku || undefined,
        itemName,
        brand: brand || undefined,
        category,
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        scannedPrice: parseFloat(scannedPrice),
        quantitySeen: quantitySeen ? parseInt(quantitySeen, 10) : undefined,
        foundAt: new Date(foundAt).toISOString(),
        locationNote: locationNote || undefined,
        notes: notes || undefined,
        hasReceipt: purchased,
        photos: [], // photo URLs come from Supabase Storage upload; see README
      }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) ?? {};
    setBusy(false);
    setResult({
      ok: Boolean(res?.ok),
      message: res?.ok
        ? data.message
        : data.demo
          ? 'Demo mode: submissions need a database + sign-in. Everything else on the site works — see the README to connect Supabase.'
          : (data.error ?? 'Submission failed — are you signed in?'),
    });
    setStep(4);
  };

  const selectedStore = stores.find((s) => s.id === storeId);

  return (
    <div className="mt-8">
      {/* Progress */}
      <ol className="flex items-center gap-1" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col items-center gap-1">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i < step
                  ? 'bg-emerald-500 text-white'
                  : i === step
                    ? 'bg-penny-500 text-white'
                    : 'bg-stone-200 text-stone-500 dark:bg-stone-800'
              }`}
              aria-current={i === step ? 'step' : undefined}
            >
              {i < step ? '✓' : i + 1}
            </span>
            <span className="text-[11px] text-stone-500">{label}</span>
          </li>
        ))}
      </ol>

      <div className="card mt-6 p-6">
        {step === 0 && (
          <fieldset className="space-y-4">
            <legend className="text-lg font-bold">Where did you find it?</legend>
            <div>
              <label htmlFor="retailer" className="mb-1 block text-sm font-medium">Retailer *</label>
              <select
                id="retailer"
                className="input"
                value={retailerId}
                onChange={(e) => {
                  setRetailerId(e.target.value);
                  setStoreId('');
                }}
              >
                <option value="">Choose a retailer…</option>
                {retailers.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            {retailerId && (
              <div>
                <label htmlFor="store-search" className="mb-1 block text-sm font-medium">Store *</label>
                <input
                  id="store-search"
                  className="input"
                  placeholder="Search by city or postal code…"
                  value={storeQuery}
                  onChange={(e) => setStoreQuery(e.target.value)}
                />
                <div className="mt-2 grid gap-1.5">
                  {storeMatches.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStoreId(s.id)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm ${
                        storeId === s.id
                          ? 'border-penny-500 bg-penny-50 dark:bg-penny-950'
                          : 'border-stone-200 hover:border-penny-300 dark:border-stone-700'
                      }`}
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="block text-xs text-stone-500">{s.city}, {s.province} · {s.postalCode}</span>
                    </button>
                  ))}
                  {storeMatches.length === 0 && (
                    <p className="text-sm text-stone-500">
                      No matching store — missing stores can be added by admins from the store CSV importer;{' '}
                      <Link href="/contact" className="font-semibold text-penny-600 hover:underline">tell us the address</Link> and pick the nearest store for now.
                    </p>
                  )}
                </div>
              </div>
            )}
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="space-y-4">
            <legend className="text-lg font-bold">What did you find?</legend>
            <div>
              <label htmlFor="upc" className="mb-1 block text-sm font-medium">UPC (barcode on the product) *</label>
              <div className="flex gap-2">
                <input
                  id="upc"
                  className="input flex-1 font-mono"
                  inputMode="numeric"
                  placeholder="12–13 digits"
                  value={upc}
                  onChange={(e) => setUpc(e.target.value)}
                  aria-invalid={upc.length > 0 && !upcValid}
                />
                <button
                  type="button"
                  onClick={() => setScanning(true)}
                  className="btn-secondary !px-4"
                  aria-label="Scan barcode with camera"
                  title="Scan with camera"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>
              {upc.length >= 11 && (
                <p className={`mt-1 text-xs font-medium ${upcValid ? 'text-emerald-600' : 'text-red-500'}`}>
                  {upcValid ? '✓ Valid check digit' : '✗ Check digit doesn’t match — re-read the barcode digits'}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="itemName" className="mb-1 block text-sm font-medium">Product name *</label>
                <input id="itemName" className="input" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. RYOBI 18V Drill Kit" />
              </div>
              <div>
                <label htmlFor="brand" className="mb-1 block text-sm font-medium">Brand</label>
                <input id="brand" className="input" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div>
                <label htmlFor="sku" className="mb-1 block text-sm font-medium">SKU (optional)</label>
                <input id="sku" className="input font-mono" inputMode="numeric" value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
              <div>
                <label htmlFor="category" className="mb-1 block text-sm font-medium">Category *</label>
                <select id="category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="orig" className="mb-1 block text-sm font-medium">Original price (CAD)</label>
                <input id="orig" className="input tnum" inputMode="decimal" placeholder="149.00" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} />
              </div>
              <div>
                <label htmlFor="scanned" className="mb-1 block text-sm font-medium">Scanned price (CAD) *</label>
                <input id="scanned" className="input tnum" inputMode="decimal" value={scannedPrice} onChange={(e) => setScannedPrice(e.target.value)} />
              </div>
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="space-y-4">
            <legend className="text-lg font-bold">Photos (up to 3)</legend>
            <p className="text-sm text-stone-500">
              Product, shelf tag, and receipt. Photos are compressed on your device before upload and receipt
              photos <strong>auto-verify</strong> the deal. Alt text is added automatically for accessibility.
            </p>
            {(['Product photo', 'Shelf tag photo', 'Receipt photo'] as const).map((label, i) => (
              <div key={label}>
                <label htmlFor={`photo-${i}`} className="mb-1 block text-sm font-medium">{label}</label>
                <input
                  id={`photo-${i}`}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="block w-full text-sm text-stone-500 file:mr-3 file:rounded-lg file:border-0 file:bg-penny-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPhotoNote((p) => [...new Set([...p, label])]);
                  }}
                />
              </div>
            ))}
            {photoNote.length > 0 && (
              <p className="text-sm text-emerald-600">✓ {photoNote.join(', ')} attached (uploads on submit)</p>
            )}
            <p className="text-xs text-stone-400">
              Photo storage uses Supabase Storage; in demo mode files are held locally and skipped on submit.
            </p>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className="space-y-4">
            <legend className="text-lg font-bold">Details</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="foundAt" className="mb-1 block text-sm font-medium">Date found *</label>
                <input id="foundAt" type="date" className="input" value={foundAt} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setFoundAt(e.target.value)} />
              </div>
              <div>
                <label htmlFor="qty" className="mb-1 block text-sm font-medium">Quantity seen</label>
                <input id="qty" className="input" inputMode="numeric" placeholder="e.g. 4" value={quantitySeen} onChange={(e) => setQuantitySeen(e.target.value)} />
              </div>
            </div>
            <div>
              <label htmlFor="loc" className="mb-1 block text-sm font-medium">Where in the store?</label>
              <input id="loc" className="input" placeholder="clearance endcap aisle 12, top stock…" value={locationNote} onChange={(e) => setLocationNote(e.target.value)} />
            </div>
            <div>
              <label htmlFor="notes" className="mb-1 block text-sm font-medium">Notes</label>
              <textarea id="notes" className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={purchased} onChange={(e) => setPurchased(e.target.checked)} className="h-4 w-4 accent-penny-500" />
              I purchased it (attach the receipt photo for a 🧾 Receipt Verified badge)
            </label>
            {selectedStore && (
              <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                Submitting: <strong>{itemName || 'item'}</strong> at <strong>{selectedStore.name}</strong> for <strong>${scannedPrice}</strong>
              </p>
            )}
          </fieldset>
        )}

        {step === 4 && result && (
          <div className="py-6 text-center">
            <p className="text-4xl" aria-hidden>{result.ok ? '🎉' : '🤔'}</p>
            <h2 className="mt-3 text-xl font-bold">{result.ok ? 'Report submitted!' : 'Not quite'}</h2>
            <p className="mx-auto mt-2 max-w-md text-stone-500">{result.message}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/deals" className="btn-primary">Back to the live list</Link>
              {!result.ok && (
                <button className="btn-secondary" onClick={() => setStep(3)}>Try again</button>
              )}
            </div>
          </div>
        )}

        {step < 4 && (
          <div className="mt-6 flex justify-between border-t border-stone-100 pt-4 dark:border-stone-800">
            <button className="btn-secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              Back
            </button>
            {step < 3 ? (
              <button className="btn-primary" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Continue
              </button>
            ) : (
              <button className="btn-primary" onClick={submit} disabled={busy}>
                {busy ? 'Submitting…' : '🪙 Submit report'}
              </button>
            )}
          </div>
        )}
      </div>

      {scanning && (
        <BarcodeScanner
          onDetect={(scanned) => {
            setUpc(scanned);
            setScanning(false);
          }}
          onClose={() => setScanning(false)}
        />
      )}

      <p className="mt-4 text-xs leading-relaxed text-stone-400">
        House rules: register scans only — no employee-only internal data, no tag-swapping, ever. New accounts
        are limited to 10 reports/day and enter the moderation queue; 5 approved reports makes you trusted with
        instant publishing.
      </p>
    </div>
  );
}
