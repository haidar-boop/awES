import type { Metadata } from 'next';
import { FAQ } from '@/lib/content/faq';
import { JsonLd } from '../components/JsonLd';

export const metadata: Metadata = {
  title: 'FAQ — Everything About PennyRadar & Penny Hunting',
  description:
    'Is it free? Is penny shopping legal? How do confidence badges work? Do ads affect rankings (never)? All answered.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />
      <h1 className="text-3xl font-bold">Frequently asked questions</h1>
      <div className="mt-8 space-y-3">
        {FAQ.map((f) => (
          <details key={f.q} className="card group p-5">
            <summary className="cursor-pointer list-none font-semibold marker:hidden">
              <span className="mr-2 text-penny-500 transition-transform group-open:rotate-90" aria-hidden>›</span>
              {f.q}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
