"""
SAMSA - LMSR Engine (Python)
Logarithmic Market Scoring Rule with Risk-Weighted Rebate Model
"""

import math
from typing import Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class TradeBreakdown:
    """Complete breakdown of a trade's potential outcomes"""
    stake: float
    probability: float
    probability_percent: float
    fee: float
    win_profit: float
    win_return: float
    win_return_percent: float
    lose_loss: float
    lose_refund: float
    lose_return_percent: float
    platform_revenue: float
    risk_reward: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'stake': self.stake,
            'probability': self.probability,
            'probability_percent': self.probability_percent,
            'fee': self.fee,
            'win': {
                'profit': round(self.win_profit, 2),
                'total_return': round(self.win_return, 2),
                'return_percent': round(self.win_return_percent, 2)
            },
            'lose': {
                'loss': round(self.lose_loss, 2),
                'refund': round(self.lose_refund, 2),
                'return_percent': round(self.lose_return_percent, 2)
            },
            'risk_reward': self.risk_reward,
            'platform_revenue': round(self.platform_revenue, 2)
        }


@dataclass
class SettlementResult:
    """Result of settling a trade"""
    outcome: str  # "WIN" or "LOSE"
    user_net: float
    total_return: float
    platform_revenue: float
    refund: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        result = {
            'outcome': self.outcome,
            'user_net': round(self.user_net, 2),
            'total_return': round(self.total_return, 2),
            'platform_revenue': round(self.platform_revenue, 2)
        }
        if self.refund is not None:
            result['refund'] = round(self.refund, 2)
        return result


class LMSRMarket:
    """
    LMSR Market Class
    Implements the Logarithmic Market Scoring Rule for prediction markets
    with risk-weighted investments and rebated losses
    """
    
    PLATFORM_FEE = 0.01  # 1% platform fee
    
    def __init__(self, b: float = 100, initial_probability: float = 0.5):
        """
        Initialize an LMSR market
        
        Args:
            b: Liquidity parameter (higher = more stable prices)
            initial_probability: Starting probability (0-1)
        """
        self.b = b
        self.q_yes = 0.0
        self.q_no = 0.0
        
        # Set initial probability if not 0.5
        if initial_probability != 0.5:
            clamped_p = max(0.01, min(0.99, initial_probability))
            # Derive qYes from desired probability (with qNo = 0)
            # p = e^(qYes/b) / (e^(qYes/b) + 1)
            # Solving: qYes = b * ln(p / (1 - p))
            self.q_yes = b * math.log(clamped_p / (1 - clamped_p))
    
    def get_probability(self) -> float:
        """
        Get current market probability for YES outcome
        
        Returns:
            Probability between 0 and 1
        """
        e_yes = math.exp(self.q_yes / self.b)
        e_no = math.exp(self.q_no / self.b)
        return e_yes / (e_yes + e_no)
    
    def get_probability_percent(self) -> float:
        """Get probability as percentage (0-100)"""
        return self.get_probability() * 100
    
    def invest(self, side: str, stake: float) -> float:
        """
        Risk-weighted investment on YES or NO
        
        Args:
            side: "YES" or "NO"
            stake: Amount to invest
            
        Returns:
            New probability after investment (clamped 0.05-0.95)
        """
        p = self.get_probability()
        # Risk-weighted pressure based on downside risk
        delta_q = stake * (1 - p)
        
        if side.upper() == "YES":
            self.q_yes += delta_q
        else:
            self.q_no += delta_q
        
        # Return clamped probability
        new_p = self.get_probability()
        return max(0.05, min(0.95, new_p))
    
    def get_state(self) -> Dict[str, Any]:
        """Get market state for persistence"""
        return {
            'q_yes': self.q_yes,
            'q_no': self.q_no,
            'b': self.b,
            'probability': self.get_probability()
        }
    
    def set_state(self, state: Dict[str, Any]) -> None:
        """Restore market state"""
        if 'q_yes' in state:
            self.q_yes = state['q_yes']
        if 'q_no' in state:
            self.q_no = state['q_no']
        if 'b' in state:
            self.b = state['b']


