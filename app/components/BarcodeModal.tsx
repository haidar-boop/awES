'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import JsBarcode from 'jsbarcode';

/**
 * Renders a scannable barcode from the UPC (spec §4.1) so self-checkouts and
 * price checkers can scan straight off the phone screen. UPC-A/EAN-13 use
 * their native symbology; anything else falls back to Code 128.
 */
export function BarcodeModal({ upc, name, onClose }: { upc: string; name: string; onClose: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const format = upc.length === 12 ? 'UPC' : upc.length === 13 ? 'EAN13' : 'CODE128';
    try {
      JsBarcode(svgRef.current, upc, {
        format,
        width: 3,
        height: 110,
        displayValue: true,
        fontSize: 18,
        margin: 12,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch {
      JsBarcode(svgRef.current, upc, { format: 'CODE128', width: 2.5, height: 110, displayValue: true });
    }
  }, [upc]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Scannable barcode for ${name}`}
      onClick={onClose}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-start justify-between gap-4">
          <h2 className="text-left text-sm font-semibold text-stone-900">{name}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-stone-400 hover:bg-stone-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="rounded-xl bg-white p-2">
          <svg ref={svgRef} className="mx-auto max-w-full" role="img" aria-label={`Barcode ${upc}`} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          Show this at a price checker or self-checkout to verify the system price at your store.
          Brightness up helps scanners read the screen.
        </p>
      </div>
    </div>
  );
}
