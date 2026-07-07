import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  alternates: { canonical: '/legal/terms' },
};

export default function TermsPage() {
  return (
    <div className="prose-penny mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-sm text-stone-400">Last updated: June 2026</p>

      <h2>1. The service</h2>
      <p>
        PennyRadar Canada (&quot;PennyRadar&quot;, &quot;we&quot;) provides a community platform for sharing observed retail
        prices in Canada. All prices are community-reported and <strong>not guaranteed</strong>. We are not
        affiliated with, endorsed by, or connected to any retailer. Retailers may refuse to sell any item at
        any scanned price.
      </p>

      <h2>2. Your content</h2>
      <p>
        You retain ownership of content you submit (reports, photos, comments, stories). By submitting, you
        grant PennyRadar a worldwide, royalty-free, non-exclusive licence to host, display, adapt, and
        distribute that content in connection with operating and promoting the service. You confirm you took
        the photos you upload and that they don&apos;t infringe anyone&apos;s rights.
      </p>

      <h2>3. Prohibited content and conduct</h2>
      <p>The following result in content removal and, where marked, an <strong>instant permanent ban</strong>:</p>
      <ul>
        <li>Employee-only internal data: markdown reports, pull lists, screenshots of internal systems (<strong>ban</strong>);</li>
        <li>Encouraging or describing theft, tag-swapping, barcode substitution, or deceiving staff (<strong>ban</strong>);</li>
        <li>Fabricated reports or manipulated receipts (<strong>ban</strong>);</li>
        <li>Harassment, hate, spam, or off-topic commercial promotion;</li>
        <li>Personal information about store employees.</li>
      </ul>

      <h2>4. Accounts and moderation</h2>
      <p>
        New-account submissions are moderated before publication. We may edit titles/categories for clarity,
        merge duplicates, mark deals dead, and suspend accounts that break these terms. Moderation actions are
        logged.
      </p>

      <h2>5. Pro subscriptions</h2>
      <p>
        Pro is billed in CAD via Stripe ($7/month or $49/year), renews automatically, and can be cancelled any
        time from your account — access continues to the end of the paid period. Prices may change with 30
        days&apos; notice.
      </p>

      <h2>6. Disclaimers and liability</h2>
      <p>
        The service is provided &quot;as is&quot;. We make no warranty that any deal exists, persists, or will be
        honoured. To the maximum extent permitted by law, PennyRadar is not liable for wasted trips, refused
        sales, resale outcomes, or any indirect or consequential loss. Nothing on this site is legal, tax, or
        financial advice.
      </p>

      <h2>7. Takedowns</h2>
      <p>
        Rights holders may request removal of content by emailing <a href="mailto:legal@pennyradar.ca">legal@pennyradar.ca</a>{' '}
        with the URL and basis for the request.
      </p>

      <h2>8. Governing law</h2>
      <p>These terms are governed by the laws of the Province of Ontario and the federal laws of Canada.</p>
    </div>
  );
}
