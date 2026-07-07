import type { DealStatus } from '@/lib/core/confidence';
import { STATUS_LABEL } from '@/lib/core/confidence';

const STYLES: Record<DealStatus, string> = {
  verified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  likely: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  unconfirmed: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
  dead: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

const ICONS: Record<DealStatus, string> = {
  verified: '✓',
  likely: '◆',
  unconfirmed: '○',
  dead: '✗',
};

export function ConfidenceBadge({ status }: { status: DealStatus }) {
  return (
    <span className={`chip ${STYLES[status]}`} title={`Confidence: ${STATUS_LABEL[status]}`}>
      <span aria-hidden>{ICONS[status]}</span>
      {STATUS_LABEL[status]}
    </span>
  );
}
