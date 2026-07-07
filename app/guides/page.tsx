import type { Metadata } from 'next';
import Link from 'next/link';
import { ARTICLES } from '@/lib/content/articles';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Guides — Learn Penny Hunting in Canada',
  description:
    'The education hub: how penny items work, retailer-specific playbooks, legality, etiquette, cash rounding, reselling, and verification.',
  alternates: { canonical: '/guides' },
};

export default function GuidesPage() {
  const pillar = ARTICLES.find((a) => a.pillar);
  const rest = ARTICLES.filter((a) => !a.pillar);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Guides</h1>
      <p className="mt-2 text-stone-500">
        Everything you need to go from “is that real?” to your first penny receipt.
      </p>

      {pillar && (
        <Link href={`/guides/${pillar.slug}`} className="card mt-8 block bg-penny-600 p-8 text-white transition-shadow hover:shadow-lg dark:bg-penny-700">
          <p className="text-sm font-semibold uppercase tracking-wide text-penny-200">Start here</p>
          <h2 className="mt-2 text-2xl font-bold">{pillar.title}</h2>
          <p className="mt-2 text-penny-100">{pillar.description}</p>
          <p className="mt-4 text-sm text-penny-200">{pillar.minutes} min read · Updated {formatDate(pillar.updated)}</p>
        </Link>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {rest.map((a) => (
          <Link key={a.slug} href={`/guides/${a.slug}`} className="card group p-5 transition-shadow hover:shadow-md">
            <h2 className="font-semibold leading-snug group-hover:text-penny-600 dark:group-hover:text-penny-400">
              {a.title}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm text-stone-500">{a.description}</p>
            <p className="mt-3 text-xs text-stone-400">{a.minutes} min read · Updated {formatDate(a.updated)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
