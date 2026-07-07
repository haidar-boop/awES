'use client';

import dynamic from 'next/dynamic';
import type { DealView } from '@/lib/types';

/** Leaflet is browser-only; load it client-side with a skeleton fallback. */
const InnerMap = dynamic(() => import('./DealMapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center rounded-xl bg-stone-100 text-stone-400 dark:bg-stone-900">
      Loading map…
    </div>
  ),
});

export function DealMap({ views }: { views: DealView[] }) {
  return <InnerMap views={views} />;
}
