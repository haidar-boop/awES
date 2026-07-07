import type { Metadata } from 'next';
import { getRetailers } from '@/lib/data/queries';
import { DecoderExplorer } from './explorer';

export const metadata: Metadata = {
  title: 'Clearance Tag Decoder — Read Any Canadian Retailer’s Markdown Signals',
  description:
    'Interactive guide to clearance tags at Home Depot Canada, Walmart Canada, Dollar Tree, Costco and more: price endings, date codes, hiding spots, and what pennies out.',
  alternates: { canonical: '/decoder' },
};

export const revalidate = 3600;

export default async function DecoderPage() {
  const retailers = await getRetailers(false);
  const withDecoders = retailers.filter((r) => r.decoder.length > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Clearance tag decoder</h1>
      <p className="mt-2 max-w-2xl text-stone-500">
        Every retailer&apos;s clearance system leaks signals — price endings, tag colours, date codes.
        Pick a store and learn to read them. Content is community-maintained and admin-editable.
      </p>
      <DecoderExplorer
        retailers={withDecoders.map((r) => ({
          slug: r.slug,
          name: r.name,
          brandColor: r.brandColor,
          cadenceNotesMd: r.cadenceNotesMd,
          decoder: r.decoder,
        }))}
      />
    </div>
  );
}
