'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { normalizeUpc, isValidUpc } from '@/lib/core/upc';

/**
 * In-aisle camera scanner: point the camera at a product barcode and the UPC
 * lands wherever you need it. Uses the native BarcodeDetector API where
 * available (Chrome/Edge/Android) and falls back to ZXing (dynamically
 * imported, so it only loads on browsers that need it — iOS Safari).
 */
export function BarcodeScanner({
  onDetect,
  onClose,
}: {
  onDetect: (upc: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<'native' | 'zxing' | null>(null);
  const stopped = useRef(false);

  const finish = useCallback(
    (raw: string) => {
      if (stopped.current) return;
      const upc = normalizeUpc(raw);
      if (upc && isValidUpc(upc)) {
        stopped.current = true;
        if (navigator.vibrate) navigator.vibrate(80);
        onDetect(upc);
      }
      // Invalid reads (partial scans) are ignored; the loop keeps trying.
    },
    [onDetect]
  );

  useEffect(() => {
    stopped.current = false;
    let stream: MediaStream | null = null;
    let rafId = 0;
    let zxingControls: { stop: () => void } | null = null;

    async function start() {
      const video = videoRef.current;
      if (!video) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 } },
          audio: false,
        });
      } catch {
        setError(
          'Camera unavailable. Allow camera access, or note that camera needs HTTPS (or localhost) — type the UPC instead.'
        );
        return;
      }

      const hasNative = 'BarcodeDetector' in window;
      if (hasNative) {
        setEngine('native');
        video.srcObject = stream;
        await video.play().catch(() => {});
        const Detector = (window as unknown as { BarcodeDetector: any }).BarcodeDetector;
        const detector = new Detector({ formats: ['upc_a', 'upc_e', 'ean_13', 'ean_8', 'code_128'] });
        const scan = async () => {
          if (stopped.current || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0 && codes[0].rawValue) finish(codes[0].rawValue);
          } catch {
            /* frame not ready yet */
          }
          if (!stopped.current) rafId = requestAnimationFrame(scan);
        };
        rafId = requestAnimationFrame(scan);
      } else {
        setEngine('zxing');
        try {
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          const reader = new BrowserMultiFormatReader();
          zxingControls = await reader.decodeFromStream(stream, video, (result) => {
            if (result) finish(result.getText());
          });
        } catch {
          setError('Barcode reader failed to load — type the UPC instead.');
        }
      }
    }

    start();

    return () => {
      stopped.current = true;
      cancelAnimationFrame(rafId);
      zxingControls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [finish]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Scan a barcode with your camera"
      onClick={onClose}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-stone-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold text-white">📷 Point at the product barcode</p>
          <button onClick={onClose} aria-label="Close scanner" className="rounded-lg p-1 text-stone-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative aspect-[4/3] bg-black">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
          {/* Aim guide */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="h-24 w-64 max-w-[80%] rounded-lg border-2 border-penny-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center text-sm text-white">
              {error}
            </div>
          )}
        </div>
        <p className="px-4 py-3 text-xs text-stone-400">
          Scan the barcode on the item itself — not the shelf tag.
          {engine === 'zxing' && ' (compatibility reader active)'}
        </p>
      </div>
    </div>
  );
}
