import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About PennyRadar Canada',
  description:
    'Why we built a free, community-powered penny list for Canada — and the rules that keep it trustworthy.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="prose-penny mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">About PennyRadar</h1>
      <p>
        Penny hunting has thrived in the US for a decade behind paywalls — inventory checkers with premium
        tiers, $44/month Discord groups, courses. Canada got scraps: the odd Facebook group, YMMV threads,
        and American lists full of stores we don&apos;t have.
      </p>
      <p>
        PennyRadar is the Canadian answer: a <strong>free, community-powered live list</strong> of penny items
        and hidden clearance at Canadian retailers, with the education layer to hunt independently and the
        verification layer to make community reports actually trustworthy.
      </p>
      <h2>The rules we run on</h2>
      <ul>
        <li><strong>The core list is free forever.</strong> Pro pays the bills with speed features, never with access to the list itself.</li>
        <li><strong>Ranking is never for sale.</strong> Ads and affiliate links have zero influence on deal ordering.</li>
        <li><strong>Register scans only.</strong> No employee-only internal data, no tag games — instant permanent ban.</li>
        <li><strong>Stores can say no.</strong> Our etiquette guide is not a suggestion; hunters who argue with staff aren&apos;t welcome.</li>
        <li><strong>Privacy like we mean it</strong> — PIPEDA-compliant, minimal collection, deletion on request.</li>
      </ul>
      <h2>Not affiliated with anyone</h2>
      <p>
        PennyRadar is independent. Retailer names appear only to identify where community finds were reported.
        Prices are community-reported and not guaranteed.
      </p>
      <p>
        Questions? <Link href="/contact">Get in touch</Link> — or just <Link href="/deals">go find a penny</Link>.
      </p>
    </div>
  );
}
