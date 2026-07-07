'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import JsBarcode from 'jsbarcode';
import { Barcode, Bookmark, Share2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { BarcodeModal } from '../../components/BarcodeModal';

export function BarcodeInline({ upc }: { upc: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      JsBarcode(ref.current, upc, {
        format: upc.length === 12 ? 'UPC' : upc.length === 13 ? 'EAN13' : 'CODE128',
        width: 2.5,
        height: 90,
        displayValue: true,
        margin: 10,
      });
    } catch {}
  }, [upc]);
  return (
    <div className="mx-auto mt-6 max-w-sm rounded-xl bg-white p-4 shadow-sm">
      <svg ref={ref} className="mx-auto max-w-full" role="img" aria-label={`Barcode ${upc}`} />
    </div>
  );
}

export function ItemActions({
  upc,
  name,
  dealId,
  itemId,
  retailerSlug,
}: {
  upc: string;
  name: string;
  dealId: string;
  itemId: string;
  retailerSlug: string;
}) {
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const call = async (path: string, body: unknown) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(
      res.ok
        ? '✓ Thanks — recorded!'
        : data.demo
          ? 'Demo mode: sign-in and a database are needed for community actions.'
          : (data.error ?? 'Something went wrong')
    );
    setTimeout(() => setMsg(null), 4000);
  };

  const share = async () => {
    const url = `${location.origin}/item/${upc}`;
    if (navigator.share) await navigator.share({ title: name, url }).catch(() => {});
    else {
      await navigator.clipboard.writeText(url);
      setMsg('✓ Link copied');
      setTimeout(() => setMsg(null), 2000);
    }
  };

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setBarcodeOpen(true)} className="btn-primary">
          <Barcode className="h-4 w-4" /> Scannable barcode
        </button>
        <button onClick={() => call('/api/votes', { dealId, kind: 'confirm' })} className="btn-secondary">
          <ThumbsUp className="h-4 w-4" /> Found it too
        </button>
        <button onClick={() => call('/api/votes', { dealId, kind: 'dead' })} className="btn-secondary">
          <ThumbsDown className="h-4 w-4" /> Gone at my store
        </button>
        <button onClick={() => call('/api/watchlist', { itemId })} className="btn-secondary">
          <Bookmark className="h-4 w-4" /> Watchlist
        </button>
        <button onClick={share} className="btn-secondary">
          <Share2 className="h-4 w-4" /> Share
        </button>
        <Link href={`/report?upc=${upc}&retailer=${retailerSlug}`} className="btn-secondary">
          🪙 Report at my store
        </Link>
      </div>
      {msg && <p className="mt-3 text-sm font-medium text-penny-700 dark:text-penny-300" role="status">{msg}</p>}
      {barcodeOpen && <BarcodeModal upc={upc} name={name} onClose={() => setBarcodeOpen(false)} />}
    </div>
  );
}
