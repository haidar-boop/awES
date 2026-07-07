import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole, AuthError } from '@/lib/auth';
import { isDbConfigured, getDb, schema } from '@/lib/db';
import { onReportApproved, recomputeDeal } from '@/lib/data/mutations';
import { invalidateCore } from '@/lib/data/source';
import { sendEmail, reportApprovedEmail } from '@/lib/email';
import { siteUrl } from '@/lib/utils';
import { eq } from 'drizzle-orm';

const Body = z.object({
  action: z.enum([
    'approve_report',
    'reject_report',
    'mark_dead',
    'feature_deal',
    'unfeature_deal',
    'ban_user',
    'trust_user',
    'purge_samples',
  ]),
  targetId: z.string().optional(),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  let moderator;
  try {
    moderator = await requireRole('moderator');
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Demo mode: moderation is disabled', demo: true }, { status: 503 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  const { action, targetId, reason } = parsed.data;
  const db = getDb();

  switch (action) {
    case 'approve_report': {
      if (!targetId) return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });
      const [report] = await db
        .update(schema.reports)
        .set({ moderationStatus: 'approved' })
        .where(eq(schema.reports.id, targetId))
        .returning();
      if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      await onReportApproved(report.id);

      // Notify the reporter (spec §12 report-approved template).
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, report.userId));
      const [deal] = await db.select().from(schema.deals).where(eq(schema.deals.id, report.dealId));
      const [item] = deal
        ? await db.select().from(schema.items).where(eq(schema.items.id, deal.itemId))
        : [];
      if (user && item) {
        const tpl = reportApprovedEmail({
          username: user.username,
          itemName: item.name,
          dealUrl: siteUrl(`/item/${item.upc}`),
          firstApproved: user.approvedReports === 1,
        });
        await sendEmail({ to: user.email, ...tpl, template: 'report-approved', userId: user.id });
      }
      break;
    }
    case 'reject_report': {
      if (!targetId) return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });
      await db
        .update(schema.reports)
        .set({ moderationStatus: 'rejected' })
        .where(eq(schema.reports.id, targetId));
      break;
    }
    case 'mark_dead': {
      if (!targetId) return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });
      await db.update(schema.deals).set({ status: 'dead' }).where(eq(schema.deals.id, targetId));
      break;
    }
    case 'feature_deal':
    case 'unfeature_deal': {
      if (!targetId) return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });
      await db
        .update(schema.deals)
        .set({ featured: action === 'feature_deal' })
        .where(eq(schema.deals.id, targetId));
      break;
    }
    case 'ban_user':
    case 'trust_user': {
      if (!targetId) return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });
      await db
        .update(schema.users)
        .set({ trustLevel: action === 'ban_user' ? 'banned' : 'trusted' })
        .where(eq(schema.users.id, targetId));
      break;
    }
    case 'purge_samples': {
      // Sample deals are flagged isSample — retire them all in one click (spec §12).
      await db.update(schema.deals).set({ status: 'dead' }).where(eq(schema.deals.isSample, true));
      break;
    }
  }

  await db.insert(schema.moderationLog).values({
    moderatorId: moderator.id,
    action,
    targetType: action.includes('user') ? 'user' : action.includes('report') ? 'report' : 'deal',
    targetId: targetId ?? '00000000-0000-0000-0000-000000000000',
    reason,
  });
  invalidateCore();

  return NextResponse.json({ ok: true });
}
