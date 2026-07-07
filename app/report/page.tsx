import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getRetailers, getStores } from '@/lib/data/queries';
import { ReportForm } from './form';

export const metadata: Metadata = {
  title: 'Report a Find — Add a Penny Deal to the Live List',
  description:
    'Found something scanning for pennies? Report the store, price, and a photo — your find powers alerts for every hunter in the area.',
  alternates: { canonical: '/report' },
};

export const revalidate = 3600;

export default async function ReportPage() {
  const [retailers, stores] = await Promise.all([getRetailers(), getStores()]);
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">🪙 Report a find</h1>
      <p className="mt-2 text-stone-500">
        Five quick steps. Your report goes live after moderation (trusted hunters publish instantly),
        and a receipt photo auto-verifies the deal.
      </p>
      <Suspense>
        <ReportForm
          retailers={retailers.map((r) => ({ id: r.id, slug: r.slug, name: r.name }))}
          stores={stores.map((s) => ({
            id: s.id,
            retailerId: s.retailerId,
            name: s.name,
            city: s.city,
            province: s.province,
            postalCode: s.postalCode,
          }))}
        />
      </Suspense>
    </div>
  );
}
