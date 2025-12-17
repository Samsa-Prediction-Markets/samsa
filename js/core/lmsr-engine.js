// ============================================================================
// SAMSA - LMSR ENGINE
// Logarithmic Market Scoring Rule with Risk-Weighted Rebate Model
// ============================================================================

/**
 * LMSR Market Class
 * Implements the Logarithmic Market Scoring Rule for prediction markets
 * with risk-weighted investments and rebated losses
 */
class LMSRMarket {
  /**
   * @param {number} b - Liquidity parameter (higher = more stable prices)
   * @param {number} initialProbability - Starting probability (0-1)
   */
  constructor(b = 100, initialProbability = 0.5) {
    this.b = b;
    // Initialize qYes and qNo to achieve desired initial probability
    // p = e^(qYes/b) / (e^(qYes/b) + e^(qNo/b))
    // For equal odds: qYes = qNo = 0 gives p = 0.5
    // To set custom initial probability, we adjust qYes
    if (initialProbability !== 0.5) {
      // Derive qYes from desired probability (with qNo = 0)
      // p = e^(qYes/b) / (e^(qYes/b) + 1)
      // Solving: qYes = b * ln(p / (1 - p))
      const clampedP = Math.max(0.01, Math.min(0.99, initialProbability));
      this.qYes = b * Math.log(clampedP / (1 - clampedP));
      this.qNo = 0;
    } else {
      this.qYes = 0;
      this.qNo = 0;
    }
  }

  /**
   * Get current market probability for YES outcome
   * @returns {number} Probability between 0 and 1
   */
  getProbability() {
    const eYes = Math.exp(this.qYes / this.b);
    const eNo = Math.exp(this.qNo / this.b);
    return eYes / (eYes + eNo);
  }

  /**
   * Get probability as percentage (0-100)
   * @returns {number} Probability percentage
   */
  getProbabilityPercent() {
    return this.getProbability() * 100;
  }

  /**
   * Risk-weighted investment on YES or NO
   * Investment pressure is weighted by downside risk (1 - p)
   * @param {"YES" | "NO"} side - Side to invest on
   * @param {number} stake - Amount to invest
   * @returns {number} New probability after investment (clamped 0.05-0.95)
   */
  invest(side, stake) {
    const p = this.getProbability();
    // Risk-weighted pressure based on downside risk
    const deltaQ = stake * (1 - p);

    if (side === "YES") {
      this.qYes += deltaQ;
    } else {
      this.qNo += deltaQ;
    }

    // Return clamped probability
    const newP = this.getProbability();
    return Math.max(0.05, Math.min(0.95, newP));
  }

  /**
   * Get market state for persistence
   * @returns {Object} Market state
   */
  getState() {
    return {
      qYes: this.qYes,
      qNo: this.qNo,
      b: this.b,
      probability: this.getProbability()
    };
  }

  /**
   * Restore market state
   * @param {Object} state - Previously saved state
   */
  setState(state) {
    if (state.qYes !== undefined) this.qYes = state.qYes;
    if (state.qNo !== undefined) this.qNo = state.qNo;
    if (state.b !== undefined) this.b = state.b;
  }
}

// ============================================================================
// SETTLEMENT CALCULATIONS
// These use the rebated-risk model where losers get back stake * probability
// ============================================================================

