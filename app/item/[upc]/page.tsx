import type { Metadata } from 'next';
import Link from 'next/link';
import { getItemPage } from '@/lib/data/queries';
import { formatCad, discountLabel, taxExample, CASH_ROUNDING_TIP } from '@/lib/core/pricing';
import { normalizeUpc, isValidUpc } from '@/lib/core/upc';
import { timeAgo, siteUrl, formatDate } from '@/lib/utils';
import { ConfidenceBadge } from '../../components/ConfidenceBadge';
import { CopyUpc } from '../../components/CopyUpc';
import { PriceLadder } from '../../components/PriceLadder';
import { JsonLd, breadcrumbLd } from '../../components/JsonLd';
import { ItemActions, BarcodeInline } from './parts';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { upc: string } }): Promise<Metadata> {
  const page = await getItemPage(params.upc);
  const upc = normalizeUpc(params.upc) ?? params.upc;
  if (!page) {
    return {
      title: `Is UPC ${upc} a penny item in Canada?`,
      description: `No community reports yet for UPC ${upc}. Generate a scannable barcode and check the system price at your store — then report what you find.`,
      alternates: { canonical: `/item/${upc}` },
      robots: { index: false, follow: true },
    };
  }
  const best = page.views[0];
  const cityBit = best?.reports[0] ? ` — found in ${best.reports[0].store.city}, ${best.reports[0].store.province}` : '';
  const og = `/api/og?${new URLSearchParams({
    name: page.item.name,
    price: formatCad(best?.deal.bestPrice ?? 0.01),
    ...(page.item.originalPrice ? { original: formatCad(page.item.originalPrice) } : {}),
    ...(best?.reports[0] ? { city: `${best.reports[0].store.city}, ${best.reports[0].store.province}` } : {}),
    retailer: page.retailer.name,
  })}`;
  return {
    title: `${page.item.name} — ${formatCad(best?.deal.bestPrice ?? 0.01)} at ${page.retailer.name}`,
    description: `UPC ${upc}: community reports, price history, and a scannable barcode${cityBit}. Is it a penny item in Canada? Check before you drive.`,
    alternates: { canonical: `/item/${upc}` },
    openGraph: { images: [og] },
    twitter: { card: 'summary_large_image', images: [og] },
  };
}

