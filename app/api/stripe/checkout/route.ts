import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { isDbConfigured, getDb, schema } from '@/lib/db';
import { siteUrl } from '@/lib/utils';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in to upgrade' }, { status: 401 });
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured (demo mode)', demo: true }, { status: 503 });
  }

  const { plan } = (await req.json().catch(() => ({}))) as { plan?: 'monthly' | 'yearly' };
  const priceId = plan === 'yearly' ? process.env.STRIPE_PRICE_YEARLY : process.env.STRIPE_PRICE_MONTHLY;
  if (!priceId) return NextResponse.json({ error: 'Price not configured' }, { status: 500 });

  const stripe = getStripe();

  let customerId: string | undefined;
  if (isDbConfigured()) {
    const db = getDb();
    const [sub] = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, user.id));
    customerId = sub?.stripeCustomerId ?? undefined;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    customer_email: customerId ? undefined : user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    currency: 'cad',
    success_url: siteUrl('/account?upgraded=1'),
    cancel_url: siteUrl('/pro?cancelled=1'),
    metadata: { userId: user.id },
    subscription_data: { metadata: { userId: user.id } },
  });

  return NextResponse.json({ url: session.url });
}
