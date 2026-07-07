/**
 * Confidence & verification engine (spec §4.4).
 *
 * Status ladder:
 *  - verified    — ≥2 independent confirmations within 72h of each other,
 *                  or any approved report with a receipt photo
 *  - likely      — 1 credible report (trusted reporter) less than 7 days old
 *  - unconfirmed — new report from a low-trust account
 *  - dead        — ≥3 "gone/didn't scan" votes, or >30 days with no confirmation
 *
 * Decay (run hourly by /api/cron/decay):
 *  - verified demotes to likely 14 days after the last confirmation
 *  - likely demotes to unconfirmed 7 days after the last confirmation
 *  - anything >30 days without confirmation is dead
 */

export type DealStatus = 'verified' | 'likely' | 'unconfirmed' | 'dead';

export interface ConfidenceInput {
  /** timestamps of approved confirmations (reports + confirm votes), ms epoch */
  confirmationTimes: number[];
  /** number of distinct users among those confirmations */
  distinctConfirmers: number;
  hasReceipt: boolean;
  deadVotes: number;
  firstReportedAt: number;
  lastConfirmedAt: number;
  /** trust level of the original reporter */
  reporterTrusted: boolean;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const DEAD_VOTE_THRESHOLD = 3;
export const STALE_DEAD_DAYS = 30;
export const VERIFIED_WINDOW_HOURS = 72;
export const VERIFIED_DECAY_DAYS = 14;
export const LIKELY_DECAY_DAYS = 7;

/** Do any two confirmations from distinct users fall within the 72h window? */
function hasClusteredConfirmations(times: number[], distinctConfirmers: number): boolean {
  if (distinctConfirmers < 2 || times.length < 2) return false;
  const sorted = [...times].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] <= VERIFIED_WINDOW_HOURS * HOUR) return true;
  }
  return false;
}

export function computeStatus(input: ConfidenceInput, now: number = Date.now()): DealStatus {
  if (input.deadVotes >= DEAD_VOTE_THRESHOLD) return 'dead';

  const sinceConfirm = now - input.lastConfirmedAt;
  if (sinceConfirm > STALE_DEAD_DAYS * DAY) return 'dead';

  const isVerified =
    input.hasReceipt || hasClusteredConfirmations(input.confirmationTimes, input.distinctConfirmers);

  if (isVerified && sinceConfirm <= VERIFIED_DECAY_DAYS * DAY) return 'verified';

  // A verified deal past its decay window, or a credible single report, is "likely".
  const credibleSingle = input.reporterTrusted && now - input.firstReportedAt < 7 * DAY;
  if ((isVerified || credibleSingle) && sinceConfirm <= LIKELY_DECAY_DAYS * DAY) return 'likely';
  if (isVerified) return 'unconfirmed'; // verified but stale past likely window, not yet 30d

  return 'unconfirmed';
}

/** Sort weight for "Most Confirmed" and default feed ranking. */
export function confidenceRank(status: DealStatus): number {
  return { verified: 3, likely: 2, unconfirmed: 1, dead: 0 }[status];
}

export const STATUS_LABEL: Record<DealStatus, string> = {
  verified: 'Verified',
  likely: 'Likely Active',
  unconfirmed: 'Unconfirmed',
  dead: 'Dead',
};
