// ============================================================================
// SAMSA - LMSR ENGINE
// Logarithmic Market Scoring Rule with Risk-Weighted Rebate Model
// ============================================================================
//
// FORMULAS IMPLEMENTED:
// ─────────────────────────────────────────────────────────────────────────────
//
// Pricing (Probability):
//   p = e^(qY/b) / (e^(qY/b) + e^(qN/b))
//
// Risk-Weighted Pressure Update:
//   ∆q = S(1 − p)
//
// State Update:
//   YES trade: qY ← qY + S(1 − p)
//   NO trade:  qN ← qN + S(1 − p)
//
// Local Probability Change (Approximation):
//   ∆p ≈ (p(1 − p) / b) · S(1 − p)
//
// Settlement (Rebated-Risk Model):
//   Win profit:       S(1 − p)(1 − f)
//   Loss:             S(1 − p)
//   Refund on loss:   Sp
//   Platform revenue: Sf(1 − p)
//
// Inverse Relationship:
//   qY − qN = b · ln(p / (1 − p))
//
// VARIABLES:
// ─────────────────────────────────────────────────────────────────────────────
//   qY : YES confidence pressure (dollars of downside risk)
//   qN : NO confidence pressure (dollars of downside risk)
//   b  : liquidity parameter (dollars of downside risk)
//   p  : market confidence/probability for YES (0-1)
//   S  : user stake (dollars)
//   f  : platform fee fraction (e.g., 0.01 = 1%)
//
// UNITS:
//   q and b are measured in dollars of downside risk
// ============================================================================

/**
 * LMSR Market Class
 * Implements the Logarithmic Market Scoring Rule for prediction markets
 * with risk-weighted investments and rebated losses
 */
class LMSRMarket {
  /**
   * Create a new LMSR market
   * @param {number} b - Liquidity parameter in dollars (higher = more stable prices)
   * @param {number} initialProbability - Starting probability (0-1), default 0.5
   */
  constructor(b = 100, initialProbability = 0.5) {
    this.b = b;
    
    // Initialize qY and qN using the inverse relationship:
    // qY − qN = b · ln(p / (1 − p))
    // We set qN = 0 and derive qY from desired probability
    if (initialProbability !== 0.5) {
      const clampedP = Math.max(0.01, Math.min(0.99, initialProbability));
      // qY = b · ln(p / (1 − p)) when qN = 0
      this.qY = this.b * Math.log(clampedP / (1 - clampedP));
      this.qN = 0;
    } else {
      // For p = 0.5: qY = qN = 0 (since ln(1) = 0)
      this.qY = 0;
      this.qN = 0;
    }
  }

  /**
   * Get current market probability for YES outcome
   * Formula: p = e^(qY/b) / (e^(qY/b) + e^(qN/b))
   * @returns {number} Probability between 0 and 1
   */
  getProbability() {
    const expQY = Math.exp(this.qY / this.b);
    const expQN = Math.exp(this.qN / this.b);
    return expQY / (expQY + expQN);
  }

  /**
   * Get probability as percentage (0-100)
   * @returns {number} Probability percentage
   */
  getProbabilityPercent() {
    return this.getProbability() * 100;
  }

  /**
   * Calculate the expected probability change for a given stake
   * Formula: ∆p ≈ (p(1 − p) / b) · S(1 − p)
   * @param {"YES" | "NO"} side - Side being traded
   * @param {number} stake - Amount to invest (S)
   * @returns {number} Approximate probability change
   */
  estimateProbabilityChange(side, stake) {
    const p = this.getProbability();
    const S = stake;
    
    // ∆p ≈ (p(1 − p) / b) · S(1 − p)
    const deltaP = (p * (1 - p) / this.b) * S * (1 - p);
    
    // YES trades increase p, NO trades decrease p
    return side === "YES" ? deltaP : -deltaP;
  }

  /**
   * Calculate the risk-weighted pressure update
   * Formula: ∆q = S(1 − p)
   * @param {number} stake - Amount to invest (S)
   * @returns {number} Pressure delta
   */
  calcDeltaQ(stake) {
    const p = this.getProbability();
    return stake * (1 - p);
  }

