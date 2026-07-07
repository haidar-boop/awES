import type { Metadata } from 'next';
import { ProCheckout } from './checkout';

export const metadata: Metadata = {
  title: 'PennyRadar Pro — $7 CAD/month or $49/year',
  description:
    'Unlimited area alerts, instant notifications, a 15-minute early-access window on verified deals, price-history charts, and CSV export for resellers.',
  alternates: { canonical: '/pro' },
};

const FREE = [
  'Full live penny list & map',
  'UPC / SKU lookup + barcodes',
  'Tag decoder & all guides',
  '1 area alert (daily digest)',
  'Comments, votes, leaderboard',
];

const PRO = [
  'Unlimited area alerts',
  'Instant email notifications',
  '15-minute early access to newly verified deals',
  'Full price-history charts',
  'CSV export for resellers',
  'Pro badge · ad-free',
];

export default function ProPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-center text-4xl font-extrabold">The free list is the product.<br />Pro is the head start.</h1>
      <p className="mx-auto mt-4 max-w-2xl text-center text-stone-500">
        The core of PennyRadar is free forever — that&apos;s the whole point versus $44/month US Discord
        groups. Pro exists for resellers and speed-hunters where 15 minutes is the difference between a haul
        and an empty shelf.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card p-8">
          <h2 className="text-lg font-bold">Free forever</h2>
          <p className="tnum mt-2 text-4xl font-extrabold">$0</p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {FREE.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-emerald-500">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="card border-2 border-penny-500 p-8">
          <h2 className="text-lg font-bold text-penny-600 dark:text-penny-400">Pro</h2>
          <p className="tnum mt-2 text-4xl font-extrabold">
            $7 <span className="text-base font-medium text-stone-500">CAD/month</span>
          </p>
          <p className="text-sm text-stone-500">or $49/year (save 42%)</p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {PRO.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-penny-500">★</span> {f}
              </li>
            ))}
          </ul>
          <ProCheckout />
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-stone-400">
        Payments by Stripe in CAD · cancel anytime from your account · ads and affiliate links never influence
        deal ranking, on any tier.
      </p>
    </div>
  );
}
