import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Reach the PennyRadar team: support, takedowns, privacy requests, and story submissions.',
  alternates: { canonical: '/contact' },
};

const CONTACTS = [
  { label: 'General & support', email: 'hello@pennyradar.ca', note: 'Questions, bugs, missing stores, retailer suggestions.' },
  { label: 'Receipt Wall submissions', email: 'wall@pennyradar.ca', note: 'Photo + receipt + a short story. Best hauls get featured.' },
  { label: 'Privacy (PIPEDA requests)', email: 'privacy@pennyradar.ca', note: 'Data export or deletion — actioned within 30 days.' },
  { label: 'Legal & takedowns', email: 'legal@pennyradar.ca', note: 'Rights holders and takedown requests. Include the URL.' },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Contact</h1>
      <div className="mt-8 space-y-4">
        {CONTACTS.map((c) => (
          <div key={c.email} className="card p-5">
            <p className="font-semibold">{c.label}</p>
            <a href={`mailto:${c.email}`} className="mt-1 block font-mono text-sm text-penny-600 hover:underline dark:text-penny-400">
              {c.email}
            </a>
            <p className="mt-1 text-sm text-stone-500">{c.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