  /**
   * Place a risk-weighted investment on YES or NO
   * State Update:
   *   YES trade: qY ← qY + S(1 − p)
   *   NO trade:  qN ← qN + S(1 − p)
   * 
   * @param {"YES" | "NO"} side - Side to invest on
   * @param {number} stake - Amount to invest (S in dollars)
   * @returns {Object} Investment result with old/new probability and delta
   */
  invest(side, stake) {
    const oldP = this.getProbability();
    
    // Calculate risk-weighted pressure: ∆q = S(1 − p)
    const deltaQ = stake * (1 - oldP);

    // State Update
    if (side === "YES") {
      // qY ← qY + S(1 − p)
      this.qY += deltaQ;
    } else {
      // qN ← qN + S(1 − p)
      this.qN += deltaQ;
    }

    const newP = this.getProbability();
    
    // Clamp to prevent extreme values
    const clampedP = Math.max(0.01, Math.min(0.99, newP));

    return {
      oldProbability: oldP,
      newProbability: clampedP,
      deltaQ: deltaQ,
      deltaP: newP - oldP,
      side: side,
      stake: stake
    };
  }

  /**
   * Verify the inverse relationship: qY − qN = b · ln(p / (1 − p))
   * This should always hold true (useful for debugging)
   * @returns {Object} Verification result
   */
  verifyInverseRelationship() {
    const p = this.getProbability();
    const lhs = this.qY - this.qN;
    const rhs = this.b * Math.log(p / (1 - p));
    const difference = Math.abs(lhs - rhs);
    
    return {
      qY_minus_qN: lhs,
      b_times_ln: rhs,
      difference: difference,
      isValid: difference < 0.0001 // Account for floating point errors
    };
  }

  /**
   * Get complete market state for persistence or display
   * @returns {Object} Market state
   */
  getState() {
    const p = this.getProbability();
    return {
      qY: this.qY,
      qN: this.qN,
      b: this.b,
      probability: p,
      probabilityPercent: p * 100,
      // Verify inverse relationship
      inverseCheck: this.verifyInverseRelationship()
    };
  }

  /**
   * Restore market state from saved data
   * @param {Object} state - Previously saved state
   */
  setState(state) {
    if (state.qY !== undefined) this.qY = state.qY;
    if (state.qN !== undefined) this.qN = state.qN;
    if (state.b !== undefined) this.b = state.b;
  }

  /**
   * Reset market to a specific probability
   * Uses inverse relationship: qY − qN = b · ln(p / (1 − p))
   * @param {number} probability - Target probability (0-1)
   */
  resetToProbability(probability) {
    const clampedP = Math.max(0.01, Math.min(0.99, probability));
    this.qY = this.b * Math.log(clampedP / (1 - clampedP));
    this.qN = 0;
  }
}

// ============================================================================
// SETTLEMENT CALCULATIONS (Rebated-Risk Model)
// ============================================================================
//
// Win profit:       S(1 − p)(1 − f)  - Winner gets profit minus platform fee
// Loss:             S(1 − p)         - Amount at risk
// Refund on loss:   Sp               - Loser gets back stake × probability
// Platform revenue: Sf(1 − p)        - Platform fee on winning trades
// ============================================================================