class LMSR:
    """Static utility class for LMSR calculations"""
    
    PLATFORM_FEE = 0.01
    
    @staticmethod
    def normalize_probability(probability: float) -> float:
        """Convert probability to 0-1 range if needed"""
        return probability / 100 if probability > 1 else probability
    
    @staticmethod
    def calc_win_profit(stake: float, probability: float, fee: float = 0.01) -> float:
        """
        Calculate win profit: S × (1-p) × (1-f)
        Winner gets profit proportional to risk taken, minus platform fee
        """
        p = LMSR.normalize_probability(probability)
        return stake * (1 - p) * (1 - fee)
    
    @staticmethod
    def calc_win_return(stake: float, probability: float, fee: float = 0.01) -> float:
        """Calculate total return on win: stake + profit"""
        return stake + LMSR.calc_win_profit(stake, probability, fee)
    
    @staticmethod
    def calc_loss_amount(stake: float, probability: float) -> float:
        """Calculate loss amount: S × (1-p)"""
        p = LMSR.normalize_probability(probability)
        return stake * (1 - p)
    
    @staticmethod
    def calc_lose_return(stake: float, probability: float) -> float:
        """Calculate refund on loss: S × p (the rebate)"""
        p = LMSR.normalize_probability(probability)
        return stake * p
    
    @staticmethod
    def calc_platform_revenue(stake: float, probability: float, fee: float = 0.01) -> float:
        """Calculate platform revenue: S × (1-p) × f (only on wins)"""
        p = LMSR.normalize_probability(probability)
        return stake * (1 - p) * fee
    
    @staticmethod
    def calc_risk_reward(stake: float, probability: float, fee: float = 0.01) -> str:
        """Calculate risk/reward ratio string"""
        win_profit = LMSR.calc_win_profit(stake, probability, fee)
        loss_amount = LMSR.calc_loss_amount(stake, probability)
        if win_profit <= 0:
            return "-"
        return f"1:{loss_amount / win_profit:.2f}"
    
    @staticmethod
    def settle_trade(stake: float, probability: float, did_win: bool, fee: float = 0.01) -> SettlementResult:
        """
        Full settlement calculation
        
        Args:
            stake: Investment amount
            probability: Probability at time of trade (0-1 or 0-100)
            did_win: Whether the trade won
            fee: Platform fee
            
        Returns:
            SettlementResult with all settlement details
        """
        p = LMSR.normalize_probability(probability)
        
        profit = stake * (1 - p) * (1 - fee)
        platform_revenue = stake * (1 - p) * fee
        loss = stake * (1 - p)
        refund = stake * p
        
        if did_win:
            return SettlementResult(
                outcome="WIN",
                user_net=profit,
                total_return=stake + profit,
                platform_revenue=platform_revenue
            )
        else:
            return SettlementResult(
                outcome="LOSE",
                user_net=-loss,
                total_return=refund,
                platform_revenue=0,
                refund=refund
            )
    
    @staticmethod
    def get_trade_breakdown(stake: float, probability: float, fee: float = 0.01) -> TradeBreakdown:
        """
        Get full trade breakdown for UI display
        
        Args:
            stake: Investment amount
            probability: Probability (0-100 or 0-1)
            fee: Platform fee
            
        Returns:
            TradeBreakdown with all calculated values
        """
        p = LMSR.normalize_probability(probability)
        
        win_profit = LMSR.calc_win_profit(stake, p, fee)
        win_return = LMSR.calc_win_return(stake, p, fee)
        loss_amount = LMSR.calc_loss_amount(stake, p)
        lose_return = LMSR.calc_lose_return(stake, p)
        platform_revenue = LMSR.calc_platform_revenue(stake, p, fee)
        
        return TradeBreakdown(
            stake=stake,
            probability=p,
            probability_percent=p * 100,
            fee=fee,
            win_profit=win_profit,
            win_return=win_return,
            win_return_percent=(win_return / stake) * 100 if stake > 0 else 0,
            lose_loss=loss_amount,
            lose_refund=lose_return,
            lose_return_percent=(lose_return / stake) * 100 if stake > 0 else 0,
            platform_revenue=platform_revenue,
            risk_reward=LMSR.calc_risk_reward(stake, p, fee)
        )


class LMSRMarketManager:
    """Manages multiple LMSR markets"""
    
    def __init__(self):
        self.markets: Dict[str, LMSRMarket] = {}
    
    def get_or_create_market(self, market_id: str, b: float = 100, initial_probability: float = 0.5) -> LMSRMarket:
        """Get or create a market"""
        if market_id not in self.markets:
            self.markets[market_id] = LMSRMarket(b, initial_probability)
        return self.markets[market_id]
    
    def get_market(self, market_id: str) -> Optional[LMSRMarket]:
        """Get existing market"""
        return self.markets.get(market_id)
    
    def invest(self, market_id: str, side: str, stake: float) -> Dict[str, Any]:
        """
        Place investment on a market
        
        Returns:
            Investment result with new probability
        """
        market = self.markets.get(market_id)
        if not market:
            raise ValueError(f"Market {market_id} not found")
        
        old_probability = market.get_probability()
        new_probability = market.invest(side, stake)
        breakdown = LMSR.get_trade_breakdown(stake, old_probability)
        
        return {
            'market_id': market_id,
            'side': side,
            'stake': stake,
            'old_probability': old_probability,
            'new_probability': new_probability,
            'probability_change': new_probability - old_probability,
            'breakdown': breakdown.to_dict()
        }
    
    def get_all_states(self) -> Dict[str, Dict[str, Any]]:
        """Get all market states"""
        return {market_id: market.get_state() for market_id, market in self.markets.items()}
    
    def restore_states(self, states: Dict[str, Dict[str, Any]]) -> None:
        """Restore all market states"""
        for market_id, state in states.items():
            market = LMSRMarket(state.get('b', 100))
            market.set_state(state)
            self.markets[market_id] = market


# Global market manager instance
market_manager = LMSRMarketManager()

