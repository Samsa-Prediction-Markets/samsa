/**
 * backend/lib/digest-email.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds the personalized daily digest HTML email for a single user.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PLATFORM_URL = process.env.PLATFORM_URL || 'https://dobium.com';

/**
 * Format a dollar value with sign for P&L display
 */
function fmtPnl(val) {
  const n = parseFloat(val || 0);
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n >= 0 ? `+$${abs}` : `-$${abs}`;
}

function fmtDollar(val) {
  return '$' + parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Build the HTML digest for a user.
 *
 * @param {Object} opts
 * @param {string}  opts.username        - display name (may be null)
 * @param {number}  opts.buyingPower     - current spendable cash
 * @param {number}  opts.realizedPnl     - all-time realized P&L
 * @param {number}  opts.activePredictionStakes - total locked in open positions
 * @param {Array}   opts.positions       - active positions [{marketTitle, outcomeTitle, stake, currentProb, entryProb}]
 * @param {boolean} opts.hasEverTraded   - false = show "get started" CTA
 */
function buildDigestHtml({ username, buyingPower, realizedPnl, activePredictionStakes, positions, hasEverTraded }) {
  const year = new Date().getFullYear();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const pnlColor = realizedPnl >= 0 ? '#4ade80' : '#f87171';
  const pnlText = fmtPnl(realizedPnl);

  // ── Positions rows ────────────────────────────────────────────────────────
  const positionsHtml = positions.length > 0
    ? positions.slice(0, 5).map(p => {
        const pnlRaw = (p.currentValue || p.stake) - p.stake;
        const pnlStr = fmtPnl(pnlRaw);
        const pnlC = pnlRaw >= 0 ? '#4ade80' : '#f87171';
        const pctStr = `${(p.currentProb || p.entryProb || 0).toFixed(0)}%`;
        return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #1e3a5f;">
            <div style="font-size:13px;color:#f1f5f9;font-weight:600;margin-bottom:2px;">${escHtml(p.marketTitle)}</div>
            <div style="font-size:11px;color:#64748b;">Position: <span style="color:#d4af37;">${escHtml(p.outcomeTitle)}</span> · ${pctStr} probability</div>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #1e3a5f;text-align:right;white-space:nowrap;">
            <div style="font-size:13px;color:#cbd5e1;">${fmtDollar(p.stake)}</div>
            <div style="font-size:11px;font-weight:700;color:${pnlC};">${pnlStr}</div>
          </td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="2" style="padding:20px 16px;text-align:center;color:#475569;font-size:13px;">No open positions.</td></tr>`;

  // ── No-trades banner ──────────────────────────────────────────────────────
  const noTradesBanner = !hasEverTraded ? `
        <!-- Get started banner -->
        <tr><td style="background:#0c1e40;padding:24px 32px;border-top:1px solid rgba(212,175,55,0.15);border-bottom:1px solid rgba(212,175,55,0.15);">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-right:16px;">
                <div style="font-size:16px;font-weight:700;color:#f1f5f9;margin-bottom:6px;">Ready to make your first trade?</div>
                <div style="font-size:13px;color:#94a3b8;line-height:1.7;">You have <strong style="color:#d4af37;">${fmtDollar(buyingPower)}</strong> in buying power ready to go. Explore live markets and place your first prediction — no real money, all the edge.</div>
              </td>
              <td style="text-align:right;vertical-align:middle;white-space:nowrap;">
                <a href="${PLATFORM_URL}/explore" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#b8952a,#d4af37);color:#0a0f1e;font-size:13px;font-weight:900;text-decoration:none;border-radius:8px;">Explore Markets →</a>
              </td>
            </tr>
          </table>
        </td></tr>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Your Dobium Daily Digest — ${today}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0f1e;padding:32px 16px 48px;">
    <tr><td align="center">

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border-radius:16px;overflow:hidden;border:1px solid rgba(212,175,55,0.2);box-shadow:0 0 48px rgba(212,175,55,0.06);">

        <!-- Gold top bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#7a5c10,#b8952a,#d4af37,#f0cc6a,#d4af37,#b8952a,#7a5c10);font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Logo -->
        <tr><td align="center" style="padding:20px 32px 18px;background-color:#071428;">
          <img src="${PLATFORM_URL}/Logo-Title.png" alt="Dobium" width="130" style="display:block;height:auto;border:0;margin:0 auto;" />
        </td></tr>

        <!-- Hero -->
        <tr><td align="center" style="padding:30px 32px 24px;background:linear-gradient(160deg,#0c1e40 0%,#071428 60%,#04101f 100%);">
          <div style="width:48px;height:48px;border-radius:12px;background:rgba(212,175,55,0.1);border:1.5px solid rgba(212,175,55,0.4);margin:0 auto 16px;text-align:center;line-height:48px;font-size:22px;">📊</div>
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:900;color:#f1f5f9;line-height:1.2;">Your Daily Digest</h1>
          <p style="margin:0;font-size:13px;color:#64748b;">${today}</p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="background:#0a1628;padding:20px 32px;border-top:1px solid rgba(212,175,55,0.1);border-bottom:1px solid rgba(212,175,55,0.1);">
          ${username ? `<p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#f1f5f9;">Hey ${escHtml(username)},</p>` : ''}
          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.7;">Here's a snapshot of your Dobium portfolio as of today. ${hasEverTraded ? 'Keep an eye on your open positions below.' : "You haven't placed a trade yet — your buying power is waiting."}</p>
        </td></tr>

        <!-- Stats row -->
        <tr><td style="background:#071428;padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="text-align:center;padding:0 8px;border-right:1px solid #1e3a5f;">
                <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#475569;margin-bottom:6px;">Buying Power</div>
                <div style="font-size:22px;font-weight:900;color:#d4af37;">${fmtDollar(buyingPower)}</div>
              </td>
              <td style="text-align:center;padding:0 8px;border-right:1px solid #1e3a5f;">
                <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#475569;margin-bottom:6px;">Realized P&amp;L</div>
                <div style="font-size:22px;font-weight:900;color:${pnlColor};">${pnlText}</div>
              </td>
              <td style="text-align:center;padding:0 8px;">
                <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#475569;margin-bottom:6px;">Open Positions</div>
                <div style="font-size:22px;font-weight:900;color:#f1f5f9;">${positions.length}</div>
              </td>
            </tr>
          </table>
        </td></tr>

        ${noTradesBanner}

        <!-- Open Positions -->
        <tr><td style="background:#071428;padding:20px 32px 4px;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#475569;">Open Positions</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #1e3a5f;border-radius:10px;overflow:hidden;background:#0a1628;">
            ${positionsHtml}
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td align="center" style="background:#071428;padding:28px 32px 36px;">
          <a href="${PLATFORM_URL}/dashboard" style="display:inline-block;padding:14px 48px;background:linear-gradient(135deg,#b8952a 0%,#d4af37 50%,#e8c645 100%);color:#0a0f1e;font-size:14px;font-weight:900;text-decoration:none;border-radius:10px;letter-spacing:0.3px;box-shadow:0 4px 20px rgba(212,175,55,0.3);">View Full Dashboard →</a>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding:22px 32px 24px;background:#04101f;border-top:1px solid rgba(255,255,255,0.04);">
          <p style="margin:0 0 4px;font-size:11px;color:#334155;">© ${year} Dobium · All rights reserved.</p>
          <p style="margin:0;font-size:10px;color:#1e293b;line-height:1.6;">You receive this daily digest as a registered Dobium user.<br/>These emails are sent every day at 12 PM CT.</p>
        </td></tr>

        <!-- Gold bottom bar -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#7a5c10,#b8952a,#d4af37,#f0cc6a,#d4af37,#b8952a,#7a5c10);font-size:0;line-height:0;">&nbsp;</td></tr>

      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = { buildDigestHtml };
