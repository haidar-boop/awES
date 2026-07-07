import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ARTICLES, articleBySlug, AUTHOR } from '@/lib/content/articles';
import { GLOSSARY } from '@/lib/content/glossary';
import { Markdown } from '../../components/Markdown';
import { JsonLd, breadcrumbLd } from '../../components/JsonLd';
import { siteUrl, formatDate, slugify } from '@/lib/utils';

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = articleBySlug.get(params.slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/guides/${article.slug}` },
    openGraph: { type: 'article', modifiedTime: article.updated },
  };
}

/** Auto-link the first mention of each glossary term (spec §4.9). */
function autolinkGlossary(md: string): string {
  let out = md;
  for (const term of GLOSSARY) {
    const pattern = new RegExp(`(?<![[\\w/])(${term.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\w\\]])`, 'i');
    let replaced = false;
    out = out.replace(pattern, (m) => {
      if (replaced) return m;
      replaced = true;
      return `[${m}](/glossary#${term.slug})`;
    });
  }
  return out;
}

/** Simple TOC from ## headings. */
function extractToc(md: string): { text: string; id: string }[] {
  return [...md.matchAll(/^## (.+)$/gm)].map((m) => ({ text: m[1], id: slugify(m[1]) }));
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = articleBySlug.get(params.slug);
  if (!article) notFound();
  const toc = extractToc(article.body);
  // Give headings ids for the TOC
  const bodyWithIds = autolinkGlossary(article.body).replace(
    /^## (.+)$/gm,
    (_, h) => `<h2 id="${slugify(h)}">${h}</h2>`
  );

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.description,
          dateModified: article.updated,
          author: { '@type': 'Organization', name: AUTHOR.name, url: siteUrl(AUTHOR.url) },
          publisher: { '@type': 'Organization', name: 'PennyRadar Canada' },
          mainEntityOfPage: siteUrl(`/guides/${article.slug}`),
          inLanguage: 'en-CA',
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: article.faq.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />
      <JsonLd
        data={breadcrumbLd(siteUrl(), [
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: article.title, path: `/guides/${article.slug}` },
        ])}
      />

      <nav className="text-sm text-stone-500" aria-label="Breadcrumb">
        <Link href="/guides" className="hover:underline">Guides</Link> › {article.title}
      </nav>
      <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl">{article.title}</h1>
      <p className="mt-3 text-sm text-stone-500">
        By {AUTHOR.name} · Updated {formatDate(article.updated)} · {article.minutes} min read
      </p>

      {toc.length > 2 && (
        <nav className="card mt-6 p-4" aria-label="Table of contents">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-400">On this page</p>
          <ul className="mt-2 space-y-1">
            {toc.map((h) => (
              <li key={h.id}>
                <a href={`#${h.id}`} className="text-sm text-penny-600 hover:underline dark:text-penny-400">
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <Markdown className="mt-6">{bodyWithIds}</Markdown>

      <section className="card mt-10 p-6">
        <h2 className="text-xl font-bold">Frequently asked</h2>
        <dl className="mt-4 space-y-4">
          {article.faq.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/deals" className="btn-primary">See the live penny list</Link>
        <Link href="/guides" className="btn-secondary">More guides</Link>
      </div>
    </article>
  );
}
