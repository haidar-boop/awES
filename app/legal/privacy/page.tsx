import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy (PIPEDA)',
  alternates: { canonical: '/legal/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="prose-penny mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-stone-400">
        Last updated: June 2026 · Built to comply with PIPEDA (Personal Information Protection and Electronic
        Documents Act)
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account:</strong> email address, chosen username, optional home province and avatar.</li>
        <li><strong>Contributions:</strong> reports, photos, comments, votes, and their timestamps.</li>
        <li>
          <strong>Approximate location:</strong> only what you give us — a postal code/FSA for alerts, or
          browser coordinates if you tap &quot;near me&quot; (used for that search, stored only if you save an alert).
          We never track background location.
        </li>
        <li><strong>Payments:</strong> handled by Stripe; we store only your subscription status and Stripe customer ID, never card numbers.</li>
        <li><strong>Analytics:</strong> privacy-friendly aggregate analytics (Plausible) with no cross-site tracking and no advertising identifiers.</li>
      </ul>

      <h2>How we use it</h2>
      <p>
        To operate the service: publishing your reports, sending the alerts and digests you asked for,
        computing leaderboards, moderating content, and preventing abuse (rate limits, duplicate detection).
        We do <strong>not</strong> sell personal information.
      </p>

      <h2>Retention</h2>
      <p>
        Account data is kept while your account is active. Published reports remain part of the community
        record but are de-linked from your identity if you delete your account. Email logs are kept 12 months;
        moderation and audit logs 24 months.
      </p>

      <h2>Your rights</h2>
      <p>
        Under PIPEDA you may access, correct, or delete your personal information, and withdraw consent to
        marketing at any time. Email <a href="mailto:privacy@pennyradar.ca">privacy@pennyradar.ca</a> from your
        account address; we respond within 30 days. You may also complain to the Office of the Privacy
        Commissioner of Canada.
      </p>

      <h2>Cookies</h2>
      <p>
        We use strictly necessary cookies only: your session (if signed in) and your theme preference. No
        advertising cookies; analytics are cookieless.
      </p>

      <h2>Service providers</h2>
      <p>
        Data is processed by Supabase (database, auth, photo storage), Vercel (hosting), Resend (email), and
        Stripe (payments). Some providers store data in the United States; we rely on contractual safeguards
        with each provider.
      </p>
    </div>
  );
}
