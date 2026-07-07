import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LookupTool } from './tool';

export const metadata: Metadata = {
  title: 'UPC / SKU Lookup — “Is This a Penny Item?”',
  description:
    'Enter any UPC or Home Depot SKU to see every community report across Canada, price history, and a scannable barcode for in-store checking.',
  alternates: { canonical: '/lookup' },
};

export default function LookupPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Is this a penny item?</h1>
      <p className="mt-2 text-stone-500">
        Enter a UPC (the barcode on the product) or a Home Depot SKU. We&apos;ll check every report across
        Canada — and if it&apos;s not in the database yet, we&apos;ll generate a scannable barcode so you can
        check the system price in-store yourself.
      </p>
      <Suspense>
        <LookupTool />
      </Suspense>
      <div className="card mt-10 p-5 text-sm leading-relaxed text-stone-500">
        <p className="font-semibold text-stone-700 dark:text-stone-300">Tips</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Scan the <strong>item&apos;s own barcode</strong>, not the shelf tag — hidden clearance lives in the gap between them.</li>
          <li>UPCs are 12–13 digits; we validate the check digit so typos get caught instantly.</li>
          <li>Every item gets a shareable page at <code className="font-mono">/item/&#123;upc&#125;</code> — paste it in your group chats.</li>
        </ul>
      </div>
    </div>
  );
}
