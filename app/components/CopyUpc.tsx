'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** UPC display: large, monospace, tap-to-copy (spec §4.1). */
export function CopyUpc({ upc, large = false }: { upc: string; large?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(upc).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded font-mono hover:text-penny-600 dark:hover:text-penny-400 ${
        large ? 'text-xl font-semibold tracking-wide' : ''
      }`}
      title="Copy UPC"
      aria-label={`Copy UPC ${upc}`}
    >
      {upc}
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 opacity-60" />}
    </button>
  );
}
