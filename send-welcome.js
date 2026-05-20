/**
 * send-welcome.js
 * Sends a branded welcome email to all Dobium users via the existing sendEmail lib.
 * Run with: node send-welcome.js
 */
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./backend/lib/email');

const ADMIN_EMAIL = 'donotreply.dobium@gmail.com';

// Skip these (test / junk accounts)
const SKIP_EMAILS = new Set([
  ADMIN_EMAIL,
  'peepeeeepooopoo@gmail.com',
  'hebdhdbdbsbhbbbhhdhdhsh@gmail.com',
]);

const SUBJECT = 'Welcome to Dobium — Probability Trading, Reimagined';

const HEADING = 'Welcome to Dobium.';

const BODY = `Dobium is a probability trading platform where positions gain or lose value as market probabilities change in real time.

Unlike traditional all-or-nothing prediction markets, Dobium uses a dynamically scaled risk and reward system with bounded returns — designed to create a more structured trading experience.

You can trade:
  • Binary markets
  • Multi-option outcomes
  • Multi-event markets

How it works:
  • Lower probability positions carry higher potential upside and downside.
  • Higher probability positions move more conservatively.
  • Position values update dynamically throughout the event.

Dobium is currently in paper trading mode while we test market behavior, pricing mechanics, and user experience.

Explore markets, test strategies, and experience probability trading in real time.`;

const CALLOUT = '📌 Paper trading mode is active — all positions use virtual funds. No real money is at risk.';

const CTA = 'Start Trading →';

// Build the full HTML email
function buildHtml(username) {
  const greeting = username || null;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${SUBJECT}</title></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.12);">

        <!-- Gold top bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#b8952a,#d4af37,#f0cc6a,#d4af37,#b8952a);font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Logo header -->
        <tr><td align="center" style="padding:18px 32px;background-color:#071428;">
          <img src="https://dobium.up.railway.app/Logo-Title.png" alt="Dobium" width="140" style="display:block;height:auto;border:0;margin:0 auto;" />
        </td></tr>

        <!-- Hero -->
        <tr><td align="center" style="padding:40px 32px 36px;background:linear-gradient(160deg,#0f2040 0%,#071428 100%);">
          <div style="width:52px;height:52px;border-radius:50%;background:rgba(212,175,55,0.15);border:1.5px solid rgba(212,175,55,0.5);margin:0 auto 18px;text-align:center;line-height:52px;font-size:24px;color:#d4af37;">&#10022;</div>
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#f1f5f9;line-height:1.2;">${HEADING}</h1>
          <p style="margin:10px 0 0;font-size:14px;color:#64748b;">Probability trading, reimagined.</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background-color:#ffffff;padding:32px 32px 4px;">
          ${greeting ? `<p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#1e293b;">Hi ${greeting},</p>` : ''}
          <p style="margin:0;font-size:15px;line-height:1.85;color:#475569;white-space:pre-wrap;">${BODY}</p>
        </td></tr>

        <!-- Callout -->
        <tr><td style="background-color:#ffffff;padding:20px 32px 4px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="border-left:4px solid #d4af37;background:#fffbeb;border-radius:0 8px 8px 0;padding:14px 18px;">
              <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;font-weight:500;">${CALLOUT}</p>
            </td>
          </tr></table>
        </td></tr>

        <!-- CTA -->
        <tr><td align="center" style="background-color:#ffffff;padding:28px 32px 4px;">
          <a href="https://dobium.up.railway.app" style="display:inline-block;padding:14px 44px;background:linear-gradient(135deg,#b8952a,#d4af37);color:#0f172a;font-size:15px;font-weight:800;text-decoration:none;border-radius:8px;">${CTA}</a>
        </td></tr>

        <tr><td style="height:32px;background-color:#ffffff;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding:22px 32px 26px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">&copy; ${year} Dobium &middot; All rights reserved.</p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;line-height:1.6;">You received this as a registered user of Dobium Prediction Markets.<br/>This is an automated system notification.</p>
        </td></tr>

        <!-- Gold bottom bar -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#b8952a,#d4af37,#f0cc6a,#d4af37,#b8952a);font-size:0;line-height:0;">&nbsp;</td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function run() {
  console.log('🔌 Connecting to Supabase...');
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('❌ Failed to fetch users:', error.message);
    process.exit(1);
  }

  const recipients = data.users
    .filter(u => u.email && !SKIP_EMAILS.has(u.email))
    .map(u => ({ id: u.id, email: u.email }));

  console.log(`📬 Sending to ${recipients.length} users (${SKIP_EMAILS.size} skipped):\n`);

  let sent = 0, failed = 0;

  for (const user of recipients) {
    try {
      await sendEmail({
        to: user.email,
        subject: SUBJECT,
        text: BODY,
        html: buildHtml(null) // no first name available — generic greeting
      });
      console.log(`  ✅ ${user.email}`);
      sent++;
      // Small delay between sends to avoid SMTP rate limits
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error(`  ❌ ${user.email} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Done — ${sent} sent, ${failed} failed.`);
}

run();
