/**
 * HTML email templates (welcome, alert, weekly digest, report-approved).
 * Hand-rolled table layout for maximum client compatibility; brand copper
 * accent #B87333. See DECISIONS.md #9 for why not React Email.
 */
const COPPER = '#B87333';
const APP = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://pennyradar.ca';

export function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f6f5f3;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f3;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:${COPPER};padding:20px 32px;">
  <a href="${APP()}" style="color:#fff;text-decoration:none;font-size:20px;font-weight:700;">🪙 PennyRadar <span style="font-weight:400;opacity:.85;">Canada</span></a>
</td></tr>
<tr><td style="padding:32px;">${bodyHtml}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #eee;font-size:12px;color:#78716c;line-height:1.5;">
  Prices are community-reported and not guaranteed. PennyRadar is not affiliated with any retailer. Stores may refuse to sell items that scan at $0.01 — always verify in-store.<br>
  <a href="${APP()}/account" style="color:${COPPER};">Email preferences</a> · <a href="${APP()}/legal/privacy" style="color:${COPPER};">Privacy</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:${COPPER};color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;margin:16px 0;">${label}</a>`;

const dealRow = (d: { name: string; retailer: string; original: string; price: string; where: string; url: string }) =>
  `<tr><td style="padding:12px 0;border-bottom:1px solid #f0efec;">
    <a href="${d.url}" style="color:#1c1917;text-decoration:none;font-weight:600;">${d.name}</a>
    <div style="font-size:13px;color:#78716c;margin-top:2px;">${d.retailer} · ${d.where}</div>
    <div style="margin-top:4px;"><s style="color:#a8a29e;font-size:13px;">${d.original}</s>
    <span style="color:${COPPER};font-weight:700;font-size:16px;margin-left:6px;">${d.price}</span></div>
  </td></tr>`;

export function welcomeEmail(username: string): { subject: string; html: string } {
  return {
    subject: 'Welcome to PennyRadar — here’s how the hunt works',
    html: layout(
      'Welcome to PennyRadar',
      `<h1 style="margin:0 0 16px;font-size:24px;">Welcome, ${username} 🪙</h1>
      <p style="line-height:1.6;">You just joined Canada's community-powered penny list. Three things to do in your first five minutes:</p>
      <ol style="line-height:1.9;">
        <li><strong>Browse the <a href="${APP()}/deals" style="color:${COPPER};">live penny list</a></strong> and filter to your province.</li>
        <li><strong>Set an <a href="${APP()}/alerts" style="color:${COPPER};">area alert</a></strong> — postal code + radius, and we'll email you when a penny wave hits nearby.</li>
        <li><strong>Read the <a href="${APP()}/decoder" style="color:${COPPER};">tag decoder</a></strong> for your favourite store so the clearance aisle starts talking to you.</li>
      </ol>
      <p style="line-height:1.6;">Found something scanning low? Report it — five approved reports makes you a trusted hunter with instant publishing.</p>
      ${btn(`${APP()}/report`, 'Report your first find')}
      <p style="line-height:1.6;color:#78716c;font-size:14px;">One etiquette rule above all: stores can refuse a penny sale — accept it politely. Happy hunting!</p>`
    ),
  };
}

export function alertEmail(opts: {
  username: string;
  areaLabel: string;
  deals: { name: string; retailer: string; original: string; price: string; where: string; url: string }[];
}): { subject: string; html: string } {
  const s = opts.deals.length === 1 ? '' : 's';
  return {
    subject: `🪙 ${opts.deals.length} new penny deal${s} near ${opts.areaLabel}`,
    html: layout(
      'New deals near you',
      `<h1 style="margin:0 0 8px;font-size:22px;">Penny wave near ${opts.areaLabel}</h1>
      <p style="line-height:1.6;color:#57534e;">New community-reported deals matching your alert:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${opts.deals.map(dealRow).join('')}</table>
      ${btn(`${APP()}/deals`, 'See the full list')}
      <p style="font-size:13px;color:#78716c;line-height:1.5;">Verify before you drive: open the deal, check the last-confirmed time, and bring the barcode. Manage this alert in <a href="${APP()}/alerts" style="color:${COPPER};">your alerts</a>.</p>`
    ),
  };
}

export function digestEmail(opts: {
  province: string;
  deals: { name: string; retailer: string; original: string; price: string; where: string; url: string }[];
  leaders: { username: string; value: string }[];
}): { subject: string; html: string } {
  return {
    subject: `This week's penny finds in ${opts.province}`,
    html: layout(
      'Weekly digest',
      `<h1 style="margin:0 0 8px;font-size:22px;">This week in ${opts.province} 🪙</h1>
      <p style="line-height:1.6;color:#57534e;">The top community-verified finds of the week:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${opts.deals.map(dealRow).join('')}</table>
      <h2 style="font-size:16px;margin:24px 0 8px;">Leaderboard movers</h2>
      <p style="line-height:1.8;color:#57534e;">${opts.leaders
        .map((l, i) => `${i + 1}. <strong>${l.username}</strong> — ${l.value} retail value found`)
        .join('<br>')}</p>
      ${btn(`${APP()}/deals`, 'Open the live list')}`
    ),
  };
}

export function reportApprovedEmail(opts: {
  username: string;
  itemName: string;
  dealUrl: string;
  firstApproved: boolean;
}): { subject: string; html: string } {
  return {
    subject: opts.firstApproved
      ? '🎉 Your first find is live on PennyRadar!'
      : `Your report is live: ${opts.itemName}`,
    html: layout(
      'Report approved',
      `<h1 style="margin:0 0 16px;font-size:22px;">${opts.firstApproved ? 'First find approved! 🎉' : 'Report approved ✅'}</h1>
      <p style="line-height:1.6;">Your report for <strong>${opts.itemName}</strong> passed moderation and is now on the live list${
        opts.firstApproved ? ' — and the <strong>First Find</strong> badge is in your badge case' : ''
      }.</p>
      <p style="line-height:1.6;color:#57534e;">Hunters in the area are being alerted. Confirmations on your find build your trust level — at five approved reports you publish instantly.</p>
      ${btn(opts.dealUrl, 'See your deal live')}`
    ),
  };
}
