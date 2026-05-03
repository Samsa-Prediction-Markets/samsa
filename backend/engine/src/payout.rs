// ============================================================================
// SAMSA ENGINE — PAYOUT (Fee-Free Rebated-Risk Model)
// ============================================================================
//
// Based on the spreadsheet model (f = 0.0 — fees disabled until real money):
//
//   S = user stake
//   p = market probability at time of trade (locked in)
//   f = platform fee = 0.0  (re-enable later by changing PLATFORM_FEE)
//
//   Profit  (win):   S × (1 − p) × (1 − f)  →  S × (1 − p)  when f=0
//   Win total:       S + S × (1 − p)          →  S × (2 − p)
//   Loss:            S × (1 − p)
//   Lose refund:     S × p                    (loser always gets something back)
//   Platform rev:    S × f × (1 − p)          →  0.0         when f=0
//
// The blue-highlighted fee column from the spreadsheet is preserved as a
// constant set to 0.0 — flip it to 0.01 to re-enable fees.
// ============================================================================

use serde::{Deserialize, Serialize};

/// Platform fee fraction. Set to 0.0 until real money is enabled.
/// To re-enable fees: change this to 0.01.
pub const PLATFORM_FEE: f64 = 0.0;

/// A single trade input for settlement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeInput {
    pub trade_id: String,
    pub user_id: String,
    /// Stake in dollars
    pub stake: f64,
    /// Probability locked in at trade time (0–1)
    pub entry_prob: f64,
    /// The outcome the user bet on
    pub outcome_id: String,
}

/// Result of settling one trade
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PayoutResult {
    pub trade_id: String,
    pub user_id: String,
    pub won: bool,
    pub stake: f64,
    pub entry_prob: f64,
    /// Amount credited to the user's balance
    pub payout: f64,
    /// Platform revenue from this trade (0.0 when fees disabled)
    pub platform_revenue: f64,
    /// Human-readable formula used
    pub formula: String,
}

/// Full resolution result for a market
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolutionResult {
    pub payouts: Vec<PayoutResult>,
    pub total_platform_revenue: f64,
    pub winners_count: usize,
    pub losers_count: usize,
    pub total_paid_to_winners: f64,
    pub total_refunded_to_losers: f64,
}

