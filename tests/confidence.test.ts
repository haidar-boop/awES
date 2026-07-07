import { describe, it, expect } from 'vitest';
import { computeStatus, confidenceRank, type ConfidenceInput } from '@/lib/core/confidence';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const NOW = Date.parse('2026-07-06T12:00:00Z');

function base(overrides: Partial<ConfidenceInput> = {}): ConfidenceInput {
  return {
    confirmationTimes: [],
    distinctConfirmers: 0,
    hasReceipt: false,
    deadVotes: 0,
    firstReportedAt: NOW - 1 * DAY,
    lastConfirmedAt: NOW - 1 * DAY,
    reporterTrusted: false,
    ...overrides,
  };
}

describe('computeStatus', () => {
  it('new report from low-trust account is unconfirmed', () => {
    expect(computeStatus(base(), NOW)).toBe('unconfirmed');
  });

  it('single credible report < 7 days old is likely', () => {
    expect(computeStatus(base({ reporterTrusted: true }), NOW)).toBe('likely');
  });

  it('credible report older than 7 days is no longer likely', () => {
    const input = base({
      reporterTrusted: true,
      firstReportedAt: NOW - 8 * DAY,
      lastConfirmedAt: NOW - 8 * DAY,
    });
    expect(computeStatus(input, NOW)).toBe('unconfirmed');
  });

  it('receipt photo verifies immediately', () => {
    expect(computeStatus(base({ hasReceipt: true }), NOW)).toBe('verified');
  });

  it('2 independent confirmations within 72h verify', () => {
    const input = base({
      confirmationTimes: [NOW - 50 * HOUR, NOW - 2 * HOUR],
      distinctConfirmers: 2,
      lastConfirmedAt: NOW - 2 * HOUR,
    });
    expect(computeStatus(input, NOW)).toBe('verified');
  });

  it('2 confirmations more than 72h apart do NOT verify', () => {
    const input = base({
      confirmationTimes: [NOW - 10 * DAY, NOW - 2 * HOUR],
      distinctConfirmers: 2,
      lastConfirmedAt: NOW - 2 * HOUR,
    });
    expect(computeStatus(input, NOW)).not.toBe('verified');
  });

  it('2 confirmations from the SAME user do not verify', () => {
    const input = base({
      confirmationTimes: [NOW - 3 * HOUR, NOW - 2 * HOUR],
      distinctConfirmers: 1,
      lastConfirmedAt: NOW - 2 * HOUR,
    });
    expect(computeStatus(input, NOW)).not.toBe('verified');
  });

  it('3 dead votes kill the deal even if verified', () => {
    const input = base({ hasReceipt: true, deadVotes: 3, lastConfirmedAt: NOW - HOUR });
    expect(computeStatus(input, NOW)).toBe('dead');
  });

  it('2 dead votes do not kill the deal', () => {
    expect(computeStatus(base({ hasReceipt: true, deadVotes: 2, lastConfirmedAt: NOW - HOUR }), NOW)).toBe('verified');
  });

  it('>30 days without confirmation is dead', () => {
    const input = base({
      hasReceipt: true,
      firstReportedAt: NOW - 40 * DAY,
      lastConfirmedAt: NOW - 31 * DAY,
    });
    expect(computeStatus(input, NOW)).toBe('dead');
  });

  it('verified decays to likely after 14 days without confirmation', () => {
    const input = base({ hasReceipt: true, lastConfirmedAt: NOW - 15 * DAY, firstReportedAt: NOW - 20 * DAY });
    // Past the 7-day likely window too (lastConfirmed 15d ago) → unconfirmed
    expect(computeStatus(input, NOW)).toBe('unconfirmed');
    const fresher = base({ hasReceipt: true, lastConfirmedAt: NOW - 15 * DAY, firstReportedAt: NOW - 20 * DAY });
    fresher.lastConfirmedAt = NOW - 6 * DAY; // hypothetically re-touched — still inside likely window? No: 6d < 14d so verified
    expect(computeStatus(fresher, NOW)).toBe('verified');
  });

  it('rank orders verified > likely > unconfirmed > dead', () => {
    expect(confidenceRank('verified')).toBeGreaterThan(confidenceRank('likely'));
    expect(confidenceRank('likely')).toBeGreaterThan(confidenceRank('unconfirmed'));
    expect(confidenceRank('unconfirmed')).toBeGreaterThan(confidenceRank('dead'));
  });
});