export default async function ItemPage({ params }: { params: { upc: string } }) {
  const upc = normalizeUpc(params.upc) ?? params.upc;
  const page = await getItemPage(params.upc);

  if (!page) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">No reports yet for UPC {upc}</h1>
        <p className="mt-3 text-stone-500">
          {isValidUpc(upc)
            ? 'Nobody has reported this item in Canada yet. Show this barcode at a price checker to see the system price at your store:'
            : 'That doesn’t look like a valid UPC (check digit failed) — double-check the digits, or try the lookup tool.'}
        </p>
        {isValidUpc(upc) && <BarcodeInline upc={upc} />}
        <div className="mt-8 flex justify-center gap-3">
          <Link href={`/report?upc=${upc}`} className="btn-primary">🪙 Report this item</Link>
          <Link href="/lookup" className="btn-secondary">Back to lookup</Link>
        </div>
      </div>
    );
  }

  const { item, retailer, views, history } = page;
  const deal = views[0]?.deal;
  const allReports = views.flatMap((v) => v.reports);
  const provinceForTax = allReports[0]?.store.province ?? 'ON';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: item.name,
          gtin13: item.upc.padStart(13, '0'),
          brand: item.brand ? { '@type': 'Brand', name: item.brand } : undefined,
          offers: deal
            ? {
                '@type': 'Offer',
                price: deal.bestPrice.toFixed(2),
                priceCurrency: 'CAD',
                availability:
                  deal.status === 'dead'
                    ? 'https://schema.org/OutOfStock'
                    : 'https://schema.org/LimitedAvailability',
                seller: { '@type': 'Organization', name: retailer.name },
              }
            : undefined,
        }}
      />
      <JsonLd
        data={breadcrumbLd(siteUrl(), [
          { name: 'Home', path: '/' },
          { name: 'Deals', path: '/deals' },
          { name: item.name, path: `/item/${item.upc}` },
        ])}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="chip text-white" style={{ backgroundColor: retailer.brandColor }}>
            {retailer.name}
          </span>
          <h1 className="mt-3 text-3xl font-bold leading-tight">
            {item.brand && <span className="text-stone-400">{item.brand} </span>}
            {item.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-stone-500">
            <CopyUpc upc={item.upc} large />
            {item.sku && <span className="font-mono text-sm">SKU {item.sku}</span>}
            <span className="text-sm">{item.category}</span>
          </div>
        </div>
        {deal && <ConfidenceBadge status={deal.status} />}
      </div>

      {deal && (
        <div className="card mt-6 p-6">
          <div className="flex flex-wrap items-baseline gap-4">
            {item.originalPrice != null && (
              <s className="tnum text-2xl text-stone-400">{formatCad(item.originalPrice)}</s>
            )}
            <span className="tnum text-5xl font-extrabold text-penny-600 dark:text-penny-400">
              {formatCad(deal.bestPrice)}
            </span>
            {discountLabel(item.originalPrice, deal.bestPrice) && (
              <span className="chip bg-penny-100 text-base text-penny-800 dark:bg-penny-950 dark:text-penny-300">
                {discountLabel(item.originalPrice, deal.bestPrice)}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-stone-500">
            Last confirmed {timeAgo(deal.lastConfirmedAt)} · {deal.confirmCount} confirmation{deal.confirmCount === 1 ? '' : 's'} · {deal.deadVotes} gone vote{deal.deadVotes === 1 ? '' : 's'}
          </p>
          {deal.bestPrice <= 0.04 && (
            <p className="mt-3 rounded-lg bg-penny-50 px-3 py-2 text-sm text-penny-800 dark:bg-penny-950 dark:text-penny-200">
              💡 {CASH_ROUNDING_TIP}
            </p>
          )}
          <p className="mt-2 text-xs text-stone-400">
            {taxExample(provinceForTax, deal.bestPrice)}{' '}
            <Link href="/guides/scanner-price-accuracy-code" className="underline hover:text-penny-600">
              Know your rights: the Scanner Price Accuracy Code →
            </Link>
          </p>

          <ItemActions upc={item.upc} name={item.name} dealId={deal.id} itemId={item.id} retailerSlug={retailer.slug} />
        </div>
      )}

      {history.length >= 2 && (
        <section className="card mt-6 p-6">
          <h2 className="text-lg font-bold">Markdown ladder</h2>
          <p className="mb-4 mt-1 text-sm text-stone-500">Observed prices over time, from community reports.</p>
          <PriceLadder points={history.map((h) => ({ price: h.price, at: h.at }))} />
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-bold">All reports across Canada ({allReports.length})</h2>
        <div className="mt-3 space-y-3">
          {allReports.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">
                  {r.store.name}
                  <span className="ml-2 text-sm text-stone-500">{r.store.city}, {r.store.province}</span>
                </p>
                <p className="mt-0.5 text-sm text-stone-500">
                  Scanned <strong className="tnum text-penny-600 dark:text-penny-400">{formatCad(r.scannedPrice)}</strong>
                  {' '}on {formatDate(r.foundAt)}
                  {r.quantitySeen != null && ` · ~${r.quantitySeen} seen`}
                  {r.hasReceipt && ' · 🧾 Receipt verified'}
                </p>
                {r.locationNote && <p className="mt-1 text-sm italic text-stone-400">“{r.locationNote}”</p>}
              </div>
              <Link
                href={`/stores/${retailer.slug}/${r.store.province.toLowerCase()}/${r.store.slug}`}
                className="text-sm font-semibold text-penny-600 hover:underline dark:text-penny-400"
              >
                Store page →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-6 p-5 text-sm text-stone-500">
        <p>
          Deep links:{' '}
          <a
            href={`https://www.homedepot.ca/search?q=${item.sku ?? item.upc}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-penny-600 hover:underline dark:text-penny-400"
          >
            search homedepot.ca
          </a>
          {' · '}
          <a
            href={`https://www.walmart.ca/search?q=${item.upc}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-penny-600 hover:underline dark:text-penny-400"
          >
            search walmart.ca
          </a>
          {' · '}Prices are community-reported and not guaranteed. Stores may refuse to sell items that scan at $0.01 — always verify in-store.
        </p>
      </section>
    </div>
  );
}
