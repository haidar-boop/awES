import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Offline', robots: { index: false } };

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-5xl" aria-hidden>📡</p>
      <h1 className="mt-4 text-2xl font-bold">You&apos;re offline</h1>
      <p className="mt-3 text-stone-500">
        Classic mid-store dead zone. Pages you&apos;ve already visited still work from cache — and any deal
        page you opened earlier can still show its barcode for scanning.
      </p>
      <Link href="/deals" className="btn-primary mt-6">Try again</Link>
    </div>
  );
}
