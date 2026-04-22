'use strict';

/**
 * SAMSA — Payouts (JS Canonical Fallback)
 *
 * This is the JavaScript implementation of the fee-free rebated-risk model.
 * It is used as a fallback when the Rust engine binary is not compiled,
 * and is kept in sync with engine/src/payout.rs.
 *
 * CANONICAL IMPLEMENTATION: engine/src/payout.rs (Rust)
 * This file: fallback for Node.js when Rust binary is unavailable.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Model (f = 0.0 — fees disabled until real money):
 *
 *   S = user stake
 *   p = market probability at time of trade (locked in at entry)
 *
 *   Win profit:      S × (1 − p)         [= S×(1−p)×(1−0) with f=0]
 *   Win total:       S + S × (1 − p)  =  S × (2 − p)
 *   Lose refund:     S × p
 *   Platform rev:    0.0                  [S × f × (1−p) with f=0]
 *
 * To re-enable fees: change PLATFORM_FEE to 0.01.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Blueprint: fees are preserved as a constant — set to 0.0 until real money.
// Mirror of payout::PLATFORM_FEE in Rust.
const PLATFORM_FEE = 0.0;

/**
 * Settle a single trade.
 *
 * @param {number} stake       - Stake in dollars
 * @param {number} probability - Probability at trade time (0–1 or 0–100)
 * @param {boolean} didWin     - Whether this trade won
 * @param {number} [fee]       - Platform fee (default: PLATFORM_FEE)
 * @returns {{ payout, platform_revenue, formula, won, stake, probability }}
 */
function settleTrade(stake, probability, didWin, fee = PLATFORM_FEE) {
  const S = stake;
  const p = probability > 1 ? probability / 100 : probability;
  const f = fee;

  if (didWin) {
    const profit = S * (1 - p) * (1 - f);
    const payout = round(S + profit);
    const platformRevenue = round(S * f * (1 - p));
    return {
      payout,
      platform_revenue: platformRevenue,
      formula: `Win: S + S×(1−p)×(1−f) = ${S} + ${S}×${(1 - p).toFixed(4)}×${(1 - f).toFixed(4)} = ${payout.toFixed(2)}`,
      won: true,
      stake: S,
      probability: p,
    };
  } else {
    const refund = round(S * p);
    return {
      payout: refund,
      platform_revenue: 0,
      formula: `Lose refund: S×p = ${S}×${p.toFixed(4)} = ${refund.toFixed(2)}`,
      won: false,
      stake: S,
      probability: p,
    };
  }
}

/**
 * Full trade preview breakdown (for UI display).
 * Matches TradeBreakdown in engine/src/payout.rs.
 *
 * @param {number} stake
 * @param {number} probability  (0–1 or 0–100)
 * @param {number} [fee]
 * @returns {object} TradeBreakdown
 */
function tradeBreakdown(stake, probability, fee = PLATFORM_FEE) {
  const S = stake;
  const p = probability > 1 ? probability / 100 : probability;
  const f = fee;

  const winProfit    = S * (1 - p) * (1 - f);
  const winReturn    = S + winProfit;
  const loseLoss     = S * (1 - p);
  const loseRefund   = S * p;
  const platformRev  = S * f * (1 - p);

  return {
    stake: S,
    probability: p,
    probability_percent: p * 100,
    fee: f,
    win: {
      profit:         round(winProfit),
      total_return:   round(winReturn),
      return_percent: S > 0 ? round(winReturn / S * 100) : 0,
      formula: `S×(1−p)×(1−f) = ${S}×${(1 - p).toFixed(4)}×${(1 - f).toFixed(4)} = ${winProfit.toFixed(2)}`,
    },
    lose: {
      loss:           round(loseLoss),
      refund:         round(loseRefund),
      return_percent: S > 0 ? round(loseRefund / S * 100) : 0,
      formula: `S×p = ${S}×${p.toFixed(4)} = ${loseRefund.toFixed(2)}`,
    },
    platform_revenue: round(platformRev),
  };
}

/**
 * Resolve all trades in a market after an outcome is decided.
 *
 * Uses entry_prob saved at trade time — NOT the final market probability.
 *
 * @param {Array<{id, userId, amount, entryProb, outcomeId}>} trades
 * @param {string} winningOutcomeId
 * @returns {{ payouts, total_platform_revenue, winners_count, losers_count,
 *             total_paid_to_winners, total_refunded_to_losers }}
 */
function resolveMarket(trades, winningOutcomeId) {
  const payouts = [];
  let totalPlatformRevenue   = 0;
  let totalPaidToWinners     = 0;
  let totalRefundedToLosers  = 0;
  let winnersCount = 0;
  let losersCount  = 0;

  for (const trade of trades) {
    const S   = Number(trade.amount   ?? trade.stake     ?? 0);
    const p   = Number(trade.entryProb ?? trade.entry_prob ?? 0);
    const won = trade.outcomeId === winningOutcomeId || trade.outcome_id === winningOutcomeId;

    const result = settleTrade(S, p, won, PLATFORM_FEE);

    totalPlatformRevenue += result.platform_revenue;

    if (won) {
      totalPaidToWinners += result.payout;
      winnersCount++;
    } else {
      totalRefundedToLosers += result.payout;
      losersCount++;
    }

    payouts.push({
      tradeId:         trade.id   ?? trade.trade_id,
      userId:          trade.userId ?? trade.user_id,
      won,
      stake:           round(S),
      entryProb:       p,
      payout:          result.payout,
      platformRevenue: result.platform_revenue,
      formula:         result.formula,
    });
  }

  return {
    payouts,
    total_platform_revenue:   round(totalPlatformRevenue),
    winners_count:            winnersCount,
    losers_count:             losersCount,
    total_paid_to_winners:    round(totalPaidToWinners),
    total_refunded_to_losers: round(totalRefundedToLosers),
  };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

module.exports = {
  PLATFORM_FEE,
  settleTrade,
  tradeBreakdown,
  resolveMarket,
};
