import Stripe from 'stripe';

export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!isStripeConfigured()) throw new Error('STRIPE_SECRET_KEY not set');
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
  return _stripe;
}

export const PRO_PRICES = {
  monthly: { env: 'STRIPE_PRICE_MONTHLY', amount: '$7 CAD/month' },
  yearly: { env: 'STRIPE_PRICE_YEARLY', amount: '$49 CAD/year' },
} as const;

/** Pro perk: verified deals are visible to Pro 15 minutes before free users. */
export const EARLY_ACCESS_MINUTES = 15;

export function isEarlyAccess(verifiedAt: Date | string, isPro: boolean): boolean {
  if (isPro) return false;
  return Date.now() - new Date(verifiedAt).getTime() < EARLY_ACCESS_MINUTES * 60_000;
}
