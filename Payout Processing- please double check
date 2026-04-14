'use strict';

/**
 * DOBIUM PAYOUT PROCESSOR
 *
 * Executes payouts after resolveMarket() calculates them.
 *   1. Pays winners their winningTotal
 *   2. Refunds losers their S × p
 *   3. Records every transaction
 *   4. Marks every trade as won/lost
 *   5. Marks the market as resolved
 *   6. Tracks platform revenue
 */

const { resolveMarket } = require('./payouts');

async function processMarketResolution(
  marketId,
  winningOutcomeId,
  { Market, Outcome, Prediction, User, Transaction, sequelize }
) {
  // ── Step 1: Load market with all open trades ──────────────────
  const market = await Market.findByPk(marketId, {
    include: [
      { model: Outcome },
      {
        model: Prediction,
        where: { status: 'open' },
        required: false,
      },
    ],
  });

  if (!market)                   throw Object.assign(new Error('Market not found'), { status: 404 });
  if (market.status !== 'active') throw Object.assign(new Error('Market already resolved'), { status: 400 });

  const winOutcome = market.Outcomes.find((o) => o.id === winningOutcomeId);
  if (!winOutcome) throw Object.assign(new Error('Invalid winning outcome'), { status: 400 });

  // ── Step 2: Calculate all payouts using Dobium model ─────────
  const { payouts, totalPlatformRevenue } = resolveMarket(
    market.Predictions || [],
    winningOutcomeId
  );

  // ── Step 3: Execute everything in one atomic DB transaction ───
  const summary = await sequelize.transaction(async (t) => {
    let totalPaidToWinners    = 0;
    let totalRefundedToLosers = 0;
    let winnersCount          = 0;
    let losersCount           = 0;

    // Mark market as resolved
    await market.update(
      {
        status:          'resolved',
        resolvedAt:      new Date(),
        winOutcomeId:    winningOutcomeId,
      },
      { transaction: t }
    );

    // Process each trade
    for (const result of payouts) {

      // Update trade record
      await Prediction.update(
        {
          status: result.won ? 'won' : 'lost',
          payout: result.payout,
        },
        {
          where: { id: result.tradeId },
          transaction: t,
        }
      );

      if (result.won) {
        // ── Pay winner ───────────────────────────────────────
        await User.increment('balance', {
          by:    result.payout,
          where: { id: result.userId },
          transaction: t,
        });

        await Transaction.create(
          {
            userId: result.userId,
            type:   'payout',
            amount: result.payout,
            note:   `Won "${market.title}" — traded $${result.stake} at ${Math.round(result.entryProb * 100)}%`,
          },
          { transaction: t }
        );

        totalPaidToWinners += result.payout;
        winnersCount++;

      } else {
        // ── Refund loser ─────────────────────────────────────
        if (result.payout > 0) {
          await User.increment('balance', {
            by:    result.payout,
            where: { id: result.userId },
            transaction: t,
          });

          await Transaction.create(
            {
              userId: result.userId,
              type:   'refund',
              amount: result.payout,
              note:   `Refund from "${market.title}" — traded $${result.stake} at ${Math.round(result.entryProb * 100)}%`,
            },
            { transaction: t }
          );

          totalRefundedToLosers += result.payout;
        }
        losersCount++;
      }
    }

    return {
      marketId,
      winningOutcomeId,
      winningOutcomeLabel:   winOutcome.label,
      totalTrades:           payouts.length,
      winnersCount,
      losersCount,
      totalPaidToWinners:    round(totalPaidToWinners),
      totalRefundedToLosers: round(totalRefundedToLosers),
      totalPlatformRevenue:  round(totalPlatformRevenue),
    };
  });

  return summary;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { processMarketResolution };