const LMSR = {
  // Default platform fee (1%)
  PLATFORM_FEE: 0.01,

  /**
   * Calculate win profit: S × (1-p) × (1-f)
   * Winner gets profit proportional to risk taken, minus platform fee
   * @param {number} stake - Investment amount
   * @param {number} probability - Probability (0-1 or 0-100)
   * @param {number} fee - Platform fee (default 1%)
   * @returns {number} Profit amount
   */
  calcWinProfit(stake, probability, fee = this.PLATFORM_FEE) {
    const p = probability > 1 ? probability / 100 : probability;
    return stake * (1 - p) * (1 - fee);
  },

  /**
   * Calculate total return on win: stake + profit
   * @param {number} stake - Investment amount
   * @param {number} probability - Probability (0-1 or 0-100)
   * @param {number} fee - Platform fee
   * @returns {number} Total return
   */
  calcWinReturn(stake, probability, fee = this.PLATFORM_FEE) {
    return stake + this.calcWinProfit(stake, probability, fee);
  },

  /**
   * Calculate loss amount: S × (1-p)
   * Amount lost is proportional to risk
   * @param {number} stake - Investment amount
   * @param {number} probability - Probability (0-1 or 0-100)
   * @returns {number} Loss amount
   */
  calcLossAmount(stake, probability) {
    const p = probability > 1 ? probability / 100 : probability;
    return stake * (1 - p);
  },

  /**
   * Calculate refund on loss: S × p
   * Loser gets back their stake proportional to probability (rebate)
   * @param {number} stake - Investment amount
   * @param {number} probability - Probability (0-1 or 0-100)
   * @returns {number} Refund amount
   */
  calcLoseReturn(stake, probability) {
    const p = probability > 1 ? probability / 100 : probability;
    return stake * p;
  },

  /**
   * Calculate platform revenue from a trade
   * Revenue = S × (1-p) × f (only collected on wins)
   * @param {number} stake - Investment amount
   * @param {number} probability - Probability (0-1 or 0-100)
   * @param {number} fee - Platform fee
   * @returns {number} Platform revenue
   */
  calcPlatformRevenue(stake, probability, fee = this.PLATFORM_FEE) {
    const p = probability > 1 ? probability / 100 : probability;
    return stake * (1 - p) * fee;
  },

  /**
   * Full settlement calculation
   * @param {number} stake - Investment amount
   * @param {number} probability - Probability at time of trade (0-1 or 0-100)
   * @param {boolean} didWin - Whether the trade won
   * @param {number} fee - Platform fee
   * @returns {Object} Settlement result
   */
  settleTrade(stake, probability, didWin, fee = this.PLATFORM_FEE) {
    const p = probability > 1 ? probability / 100 : probability;
    const S = stake;
    const f = fee;

    const profit = S * (1 - p) * (1 - f);
    const platformRevenue = S * (1 - p) * f;
    const loss = S * (1 - p);
    const refund = S * p;

    if (didWin) {
      return {
        outcome: "WIN",
        userNet: profit,
        totalReturn: S + profit,
        platformRevenue
      };
    } else {
      return {
        outcome: "LOSE",
        userNet: -loss,
        refund: refund,
        totalReturn: refund,
        platformRevenue: 0 // Platform only earns on wins
      };
    }
  },

  /**
   * Calculate risk/reward ratio
   * @param {number} stake - Investment amount
   * @param {number} probability - Probability (0-1 or 0-100)
   * @param {number} fee - Platform fee
   * @returns {string} Risk/reward ratio string
   */
  calcRiskReward(stake, probability, fee = this.PLATFORM_FEE) {
    const winProfit = this.calcWinProfit(stake, probability, fee);
    const lossAmount = this.calcLossAmount(stake, probability);
    if (winProfit <= 0) return "-";
    return `1:${(lossAmount / winProfit).toFixed(2)}`;
  },

  /**
   * Get full trade breakdown for UI display
   * @param {number} stake - Investment amount
   * @param {number} probability - Probability (0-100)
   * @param {number} fee - Platform fee
   * @returns {Object} Complete trade breakdown
   */
  getTradeBreakdown(stake, probability, fee = this.PLATFORM_FEE) {
    const p = probability > 1 ? probability / 100 : probability;
    
    const winProfit = this.calcWinProfit(stake, p, fee);
    const winReturn = this.calcWinReturn(stake, p, fee);
    const lossAmount = this.calcLossAmount(stake, p);
    const loseReturn = this.calcLoseReturn(stake, p);
    const platformRevenue = this.calcPlatformRevenue(stake, p, fee);

    return {
      stake,
      probability: p,
      probabilityPercent: p * 100,
      fee,
      win: {
        profit: winProfit,
        totalReturn: winReturn,
        returnPercent: stake > 0 ? (winReturn / stake) * 100 : 0
      },
      lose: {
        loss: lossAmount,
        refund: loseReturn,
        returnPercent: stake > 0 ? (loseReturn / stake) * 100 : 0
      },
      riskReward: this.calcRiskReward(stake, p, fee),
      platformRevenue
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
   * @param {number} b - Liquidity parameter
   * @param {number} initialProbability - Starting probability
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
   * @param {number} stake - Amount to invest
   * @returns {Object} Investment result with new probability
   */
  invest(marketId, side, stake) {
    const market = this.markets.get(marketId);
    if (!market) {
      throw new Error(`Market ${marketId} not found`);
    }

    const oldProbability = market.getProbability();
    const newProbability = market.invest(side, stake);

    return {
      marketId,
      side,
      stake,
      oldProbability,
      newProbability,
      probabilityChange: newProbability - oldProbability,
      breakdown: LMSR.getTradeBreakdown(stake, oldProbability)
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

// Log initialization
console.log('LMSR Engine initialized');

