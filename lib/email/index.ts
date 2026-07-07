import { isDbConfigured, getDb, schema } from '../db';
import { layout, welcomeEmail, alertEmail, digestEmail, reportApprovedEmail } from './templates';

export { welcomeEmail, alertEmail, digestEmail, reportApprovedEmail, layout };

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY);

/**
 * Send via the Resend REST API and record in email_log.
 * No-ops (logged to console) when RESEND_API_KEY is unset.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  template: string;
  userId?: string;
}): Promise<{ sent: boolean }> {
  let status = 'skipped';
  if (isEmailConfigured()) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? 'PennyRadar <onboarding@resend.dev>',
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    });
    status = res.ok ? 'sent' : 'failed';
    if (!res.ok) console.error('[email] resend error', res.status, await res.text());
  } else {
    console.log(`[email:demo] would send "${opts.subject}" (${opts.template}) to ${opts.to}`);
  }

  if (isDbConfigured()) {
    await getDb().insert(schema.emailLog).values({
      userId: opts.userId,
      toEmail: opts.to,
      template: opts.template,
      subject: opts.subject,
      status,
    });
  }
  return { sent: status === 'sent' };
}
