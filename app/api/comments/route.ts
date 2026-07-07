import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { isDbConfigured, getDb, schema } from '@/lib/db';
import { rateLimit } from '@/lib/ratelimit';
import { containsProfanity } from '@/lib/utils';
import { eq, sql } from 'drizzle-orm';

const CommentSchema = z.object({
  dealId: z.string().uuid(),
  body: z.string().min(2).max(2000),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in to comment' }, { status: 401 });
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Demo mode: comments are disabled', demo: true }, { status: 503 });
  }

  const rl = await rateLimit(`comment:${user.id}`, 30, 3_600_000);
  if (!rl.ok) return NextResponse.json({ error: 'Slow down' }, { status: 429 });

  const parsed = CommentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid comment' }, { status: 400 });

  if (containsProfanity(parsed.data.body)) {
    return NextResponse.json({ error: 'Keep it clean, hunter' }, { status: 400 });
  }

  const db = getDb();
  const [comment] = await db
    .insert(schema.comments)
    .values({ dealId: parsed.data.dealId, userId: user.id, body: parsed.data.body })
    .returning();

  return NextResponse.json({ ok: true, id: comment.id });
}

const FlagSchema = z.object({ commentId: z.string().uuid() });

/** Flag a comment; auto-hides at 3 flags pending moderator review (spec §11). */
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Demo mode', demo: true }, { status: 503 });
  }
  const parsed = FlagSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const db = getDb();
  await db
    .update(schema.comments)
    .set({
      flagged: true,
      flagCount: sql`${schema.comments.flagCount} + 1`,
      hidden: sql`${schema.comments.flagCount} + 1 >= 3`,
    })
    .where(eq(schema.comments.id, parsed.data.commentId));

  return NextResponse.json({ ok: true });
}
