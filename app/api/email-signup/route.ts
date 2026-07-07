import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isDbConfigured, getDb, schema } from '@/lib/db';
import { rateLimit } from '@/lib/ratelimit';

const Body = z.object({
  email: z.string().email(),
  province: z.string().length(2).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'anon';
  const rl = await rateLimit(`signup:${ip}`, 5, 3_600_000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 });

  if (isDbConfigured()) {
    await getDb()
      .insert(schema.emailSubscribers)
      .values({ email: parsed.data.email.toLowerCase(), province: parsed.data.province?.toUpperCase() })
      .onConflictDoNothing();
  }
  return NextResponse.json({ ok: true, message: 'Subscribed — watch for the weekly digest!' });
}
