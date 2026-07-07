import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { isDbConfigured, getDb, schema } from '@/lib/db';

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }
  const stripe = getStripe();
  const sig = req.headers.get('stripe-signature');
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig!, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (!isDbConfigured()) return NextResponse.json({ received: true });
  const db = getDb();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId) {
        await db
          .insert(schema.subscriptions)
          .values({
            userId,
            stripeCustomerId: String(session.customer),
            plan: 'pro',
            status: 'active',
          })
          .onConflictDoUpdate({
            target: schema.subscriptions.userId,
            set: { stripeCustomerId: String(session.customer), plan: 'pro', status: 'active' },
          });
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        const active = sub.status === 'active' || sub.status === 'trialing';
        await db
          .insert(schema.subscriptions)
          .values({
            userId,
            stripeCustomerId: String(sub.customer),
            plan: active ? 'pro' : 'free',
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          })
          .onConflictDoUpdate({
            target: schema.subscriptions.userId,
            set: {
              plan: active ? 'pro' : 'free',
              status: sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