const LMSR = {
  // Default platform fee (1%)
  PLATFORM_FEE: 0.01,

  /**
   * Calculate win profit
   * Formula: S(1 − p)(1 − f)
   * Winner gets profit proportional to risk taken, minus platform fee
   * 
   * @param {number} stake - Investment amount (S)
   * @param {number} probability - Probability at trade time (p), 0-1 or 0-100
   * @param {number} fee - Platform fee fraction (f), default 0.01
   * @returns {number} Profit amount in dollars
   */
  calcWinProfit(stake, probability, fee = this.PLATFORM_FEE) {
    const S = stake;
    const p = probability > 1 ? probability / 100 : probability;
    const f = fee;
    
    // Win profit = S(1 − p)(1 − f)
    return S * (1 - p) * (1 - f);
  },

  /**
   * Calculate total return on win
   * Formula: S + S(1 − p)(1 − f) = S[1 + (1 − p)(1 − f)]
   * 
   * @param {number} stake - Investment amount (S)
   * @param {number} probability - Probability (p), 0-1 or 0-100
   * @param {number} fee - Platform fee (f)
   * @returns {number} Total return in dollars
   */
  calcWinReturn(stake, probability, fee = this.PLATFORM_FEE) {
    return stake + this.calcWinProfit(stake, probability, fee);
  },

  /**
   * Calculate loss amount (amount at risk)
   * Formula: S(1 − p)
   * 
   * @param {number} stake - Investment amount (S)
   * @param {number} probability - Probability (p), 0-1 or 0-100
   * @returns {number} Loss amount in dollars
   */
  calcLossAmount(stake, probability) {
    const S = stake;
    const p = probability > 1 ? probability / 100 : probability;
    
    // Loss = S(1 − p)
    return S * (1 - p);
  },

  /**
   * Calculate refund on loss (rebate)
   * Formula: Sp
   * Loser gets back their stake proportional to probability
   * 
   * @param {number} stake - Investment amount (S)
   * @param {number} probability - Probability (p), 0-1 or 0-100
   * @returns {number} Refund amount in dollars
   */
  calcLoseReturn(stake, probability) {
    const S = stake;
    const p = probability > 1 ? probability / 100 : probability;
    
    // Refund on loss = Sp
    return S * p;
  },

  /**
   * Calculate platform revenue from a winning trade
   * Formula: Sf(1 − p)
   * Platform only collects fee when user wins
   * 
   * @param {number} stake - Investment amount (S)
   * @param {number} probability - Probability (p), 0-1 or 0-100
   * @param {number} fee - Platform fee fraction (f)
   * @returns {number} Platform revenue in dollars
   */
  calcPlatformRevenue(stake, probability, fee = this.PLATFORM_FEE) {
    const S = stake;
    const p = probability > 1 ? probability / 100 : probability;
    const f = fee;
    
    // Platform revenue = Sf(1 − p)
    return S * f * (1 - p);
  },

  /**
   * Full settlement calculation
   * Applies the rebated-risk model for trade resolution
   * 
   * @param {number} stake - Investment amount (S)
   * @param {number} probability - Probability at time of trade (p), 0-1 or 0-100
   * @param {boolean} didWin - Whether the trade won
   * @param {number} fee - Platform fee (f)
   * @returns {Object} Complete settlement result
   */
  settleTrade(stake, probability, didWin, fee = this.PLATFORM_FEE) {
    const S = stake;
    const p = probability > 1 ? probability / 100 : probability;
    const f = fee;

    // Calculate all values using formulas
    const winProfit = S * (1 - p) * (1 - f);      // S(1 − p)(1 − f)
    const platformRevenue = S * f * (1 - p);      // Sf(1 − p)
    const loss = S * (1 - p);                      // S(1 − p)
    const refund = S * p;                          // Sp

    if (didWin) {
      return {
        outcome: "WIN",
        stake: S,
        probability: p,
        profit: winProfit,
        totalReturn: S + winProfit,
        userNet: winProfit,
        platformRevenue: platformRevenue,
        formula: `Win profit = S(1-p)(1-f) = ${S}×${(1-p).toFixed(4)}×${(1-f).toFixed(4)} = ${winProfit.toFixed(2)}`
      };
    } else {
      return {
        outcome: "LOSE",
        stake: S,
        probability: p,
        loss: loss,
        refund: refund,
        totalReturn: refund,
        userNet: -loss,
        platformRevenue: 0, // Platform only earns on wins
        formula: `Refund = Sp = ${S}×${p.toFixed(4)} = ${refund.toFixed(2)}`
      };
    }
  },

  /**
   * Calculate risk/reward ratio
   * @param {number} stake - Investment amount (S)
   * @param {number} probability - Probability (p), 0-1 or 0-100
   * @param {number} fee - Platform fee (f)
   * @returns {string} Risk/reward ratio string
   */
  calcRiskReward(stake, probability, fee = this.PLATFORM_FEE) {
    const winProfit = this.calcWinProfit(stake, probability, fee);
    const lossAmount = this.calcLossAmount(stake, probability);
    
    if (winProfit <= 0) return "-";
    
    // Risk:Reward = Loss:Profit
    const ratio = lossAmount / winProfit;
    return `1:${ratio.toFixed(2)}`;
  },

  /**
   * Calculate implied odds from probability
   * @param {number} probability - Probability (0-1 or 0-100)
   * @returns {Object} Implied odds in various formats
   */
  calcImpliedOdds(probability) {
    const p = probability > 1 ? probability / 100 : probability;
    
    return {
      decimal: 1 / p,
      fractional: `${Math.round((1 - p) * 100)}/${Math.round(p * 100)}`,
      american: p >= 0.5 
        ? Math.round(-100 * p / (1 - p))
        : Math.round(100 * (1 - p) / p),
      percentage: p * 100
    };
  },

  /**
   * Get full trade breakdown for UI display
   * Shows all values with their formulas
   * 
   * @param {number} stake - Investment amount (S)
   * @param {number} probability - Probability (0-100)
   * @param {number} fee - Platform fee (f)
   * @returns {Object} Complete trade breakdown with formulas
   */
  getTradeBreakdown(stake, probability, fee = this.PLATFORM_FEE) {
    const S = stake;
    const p = probability > 1 ? probability / 100 : probability;
    const f = fee;
    
    const winProfit = S * (1 - p) * (1 - f);
    const winReturn = S + winProfit;
    const lossAmount = S * (1 - p);
    const loseReturn = S * p;
    const platformRevenue = S * f * (1 - p);

    return {
      // Input values
      stake: S,
      probability: p,
      probabilityPercent: p * 100,
      fee: f,
      feePercent: f * 100,
      
      // Win scenario
      win: {
        profit: winProfit,
        totalReturn: winReturn,
        returnPercent: S > 0 ? (winReturn / S) * 100 : 0,
        formula: `S(1-p)(1-f) = ${S}×(1-${p.toFixed(4)})×(1-${f}) = $${winProfit.toFixed(2)}`
      },
      
      // Lose scenario (with rebate)
      lose: {
        loss: lossAmount,
        refund: loseReturn,
        returnPercent: S > 0 ? (loseReturn / S) * 100 : 0,
        lossFormula: `S(1-p) = ${S}×(1-${p.toFixed(4)}) = $${lossAmount.toFixed(2)}`,
        refundFormula: `Sp = ${S}×${p.toFixed(4)} = $${loseReturn.toFixed(2)}`
      },
      
      // Platform
      platformRevenue: platformRevenue,
      platformFormula: `Sf(1-p) = ${S}×${f}×(1-${p.toFixed(4)}) = $${platformRevenue.toFixed(2)}`,
      
      // Risk metrics
      riskReward: this.calcRiskReward(S, p, f),
      impliedOdds: this.calcImpliedOdds(p)
    };
  }
};

