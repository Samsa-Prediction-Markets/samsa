// ============================================================================
// SAMSA ENGINE — Library root
// ============================================================================
// Exports the pricing (LMSR) and payout (rebated-risk) modules.
// This crate is the canonical implementation of Samsa's market math.
// Python (lib/lmsr.py) is for simulation/research only.
// ============================================================================

pub mod pricing;
pub mod payout;

// Re-export the most commonly used types for convenience
pub use pricing::{LmsrMarket, InvestResult};
pub use payout::{
    TradeInput, PayoutResult, ResolutionResult, TradeBreakdown,
    settle_trade, resolve_market, trade_breakdown, PLATFORM_FEE,
};
