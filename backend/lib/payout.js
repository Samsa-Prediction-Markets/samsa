'use strict';

/**
 * DOBIUM TRADING MODEL — PAYOUTS
 *
 * Runs when a market resolves.
 * Uses entryProb saved at trade time — NOT the final probability.
 *
 * Winner gets:   S + S × (1 - p) × (1 - f)
 * Loser gets:    S × p               ← always gets something back
 * Platform gets: S × f × (1 - p)     ← only from winners, only when p is low
 */

const PLATFORM_FEE = 0.01;

function resolveMarket(trades, winningOutcomeId) {
  const payouts = [];
  let totalPlatformRevenue = 0;

  for (const trade of trades) {
    const S   = trade.amount;
    const p   = trade.entryProb;  // probability locked in at trade time
    const f   = PLATFORM_FEE;
    const won = trade.outcomeId === winningOutcomeId;

    let userPayout;
    let platformRevenue;

    if (won) {
      // ── WINNER ───────────────────────────────────────────────
      // Profit           = S × (1 - p) × (1 - f)
      // Winning total    = S + Profit
      // Platform Revenue = S × f × (1 - p)
      const profit    = S * (1 - p) * (1 - f);
      userPayout      = round(S + profit);
      platformRevenue = round(S * f * (1 - p));
    } else {
      // ── LOSER — never walks away empty ───────────────────────
      // Losing refund = S × p
      // Platform earns nothing on losing side
      userPayout      = round(S * p);
      platformRevenue = 0;
    }

    totalPlatformRevenue += platformRevenue;

    payouts.push({
      tradeId:        trade.id,
      userId:         trade.userId,
      won,
      stake:          round(S),
      entryProb:      p,
      payout:         userPayout,
      platformRevenue,
    });
  }

  return {
    payouts,
    totalPlatformRevenue: round(totalPlatformRevenue),
  };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { resolveMarket };
