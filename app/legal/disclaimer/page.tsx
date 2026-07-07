import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer',
  alternates: { canonical: '/legal/disclaimer' },
};

export default function DisclaimerPage() {
  return (
    <div className="prose-penny mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Disclaimer</h1>

      <h2>Prices</h2>
      <p>
        Every price on this site is <strong>community-reported</strong>: a hunter&apos;s account of what an item
        scanned at a specific store at a specific moment. Prices change hourly, vary by store, and are not
        guaranteed to exist when you arrive. Confidence badges reflect community corroboration, not a promise.
      </p>

      <h2>Retailers</h2>
      <p>
        PennyRadar is <strong>not affiliated with or endorsed by any retailer</strong>. Retailer names and
        colours identify where finds were reported, nothing more. Stores may refuse to sell items that scan at
        $0.01 — pennied stock is flagged for removal, and refusal is their right. Our community rules require
        accepting a refusal politely.
      </p>

      <h2>Not professional advice</h2>
      <p>
        Content about legality, the Scanner Price Accuracy Code, cash rounding, or reselling is general
        information, not legal, tax, or financial advice. Income from reselling may be taxable — consult a
        professional about your situation.
      </p>

      <h2>Verify in-store</h2>
      <p>
        Always verify before you buy and before you drive: scan the item&apos;s UPC at a price checker, check the
        deal&apos;s last-confirmed time, and treat every listing as YMMV.
      </p>
    </div>
  );
}
