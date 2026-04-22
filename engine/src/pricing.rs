// ============================================================================
// SAMSA ENGINE — PRICING (LMSR)
// Logarithmic Market Scoring Rule with Risk-Weighted Pressure Updates
// ============================================================================
//
// Formulas:
//   Probability:      p = e^(qY/b) / (e^(qY/b) + e^(qN/b))
//   Pressure update:  Δq = S × (1 − p)
//   YES trade:        qY ← qY + Δq
//   NO trade:         qN ← qN + Δq
//   ΔP approx:        Δp ≈ p(1−p)/b × S(1−p)
//   Inverse check:    qY − qN = b × ln(p / (1−p))
// ============================================================================

use serde::{Deserialize, Serialize};

/// LMSR market state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LmsrMarket {
    /// YES confidence pressure (dollars of downside risk)
    pub q_yes: f64,
    /// NO confidence pressure (dollars of downside risk)
    pub q_no: f64,
    /// Liquidity parameter (higher = more price-stable market)
    pub b: f64,
}

/// Result of placing an investment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvestResult {
    pub old_probability: f64,
    pub new_probability: f64,
    pub delta_q: f64,
    pub delta_p: f64,
    pub side: String,
    pub stake: f64,
}

/// Result of verifying the inverse relationship
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InverseCheck {
    pub q_yes_minus_q_no: f64,
    pub b_times_ln: f64,
    pub difference: f64,
    pub is_valid: bool,
}

impl LmsrMarket {
    /// Create a new LMSR market with an optional initial probability
    pub fn new(b: f64, initial_probability: f64) -> Self {
        let q_yes;
        let q_no = 0.0;

        if (initial_probability - 0.5).abs() > f64::EPSILON {
            // Clamp to avoid ln(0) or ln(∞)
            let p = initial_probability.clamp(0.01, 0.99);
            // Inverse relationship: qY = b × ln(p / (1−p)) when qN = 0
            q_yes = b * (p / (1.0 - p)).ln();
        } else {
            // p = 0.5 → qY = qN = 0 (symmetric)
            q_yes = 0.0;
        }

        LmsrMarket { q_yes, q_no, b }
    }

    /// p = e^(qY/b) / (e^(qY/b) + e^(qN/b))
    pub fn probability(&self) -> f64 {
        let exp_y = (self.q_yes / self.b).exp();
        let exp_n = (self.q_no / self.b).exp();
        exp_y / (exp_y + exp_n)
    }

    /// Probability as a percentage (0–100)
    pub fn probability_percent(&self) -> f64 {
        self.probability() * 100.0
    }

    /// Approximate ΔP for a given stake on a given side:
    ///   Δp ≈ p(1−p)/b × S(1−p)
    pub fn estimate_delta_p(&self, side: &str, stake: f64) -> f64 {
        let p = self.probability();
        let delta = (p * (1.0 - p) / self.b) * stake * (1.0 - p);
        if side.eq_ignore_ascii_case("YES") {
            delta
        } else {
            -delta
        }
    }

    /// Place a risk-weighted investment on YES or NO.
    ///
    /// YES: qY ← qY + S(1−p)
    /// NO:  qN ← qN + S(1−p)
    pub fn invest(&mut self, side: &str, stake: f64) -> InvestResult {
        let old_p = self.probability();
        // Δq = S × (1 − p)
        let delta_q = stake * (1.0 - old_p);

        if side.eq_ignore_ascii_case("YES") {
            self.q_yes += delta_q;
        } else {
            self.q_no += delta_q;
        }

        let new_p = self.probability().clamp(0.01, 0.99);

        InvestResult {
            old_probability: old_p,
            new_probability: new_p,
            delta_q,
            delta_p: new_p - old_p,
            side: side.to_uppercase(),
            stake,
        }
    }

    /// Verify the inverse relationship: qY − qN = b × ln(p / (1−p))
    pub fn verify_inverse(&self) -> InverseCheck {
        let p = self.probability();
        let lhs = self.q_yes - self.q_no;
        let rhs = self.b * (p / (1.0 - p)).ln();
        let diff = (lhs - rhs).abs();
        InverseCheck {
            q_yes_minus_q_no: lhs,
            b_times_ln: rhs,
            difference: diff,
            is_valid: diff < 1e-9,
        }
    }

    /// Reset market to a target probability using the inverse relationship
    pub fn reset_to_probability(&mut self, probability: f64) {
        let p = probability.clamp(0.01, 0.99);
        self.q_yes = self.b * (p / (1.0 - p)).ln();
        self.q_no = 0.0;
    }

    /// Serialize current state
    pub fn state(&self) -> serde_json::Value {
        let p = self.probability();
        serde_json::json!({
            "q_yes": self.q_yes,
            "q_no": self.q_no,
            "b": self.b,
            "probability": p,
            "probability_percent": p * 100.0,
            "inverse_check": self.verify_inverse()
        })
    }
}

// ============================================================================
// UNIT TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    /// Tolerance for floating-point comparisons
    const EPS: f64 = 1e-9;

    #[test]
    fn test_default_probability_is_half() {
        let m = LmsrMarket::new(100.0, 0.5);
        let p = m.probability();
        assert!((p - 0.5).abs() < EPS, "Expected p=0.5, got {p}");
    }

    #[test]
    fn test_initial_probability_twenty_percent() {
        let m = LmsrMarket::new(100.0, 0.2);
        let p = m.probability();
        assert!((p - 0.2).abs() < 1e-10, "Expected p≈0.2, got {p}");
    }

    #[test]
    fn test_invest_yes_increases_probability() {
        let mut m = LmsrMarket::new(100.0, 0.5);
        let r = m.invest("YES", 100.0);
        assert!(r.new_probability > r.old_probability, "YES should increase p");
    }

    #[test]
    fn test_invest_no_decreases_probability() {
        let mut m = LmsrMarket::new(100.0, 0.5);
        let r = m.invest("NO", 100.0);
        assert!(r.new_probability < r.old_probability, "NO should decrease p");
    }

    #[test]
    fn test_inverse_relationship_holds() {
        let mut m = LmsrMarket::new(100.0, 0.3);
        m.invest("YES", 50.0);
        m.invest("NO", 30.0);
        let check = m.verify_inverse();
        assert!(check.is_valid, "Inverse relationship must hold, diff={}", check.difference);
    }

    #[test]
    fn test_reset_to_probability() {
        let mut m = LmsrMarket::new(100.0, 0.5);
        m.invest("YES", 200.0);
        m.reset_to_probability(0.7);
        let p = m.probability();
        assert!((p - 0.7).abs() < 1e-10, "After reset, expected p≈0.7, got {p}");
    }
}
