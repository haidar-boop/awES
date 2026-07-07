'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, Search } from 'lucide-react';
import { classifyLookup } from '@/lib/core/upc';
import { BarcodeScanner } from '../components/BarcodeScanner';

export function LookupTool() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = classifyLookup(value);
    if (result.kind === 'invalid') {
      setError(
        'That doesn’t look like a UPC (12–13 digits with a valid check digit) or SKU (6–10 digits). Double-check the number.'
      );
      return;
    }
    // UPCs and SKUs both resolve on the item page; SKUs fall back to search.
    router.push(`/item/${result.value}`);
  };

  return (
    <form onSubmit={submit} className="mt-6">
      <div className="flex gap-2">
        <label htmlFor="lookup-input" className="sr-only">UPC or SKU</label>
        <input
          id="lookup-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="numeric"
          placeholder="e.g. 885000114441 or SKU 1001098765"
          className="input flex-1 !py-3.5 font-mono text-base"
          autoFocus
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
        <button type="submit" className="btn-primary !px-5">
          <Search className="h-5 w-5" />
          <span className="hidden sm:inline">Check</span>
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {scanning && (
        <BarcodeScanner
          onDetect={(upc) => {
            setScanning(false);
            router.push(`/item/${upc}`);
          }}
          onClose={() => setScanning(false)}
        />
      )}
    </form>
  );
}
