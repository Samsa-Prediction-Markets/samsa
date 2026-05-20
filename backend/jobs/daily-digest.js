/**
 * backend/jobs/daily-digest.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Registers a node-cron job that fires every day at 12:00 PM CST (18:00 UTC).
 *
 * For each registered user it:
 *   1. Fetches their balance breakdown and active positions from the DB.
 *   2. Builds a personalised HTML digest email.
 *   3. Sends it via the existing nodemailer transport.
 *
 * Exports:  registerDailyDigestJob(models, sendEmail)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const { buildDigestHtml } = require('../lib/digest-email');

const ADMIN_EMAIL  = process.env.EMAIL_USER || 'donotreply.dobium@gmail.com';
const PLATFORM_URL = process.env.PLATFORM_URL || 'https://dobium.com';

// Emails that should never receive digests
const SKIP_EMAILS = new Set([
  ADMIN_EMAIL,
  'peepeeeepooopoo@gmail.com',
  'hebdhdbdbsbhbbbhhdhdhsh@gmail.com',
]);

const PAPER_STARTING_BALANCE = Number(process.env.PAPER_TRADING_STARTING_BALANCE || 100_000);

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute a full balance breakdown for one user, identical to the server
 * helper but inlined here so the job file is self-contained.
 */
async function getUserStats(userId, { Transaction, Prediction, Outcome, Market }) {
  const [txns, predictions] = await Promise.all([
    Transaction.findAll({ where: { user_id: userId } }),
    Prediction.findAll({ where: { user_id: userId } }),
  ]);

  const totalDeposits = txns
    .filter(t => t.type === 'deposit' && t.status === 'completed' && t.payment_method !== 'sell_return')
    .reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  const totalWithdrawals = txns
    .filter(t => t.type === 'withdrawal' && t.status === 'completed')
    .reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  const activePreds = predictions.filter(p => p.status === 'active');
  const activePredictionStakes = activePreds.reduce((s, p) => s + parseFloat(p.stake_amount || 0), 0);

  const realized = predictions.filter(p => ['won', 'lost', 'sold', 'refunded'].includes(p.status));
  const realizedStake  = realized.reduce((s, p) => s + parseFloat(p.stake_amount || 0), 0);
  const realizedReturn = realized.reduce((s, p) => s + parseFloat(p.actual_return || 0), 0);
  const realizedPnl    = realizedReturn - realizedStake;

  const cashBalance = PAPER_STARTING_BALANCE + totalDeposits - totalWithdrawals + realizedPnl;
  const rawBalance  = cashBalance - activePredictionStakes;
  const buyingPower = Math.max(0, rawBalance);

  // Build open positions with market/outcome titles
  const positions = [];
  for (const p of activePreds) {
    try {
      const [market, outcome] = await Promise.all([
        Market.findByPk(p.market_id),
        Outcome.findByPk(p.outcome_id),
      ]);

      const stake      = parseFloat(p.stake_amount || 0);
      const entryProb  = parseFloat(p.entry_probability || 50);
      const currentProb = outcome ? parseFloat(outcome.probability || 50) : entryProb;

      // Linear interpolation value (same formula as frontend)
      const pE = entryProb  / 100;
      const pC = currentProb / 100;
      const maxReturn = stake + stake * (1 - pE);
      const minReturn = stake * pE;
      const currentValue = minReturn + (maxReturn - minReturn) * pC;

      positions.push({
        marketTitle:  market  ? market.title  : p.market_id,
        outcomeTitle: outcome ? outcome.title : p.outcome_id,
        stake,
        entryProb,
        currentProb,
        currentValue: parseFloat(currentValue.toFixed(2)),
      });
    } catch {
      // skip malformed position rather than crashing the whole digest
    }
  }

  const hasEverTraded = predictions.length > 0;

  return { buyingPower, realizedPnl, activePredictionStakes, positions, hasEverTraded };
}

// ── job registration ─────────────────────────────────────────────────────────

/**
 * @param {Object} models    - destructured Sequelize models { User, Transaction, Prediction, Outcome, Market }
 * @param {Function} sendEmail - the existing sendEmail({ to, subject, text, html }) function
 */
function registerDailyDigestJob(models, sendEmail) {
  const { User, Transaction, Prediction, Outcome, Market } = models;

  // node-cron schedule: "0 18 * * *"  → 18:00 UTC = 12:00 PM CST (UTC-6)
  // CST = UTC-6.  CDT = UTC-5 (summer).  12:00 CST = 18:00 UTC.
  const schedule = process.env.DIGEST_CRON || '0 18 * * *';

  cron.schedule(schedule, async () => {
    console.log('[Daily Digest] Job triggered at', new Date().toISOString());

    // Fetch recipients from Supabase Auth (authoritative email list)
    let recipients = [];
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;

      recipients = data.users
        .filter(u => u.email && !SKIP_EMAILS.has(u.email))
        .map(u => ({
          userId:   u.id,
          email:    u.email,
          username: u.user_metadata?.name || u.user_metadata?.full_name || null,
        }));
    } catch (err) {
      console.error('[Daily Digest] Failed to fetch recipients from Supabase:', err.message);
      return;
    }

    console.log(`[Daily Digest] Sending to ${recipients.length} users`);

    let sent = 0, failed = 0;

    for (const recipient of recipients) {
      try {
        const stats = await getUserStats(recipient.userId, { Transaction, Prediction, Outcome, Market });

        const html = buildDigestHtml({
          username:              recipient.username,
          buyingPower:           stats.buyingPower,
          realizedPnl:           stats.realizedPnl,
          activePredictionStakes: stats.activePredictionStakes,
          positions:             stats.positions,
          hasEverTraded:         stats.hasEverTraded,
        });

        const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        const subject = `Your Dobium Daily Digest — ${today}`;

        const text = stats.hasEverTraded
          ? `Hey ${recipient.username || 'there'},\n\nHere's your Dobium snapshot for ${today}.\n\nBuying Power: $${stats.buyingPower.toFixed(2)}\nRealized P&L: ${stats.realizedPnl >= 0 ? '+' : ''}$${stats.realizedPnl.toFixed(2)}\nOpen Positions: ${stats.positions.length}\n\nView your dashboard: ${PLATFORM_URL}/dashboard\n\n─\n© ${new Date().getFullYear()} Dobium`
          : `Hey ${recipient.username || 'there'},\n\nYou haven't placed a trade yet! You have $${stats.buyingPower.toFixed(2)} in buying power ready to go.\n\nExplore live markets and make your first prediction:\n${PLATFORM_URL}/explore\n\n─\n© ${new Date().getFullYear()} Dobium`;

        await sendEmail({ to: recipient.email, subject, text, html });
        console.log(`[Daily Digest]   ✓ ${recipient.email}`);
        sent++;

        // Rate-limit buffer — avoid hitting Gmail's per-second limit
        await new Promise(r => setTimeout(r, 600));
      } catch (err) {
        console.error(`[Daily Digest]   ✗ ${recipient.email} — ${err.message}`);
        failed++;
      }
    }

    console.log(`[Daily Digest] Done — ${sent} sent, ${failed} failed.`);
  }, {
    timezone: 'America/Chicago', // CST/CDT — node-cron uses IANA tz names
  });

  console.log(`[Daily Digest] Scheduled at ${schedule} (America/Chicago — 12:00 PM CST)`);
}

module.exports = { registerDailyDigestJob };
