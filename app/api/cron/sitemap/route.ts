import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * Daily sitemap refresh: Next generates /sitemap.xml on demand; this cron
 * just revalidates it (and the feed pages) so new items appear promptly.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  revalidatePath('/sitemap.xml');
  revalidatePath('/deals');
  revalidatePath('/rss.xml');
  return NextResponse.json({ ok: true });
}