// ============================================================================
// MARKET MANAGER
// Manages multiple LMSR markets
// ============================================================================

class LMSRMarketManager {
  constructor() {
    this.markets = new Map();
  }

  /**
   * Create or get a market
   * @param {string} marketId - Unique market identifier
   * @param {number} b - Liquidity parameter in dollars
   * @param {number} initialProbability - Starting probability (0-1)
   * @returns {LMSRMarket} Market instance
   */
  getOrCreateMarket(marketId, b = 100, initialProbability = 0.5) {
    if (!this.markets.has(marketId)) {
      this.markets.set(marketId, new LMSRMarket(b, initialProbability));
    }
    return this.markets.get(marketId);
  }

  /**
   * Get existing market
   * @param {string} marketId - Market identifier
   * @returns {LMSRMarket | undefined} Market instance or undefined
   */
  getMarket(marketId) {
    return this.markets.get(marketId);
  }

  /**
   * Place investment on a market
   * @param {string} marketId - Market identifier
   * @param {"YES" | "NO"} side - Side to invest on
   * @param {number} stake - Amount to invest in dollars
   * @returns {Object} Investment result with probability changes and breakdown
   */
  invest(marketId, side, stake) {
    const market = this.markets.get(marketId);
    if (!market) {
      throw new Error(`Market ${marketId} not found`);
    }

    const oldProbability = market.getProbability();
    const estimatedDeltaP = market.estimateProbabilityChange(side, stake);
    const result = market.invest(side, stake);

    return {
      marketId,
      side,
      stake,
      oldProbability,
      newProbability: result.newProbability,
      deltaQ: result.deltaQ,
      actualDeltaP: result.deltaP,
      estimatedDeltaP: estimatedDeltaP,
      breakdown: LMSR.getTradeBreakdown(stake, oldProbability),
      marketState: market.getState()
    };
  }

  /**
   * Get all market states
   * @returns {Object} Map of market states
   */
  getAllStates() {
    const states = {};
    for (const [id, market] of this.markets) {
      states[id] = market.getState();
    }
    return states;
  }

  /**
   * Restore all market states
   * @param {Object} states - Previously saved states
   */
  restoreStates(states) {
    for (const [id, state] of Object.entries(states)) {
      const market = new LMSRMarket(state.b);
      market.setState(state);
      this.markets.set(id, market);
    }
  }
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

// Create global market manager instance
const lmsrManager = new LMSRMarketManager();

// Export to window for global access
window.LMSRMarket = LMSRMarket;
window.LMSR = LMSR;
window.lmsrManager = lmsrManager;
window.LMSRMarketManager = LMSRMarketManager;

// Log initialization with formula summary
console.log('LMSR Engine initialized with formulas:');
console.log('  Pricing: p = e^(qY/b) / (e^(qY/b) + e^(qN/b))');
console.log('  Pressure: ∆q = S(1-p)');
console.log('  Win: S(1-p)(1-f), Lose refund: Sp');
