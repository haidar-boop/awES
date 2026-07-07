'use client';

import { useEffect } from 'react';

/** Registers the service worker (production only — caching in dev is misery). */
export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
