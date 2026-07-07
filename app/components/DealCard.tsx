'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MapPin, MessageCircle, ThumbsUp, ThumbsDown, Barcode, Share2, Bookmark } from 'lucide-react';
import type { DealView } from '@/lib/types';
import { formatCad, discountLabel, CASH_ROUNDING_TIP } from '@/lib/core/pricing';
import { timeAgo } from '@/lib/utils';
import { ConfidenceBadge } from './ConfidenceBadge';
import { BarcodeModal } from './BarcodeModal';
import { CopyUpc } from './CopyUpc';

export function DealCard({ view }: { view: DealView }) {
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const { deal, item, retailer, reports, provinceCounts } = view;
  const discount = discountLabel(item.originalPrice, deal.bestPrice);
  const latest = reports[0];
  const isPenny = deal.bestPrice <= 0.04;

  const share = async () => {
    const url = `${location.origin}/item/${item.upc}`;
    const text = `${formatCad(deal.bestPrice)} — ${item.name} at ${retailer.name} 🪙`;
    if (navigator.share) {
      await navigator.share({ title: text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <article className="card flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2 p-4 pb-0">
        <span
          className="chip text-white"
          style={{ backgroundColor: retailer.brandColor }}
        >
          {retailer.name.replace(' Canada', '')}
        </span>
        <ConfidenceBadge status={deal.status} />
      </div>

      <div className="flex-1 p-4">
        <Link href={`/item/${item.upc}`} className="group">
          <h3 className="font-semibold leading-snug group-hover:text-penny-600 dark:group-hover:text-penny-400">
            {item.brand ? <span className="text-stone-500">{item.brand} · </span> : null}
            {item.name}
          </h3>
        </Link>

        {/* The hero visual: price transformation (spec §8) */}
        <div className="mt-3 flex items-baseline gap-3">
          {item.originalPrice != null && (
            <s className="tnum text-lg text-stone-400">{formatCad(item.originalPrice)}</s>
          )}
          <span
            className="tnum text-3xl font-extrabold text-penny-600 dark:text-penny-400"
            title={isPenny ? CASH_ROUNDING_TIP : undefined}
          >
            {formatCad(deal.bestPrice)}
          </span>
          {discount && (
            <span className="chip bg-penny-100 text-penny-800 dark:bg-penny-950 dark:text-penny-300">
              {discount}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
          <CopyUpc upc={item.upc} />
          {item.sku && <span className="font-mono">SKU {item.sku}</span>}
        </div>

        <div className="mt-3 space-y-1.5 text-sm text-stone-600 dark:text-stone-400">
          {latest && (
            <p className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
              <span className="truncate">
                {latest.store.name} · {latest.store.city}, {latest.store.province}
              </span>
            </p>
          )}
          <p className="flex flex-wrap items-center gap-1.5">
            <span>Reported {timeAgo(deal.firstReportedAt)}</span>
            {Object.entries(provinceCounts).map(([prov, n]) => (
              <span key={prov} className="chip bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                {prov} ×{n}
              </span>
            ))}
          </p>
          {deal.isSample && (
            <span className="chip bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Sample data</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-stone-100 px-4 py-2.5 text-sm dark:border-stone-800">
        <div className="flex items-center gap-3 text-stone-500">
          <span className="flex items-center gap-1" title="Found it too">
            <ThumbsUp className="h-4 w-4" aria-hidden /> {deal.confirmCount}
          </span>
          <span className="flex items-center gap-1" title="Gone / didn't scan">
            <ThumbsDown className="h-4 w-4" aria-hidden /> {deal.deadVotes}
          </span>
          <span className="flex items-center gap-1" title="Comments">
            <MessageCircle className="h-4 w-4" aria-hidden /> {view.commentCount}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setBarcodeOpen(true)}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-penny-600 dark:hover:bg-stone-800"
            aria-label="Show scannable barcode"
            title="Scannable barcode"
          >
            <Barcode className="h-4 w-4" />
          </button>
          <button
            onClick={share}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-penny-600 dark:hover:bg-stone-800"
            aria-label="Share deal"
            title="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <Link
            href={`/item/${item.upc}`}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-penny-600 dark:hover:bg-stone-800"
            aria-label="Save to watchlist (on item page)"
            title="Details & watchlist"
          >
            <Bookmark className="h-4 w-4" />
          </Link>
          <Link href={`/item/${item.upc}`} className="ml-1 text-sm font-semibold text-penny-600 hover:text-penny-500 dark:text-penny-400">
            Details
          </Link>
        </div>
      </div>

      {barcodeOpen && <BarcodeModal upc={item.upc} name={item.name} onClose={() => setBarcodeOpen(false)} />}
    </article>
  );
}