/// Breakdown for a single trade preview (UI display)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeBreakdown {
    pub stake: f64,
    pub probability: f64,
    pub probability_percent: f64,
    pub fee: f64,
    pub win: WinScenario,
    pub lose: LoseScenario,
    pub platform_revenue: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WinScenario {
    /// Profit gained: S × (1−p) × (1−f)
    pub profit: f64,
    /// Total received: S + profit
    pub total_return: f64,
    /// Return as % of stake
    pub return_percent: f64,
    pub formula: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoseScenario {
    /// Amount lost: S × (1−p)
    pub loss: f64,
    /// Refund received: S × p
    pub refund: f64,
    /// Refund as % of stake
    pub return_percent: f64,
    pub formula: String,
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/// Settle a single trade with the fee-free rebated-risk model.
///
/// S=100, p=0.05:
///   win  → payout = 100 × (2 − 0.05) = 195
///   lose → payout = 100 × 0.05        = 5
pub fn settle_trade(stake: f64, prob: f64, did_win: bool, fee: f64) -> (f64, f64, String) {
    let s = stake;
    let p = if prob > 1.0 { prob / 100.0 } else { prob }.clamp(0.001, 0.999);
    let f = fee;

    if did_win {
        // Win profit = S × (1−p) × (1−f)
        let profit = s * (1.0 - p) * (1.0 - f);
        let payout = round2(s + profit);
        let platform_rev = round2(s * f * (1.0 - p));
        let formula = format!(
            "Win: S + S×(1−p)×(1−f) = {s} + {s}×{:.4}×{:.4} = {payout:.2}",
            1.0 - p,
            1.0 - f
        );
        (payout, platform_rev, formula)
    } else {
        // Loser always gets back S × p (their stake × probability)
        let refund = round2(s * p);
        let formula = format!("Lose refund: S×p = {s}×{p:.4} = {refund:.2}");
        (refund, 0.0, formula)
    }
}

/// Calculate a full trade preview breakdown (for UI display)
pub fn trade_breakdown(stake: f64, probability: f64, fee: f64) -> TradeBreakdown {
    let s = stake;
    let p = if probability > 1.0 { probability / 100.0 } else { probability }.clamp(0.001, 0.999);
    let f = fee;

    let win_profit = s * (1.0 - p) * (1.0 - f);
    let win_return = s + win_profit;
    let lose_loss = s * (1.0 - p);
    let lose_refund = s * p;
    let platform_rev = s * f * (1.0 - p);

    TradeBreakdown {
        stake: s,
        probability: p,
        probability_percent: p * 100.0,
        fee: f,
        win: WinScenario {
            profit: round2(win_profit),
            total_return: round2(win_return),
            return_percent: if s > 0.0 { round2(win_return / s * 100.0) } else { 0.0 },
            formula: format!(
                "S×(1−p)×(1−f) = {s}×{:.4}×{:.4} = {win_profit:.2}",
                1.0 - p,
                1.0 - f
            ),
        },
        lose: LoseScenario {
            loss: round2(lose_loss),
            refund: round2(lose_refund),
            return_percent: if s > 0.0 { round2(lose_refund / s * 100.0) } else { 0.0 },
            formula: format!("S×p = {s}×{p:.4} = {lose_refund:.2}"),
        },
        platform_revenue: round2(platform_rev),
    }
}

/// Resolve all trades in a market, returning payouts for every participant.
pub fn resolve_market(trades: &[TradeInput], winning_outcome_id: &str) -> ResolutionResult {
    let mut payouts = Vec::with_capacity(trades.len());
    let mut total_platform_revenue = 0.0_f64;
    let mut total_paid_to_winners = 0.0_f64;
    let mut total_refunded_to_losers = 0.0_f64;
    let mut winners_count = 0_usize;
    let mut losers_count = 0_usize;

    for trade in trades {
        let won = trade.outcome_id == winning_outcome_id;
        let (payout, platform_rev, formula) =
            settle_trade(trade.stake, trade.entry_prob, won, PLATFORM_FEE);

        total_platform_revenue += platform_rev;

        if won {
            total_paid_to_winners += payout;
            winners_count += 1;
        } else {
            total_refunded_to_losers += payout;
            losers_count += 1;
        }

        payouts.push(PayoutResult {
            trade_id: trade.trade_id.clone(),
            user_id: trade.user_id.clone(),
            won,
            stake: round2(trade.stake),
            entry_prob: trade.entry_prob,
            payout,
            platform_revenue: platform_rev,
            formula,
        });
    }

    ResolutionResult {
        payouts,
        total_platform_revenue: round2(total_platform_revenue),
        winners_count,
        losers_count,
        total_paid_to_winners: round2(total_paid_to_winners),
        total_refunded_to_losers: round2(total_refunded_to_losers),
    }
}

/// Round to 2 decimal places (cents)
fn round2(x: f64) -> f64 {
    (x * 100.0).round() / 100.0
}

// ============================================================================
// UNIT TESTS — cross-checked against spreadsheet values
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    /// Spreadsheet: S=100, p=0.05, f=0 → win=195, lose=5
    #[test]
    fn test_spreadsheet_p05() {
        let (win, pr_win, _) = settle_trade(100.0, 0.05, true, 0.0);
        let (lose, pr_lose, _) = settle_trade(100.0, 0.05, false, 0.0);
        assert_eq!(win, 195.0);
        assert_eq!(lose, 5.0);
        assert_eq!(pr_win, 0.0);
        assert_eq!(pr_lose, 0.0);
    }

    /// Spreadsheet: S=100, p=0.5, f=0 → win=150, lose=50
    #[test]
    fn test_spreadsheet_p50() {
        let (win, _, _) = settle_trade(100.0, 0.5, true, 0.0);
        let (lose, _, _) = settle_trade(100.0, 0.5, false, 0.0);
        assert_eq!(win, 150.0);
        assert_eq!(lose, 50.0);
    }

    /// Spreadsheet: S=100, p=0.95, f=0 → win=105, lose=95
    #[test]
    fn test_spreadsheet_p95() {
        let (win, _, _) = settle_trade(100.0, 0.95, true, 0.0);
        let (lose, _, _) = settle_trade(100.0, 0.95, false, 0.0);
        assert_eq!(win, 105.0);
        assert_eq!(lose, 95.0);
    }

    /// Platform revenue must be 0 at all probabilities when fee=0
    #[test]
    fn test_no_platform_revenue_when_fee_zero() {
        for p in [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95] {
            let (_, pr, _) = settle_trade(100.0, p, true, 0.0);
            assert_eq!(pr, 0.0, "Platform revenue should be 0 at p={p}");
        }
    }

    /// Win + Lose refund = S + S×(1−p) + S×p = 2S (zero sum per stake unit)
    #[test]
    fn test_conservation_of_value() {
        for p in [0.1, 0.25, 0.5, 0.67, 0.8] {
            let s = 100.0;
            let (win, _, _) = settle_trade(s, p, true, 0.0);
            let (lose_refund, _, _) = settle_trade(s, p, false, 0.0);
            // Win total + what loser keeps = 2×S (stake came from somewhere)
            // Actually: win_payout + lose_refund should equal 2S for zero-sum
            let total = win + lose_refund;
            let expected = 2.0 * s;
            assert!(
                (total - expected).abs() < 0.01,
                "Conservation failed at p={p}: {win} + {lose_refund} = {total} ≠ {expected}"
            );
        }
    }

    /// resolve_market batches multiple trades correctly
    #[test]
    fn test_resolve_market_batch() {
        let trades = vec![
            TradeInput {
                trade_id: "t1".into(),
                user_id: "u1".into(),
                stake: 100.0,
                entry_prob: 0.5,
                outcome_id: "YES".into(),
            },
            TradeInput {
                trade_id: "t2".into(),
                user_id: "u2".into(),
                stake: 100.0,
                entry_prob: 0.5,
                outcome_id: "NO".into(),
            },
        ];
        let result = resolve_market(&trades, "YES");
        assert_eq!(result.winners_count, 1);
        assert_eq!(result.losers_count, 1);
        // Winner: 100 + 100×0.5 = 150
        assert_eq!(result.total_paid_to_winners, 150.0);
        // Loser refund: 100×0.5 = 50
        assert_eq!(result.total_refunded_to_losers, 50.0);
        assert_eq!(result.total_platform_revenue, 0.0);
    }

    /// Trade breakdown matches expected values
    #[test]
    fn test_trade_breakdown_p25() {
        let bd = trade_breakdown(100.0, 0.25, 0.0);
        assert_eq!(bd.win.profit, 75.0);
        assert_eq!(bd.win.total_return, 175.0);
        assert_eq!(bd.lose.refund, 25.0);
        assert_eq!(bd.lose.loss, 75.0);
        assert_eq!(bd.platform_revenue, 0.0);
    }
}
