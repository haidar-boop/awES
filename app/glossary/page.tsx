import type { Metadata } from 'next';
import Link from 'next/link';
import { GLOSSARY } from '@/lib/content/glossary';
import { JsonLd } from '../components/JsonLd';
import { siteUrl } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Glossary — Penny Hunting Terms Explained',
  description:
    'Penny item, hidden clearance, YMMV, death star, top stock, FSA, cash rounding — every term the Canadian penny community uses, defined.',
  alternates: { canonical: '/glossary' },
};

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'DefinedTermSet',
          name: 'PennyRadar Canada Glossary',
          url: siteUrl('/glossary'),
          hasDefinedTerm: GLOSSARY.map((t) => ({
            '@type': 'DefinedTerm',
            name: t.term,
            description: t.definition,
            url: siteUrl(`/glossary#${t.slug}`),
          })),
        }}
      />
      <h1 className="text-3xl font-bold">Glossary</h1>
      <p className="mt-2 text-stone-500">
        The vocabulary of the hunt. Terms auto-link from inside our{' '}
        <Link href="/guides" className="font-semibold text-penny-600 hover:underline dark:text-penny-400">guides</Link>.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Terms">
        {GLOSSARY.map((t) => (
          <a key={t.slug} href={`#${t.slug}`} className="chip border border-stone-300 bg-white text-stone-600 hover:border-penny-500 hover:text-penny-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
            {t.term}
          </a>
        ))}
      </nav>

      <dl className="mt-8 space-y-6">
        {GLOSSARY.map((t) => (
          <div key={t.slug} id={t.slug} className="card scroll-mt-24 p-5">
            <dt className="flex items-center justify-between font-bold">
              {t.term}
              <a href={`#${t.slug}`} className="text-sm font-normal text-stone-400 hover:text-penny-600" aria-label={`Link to ${t.term}`}>
                #
              </a>
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{t.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
