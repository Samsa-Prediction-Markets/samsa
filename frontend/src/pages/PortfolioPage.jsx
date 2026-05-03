import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { api } from '../api/client';
import { useMarkets } from '../hooks/useMarkets';

function PortfolioChart({ balanceHistory, hasStartedTrading, startingBalance }) {
  const width = 800;
  const height = 200;
  const padding = 8;

  if (!hasStartedTrading) {
    // Show flat line at starting balance when no trades
    const flatY = height / 2;
    return (
      <div className="relative w-full h-64">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#334155" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.2" />
          <line x1="0" y1={flatY} x2={width} y2={flatY} stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#334155" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <p className="text-slate-500 text-lg mb-2">No positions yet</p>
          <p className="text-slate-600 text-sm">Make your first forecast to start tracking performance</p>
        </div>
      </div>
    );
  }

  // Calculate balance values
  const minValue = Math.min(...balanceHistory);
  const maxValue = Math.max(...balanceHistory);
  const rangePadding = Math.max((maxValue - minValue) * 0.15, 1000);
  const chartMin = minValue - rangePadding;
  const chartMax = maxValue + rangePadding;
  const range = chartMax - chartMin;

  const getY = (value) => padding + (1 - (value - chartMin) / range) * (height - 2 * padding);
  const startingY = getY(startingBalance);

  const points = balanceHistory.map((value, i) => ({
    x: padding + (i / (balanceHistory.length - 1)) * (width - 2 * padding),
    y: getY(value),
    value
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const currentBalance = balanceHistory[balanceHistory.length - 1];
  const balanceChange = currentBalance - startingBalance;
  const isProfit = balanceChange >= 0;
  const lineColor = isProfit ? '#22c55e' : '#ef4444';
  const areaPath = `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;
  const changeText = balanceChange >= 0 ? `+$${balanceChange.toFixed(2)}` : `-$${Math.abs(balanceChange).toFixed(2)}`;

  return (
    <div className="relative w-full h-64">
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="portfolioGradientProfit" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#22c55e', stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 0.3 }} />
          </linearGradient>
          <linearGradient id="portfolioGradientLoss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 0.3 }} />
          </linearGradient>
        </defs>
        <line x1="0" y1={startingY} x2={width} y2={startingY} stroke="#64748b" strokeWidth="1" strokeDasharray="8,4" opacity="0.5" />
        <path d={areaPath} fill={isProfit ? 'url(#portfolioGradientProfit)' : 'url(#portfolioGradientLoss)'} />
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="5" fill={lineColor} />
      </svg>
      <div className={`absolute top-2 right-2 px-3 py-1 rounded-lg ${isProfit ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
        <span className="text-sm font-bold" style={{ color: lineColor }}>{changeText}</span>
        <span className="text-xs text-slate-400 ml-1">Change</span>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { session } = useAuth();
  const { balance } = useWallet();
  const { markets } = useMarkets();
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('1D');
  const [activeTab, setActiveTab] = useState('active');
  const [sellingPosition, setSellingPosition] = useState(null); // key of position being sold
  const [sellAmount, setSellAmount] = useState('');
  const [sellLoading, setSellLoading] = useState(false);
  const [sellMsg, setSellMsg] = useState('');

  useEffect(() => {
    api.getPredictions()
      .then(data => {
        const allPredictions = Array.isArray(data) ? data : [];
        const userId = session?.user?.id || 'demo_user';
        const userPredictions = allPredictions.filter(p => p.user_id === userId);
        setPredictions(userPredictions);
      })
      .catch(err => {
        console.error('Error fetching predictions:', err);
        setPredictions([]);
      })
      .finally(() => setLoading(false));
  }, [session]);

  const activePredictions = predictions.filter(p => p.status === 'active');
  const wonPredictions = predictions.filter(p => p.status === 'won');
  const lostPredictions = predictions.filter(p => p.status === 'lost');
  const settledPredictions = [...wonPredictions, ...lostPredictions];

  const startingBalance = 100000; // Paper trading starting balance
  const activePredictionsValue = activePredictions.reduce((sum, p) => sum + (p.stake_amount || 0), 0);
  const totalReturned = predictions.reduce((sum, p) => sum + (p.actual_return || 0), 0);
  const settledStake = settledPredictions.reduce((sum, p) => sum + (p.stake_amount || 0), 0);
  const netProfitLoss = totalReturned - settledStake;
  const portfolioValue = balance + activePredictionsValue;
  const hasStartedTrading = predictions.length > 0;

  // Generate balance history over time (Robinhood-style)
  const balanceHistory = Array.from({ length: 30 }, (_, i) => {
    const progress = i / 29;
    const currentBalance = startingBalance + (netProfitLoss * progress);
    // Add small random fluctuations for realism
    const fluctuation = (Math.random() - 0.5) * Math.abs(netProfitLoss) * 0.05;
    return currentBalance + fluctuation;
  });
  balanceHistory[29] = portfolioValue; // Set final value to actual current portfolio value

  const totalSettled = wonPredictions.length + lostPredictions.length;
  const accuracyScore = totalSettled > 0 ? Math.round((wonPredictions.length / totalSettled) * 100) : 0;

  // Aggregate predictions by (market_id, outcome_id) to show cumulative positions
  const aggregatePredictions = (preds) => {
    const grouped = {};
    preds.forEach(p => {
      const key = `${p.market_id}__${p.outcome_id}`;
      if (!grouped[key]) {
        grouped[key] = {
          ...p,
          stake_amount: 0,
          potential_return: 0,
          actual_return: 0,
          _tradeCount: 0,
          _weightedOddsSum: 0,
        };
      }
      const stake = p.stake_amount || 0;
      grouped[key].stake_amount += stake;
      grouped[key].potential_return += p.potential_return || 0;
      grouped[key].actual_return += p.actual_return || 0;
      grouped[key]._tradeCount += 1;
      grouped[key]._weightedOddsSum += (p.odds_at_prediction || 0) * stake;
    });
    return Object.values(grouped).map(g => ({
      ...g,
      // Weighted average entry probability across all trades on this outcome
      odds_at_prediction: g.stake_amount > 0
        ? parseFloat((g._weightedOddsSum / g.stake_amount).toFixed(2))
        : g.odds_at_prediction,
    }));
  };

  const aggregatedActive = aggregatePredictions(activePredictions);
  const aggregatedWon = aggregatePredictions(wonPredictions);
  const aggregatedLost = aggregatePredictions(lostPredictions);

  const filteredPositions = activeTab === 'active' ? aggregatedActive : activeTab === 'won' ? aggregatedWon : aggregatedLost;

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="mb-2">
            <button className="flex items-center gap-2 text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg transition-colors -ml-3">
              <span className="text-2xl font-semibold">Portfolio</span>
              <span className="text-slate-400">▾</span>
            </button>
          </div>

          <div className="mb-1">
            <h1 className="text-5xl font-bold text-white">${portfolioValue.toFixed(2)}</h1>
          </div>
          <div className="flex items-center gap-2 mb-8">
            <span className={`font-medium ${netProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${Math.abs(netProfitLoss).toFixed(2)} ({netProfitLoss >= 0 ? '+' : '-'}{totalSettled > 0 ? ((Math.abs(netProfitLoss) / settledStake) * 100).toFixed(2) : '0.00'}%)
            </span>
            <span className="text-slate-400">All Time</span>
          </div>

          <div className="mb-6">
            <PortfolioChart balanceHistory={balanceHistory} hasStartedTrading={hasStartedTrading} startingBalance={startingBalance} />
          </div>

          <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
            <div className="flex gap-1">
              {['1D', '1W', '1M', '3M', 'YTD', '1Y', 'ALL'].map(range => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${selectedRange === range ? 'text-green-400 border-b-2 border-green-400' : 'text-slate-400 hover:text-white'}`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span style={{ color: 'rgb(212, 175, 55)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                  </svg>
                </span>
                <span className="text-white font-medium">Available Cash</span>
              </div>
              <span className="text-2xl font-bold text-yellow-400">${balance.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span style={{ color: 'rgb(212, 175, 55)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </span>
              <span className="text-white font-medium">Your Forecasting Stats</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">{predictions.length}</p>
                <p className="text-slate-500 text-xs">Predictions</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{accuracyScore}%</p>
                <p className="text-slate-500 text-xs">Accuracy</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">0%</p>
                <p className="text-slate-500 text-xs">Calibration</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Positions</h2>
              <div className="flex gap-1">
                {[
                  { key: 'active', label: `Active (${aggregatedActive.length})` },
                  { key: 'won', label: `Correct (${aggregatedWon.length})` },
                  { key: 'lost', label: `Incorrect (${aggregatedLost.length})` }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${activeTab === tab.key ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'text-slate-400 hover:bg-slate-800/50'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-slate-500 text-sm text-center py-8">Loading...</div>
              ) : filteredPositions.length === 0 ? (
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center">
                  <p className="text-slate-400">No {activeTab} positions</p>
                </div>
              ) : (
                filteredPositions.map(position => {
                  const market = markets.find(m => m.id === position.market_id);
                  const outcome = market?.outcomes?.find(o => o.id === position.outcome_id);
                  const posKey = `${position.market_id}__${position.outcome_id}`;
                  const isSelling = sellingPosition === posKey;
                  const currentProb = outcome?.probability ?? position.odds_at_prediction ?? 50;
                  const sellAmt = parseFloat(sellAmount) || 0;
                  const previewReturn = sellAmt > 0
                    ? (sellAmt * (currentProb / (position.odds_at_prediction || 50))).toFixed(2)
                    : null;
                  const previewPnl = previewReturn !== null
                    ? (parseFloat(previewReturn) - sellAmt).toFixed(2)
                    : null;

                  const handleSell = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!sellAmt || sellAmt <= 0) return;
                    setSellLoading(true); setSellMsg('');
                    try {
                      const userId = session?.user?.id || 'demo_user';
                      await api.sellPosition({
                        market_id: position.market_id,
                        outcome_id: position.outcome_id,
                        user_id: userId,
                        sell_amount: sellAmt,
                      });
                      setSellMsg(`✅ Sold $${sellAmt.toFixed(2)} → received $${previewReturn}`);
                      setTimeout(() => window.location.reload(), 1200);
                    } catch (err) {
                      setSellMsg(`❌ ${err.message}`);
                    } finally {
                      setSellLoading(false);
                    }
                  };

                  const statusStyles = {
                    active: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50',
                    won: 'bg-green-500/20 text-green-400 border border-green-500/50',
                    lost: 'bg-slate-500/20 text-slate-400 border border-slate-500/50'
                  };
                  const statusLabels = {
                    active: 'Pending Resolution',
                    won: 'Forecast Correct',
                    lost: 'Outcome Differed'
                  };

                  return (
                    <div
                      key={posKey}
                      className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-yellow-500/50 transition-all duration-200 rounded-2xl p-6"
                    >
                      {/* Main card — clickable to navigate (not when sell panel is open) */}
                      <div
                        className={`flex items-start justify-between ${!isSelling ? 'cursor-pointer group' : ''}`}
                        onClick={() => !isSelling && navigate(`/markets/${position.market_id}`)}
                      >
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-yellow-400 mb-1 group-hover:text-yellow-300 transition-colors">
                            {market?.title || 'Unknown Market'}
                          </h3>
                          <p className="text-slate-400 font-medium mb-3">{outcome?.title || 'Unknown Outcome'}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-slate-400">Total Position: </span>
                              <span className="text-white font-semibold">${position.stake_amount.toFixed(2)}</span>
                            </div>
                            {position._tradeCount > 1 && (
                              <div>
                                <span className="text-slate-400">Trades: </span>
                                <span className="text-slate-300 font-medium">{position._tradeCount}</span>
                              </div>
                            )}
                            {position.status === 'active' && (
                              <>
                                <div>
                                  <span className="text-slate-400">Avg Entry: </span>
                                  <span className="text-white font-medium">{position.odds_at_prediction}%</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Current: </span>
                                  <span className={`font-medium ${currentProb > position.odds_at_prediction ? 'text-green-400' : currentProb < position.odds_at_prediction ? 'text-red-400' : 'text-white'}`}>
                                    {currentProb.toFixed(1)}%
                                  </span>
                                </div>
                              </>
                            )}
                            {position.status === 'won' && (
                              <>
                                <div>
                                  <span className="text-slate-400">Return: </span>
                                  <span className="text-green-400 font-medium">${position.actual_return?.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Net: </span>
                                  <span className="text-green-400 font-medium">+${(position.actual_return - position.stake_amount).toFixed(2)}</span>
                                </div>
                              </>
                            )}
                            {position.status === 'lost' && (
                              <div>
                                <span className="text-slate-400">Avg Entry: </span>
                                <span className="text-white font-medium">{position.odds_at_prediction}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[position.status]}`}>
                            {statusLabels[position.status]}
                          </span>
                          {position.status === 'active' && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                if (isSelling) {
                                  setSellingPosition(null); setSellAmount(''); setSellMsg('');
                                } else {
                                  setSellingPosition(posKey); setSellAmount(''); setSellMsg('');
                                }
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                isSelling
                                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                              }`}
                            >
                              {isSelling ? 'Cancel' : 'Sell'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Sell panel — inline, expands below */}
                      {isSelling && (
                        <form
                          onSubmit={handleSell}
                          onClick={e => e.stopPropagation()}
                          className="mt-4 pt-4 border-t border-slate-700/50 space-y-3"
                        >
                          <p className="text-slate-400 text-xs">Sell at current market price ({currentProb.toFixed(1)}%)</p>
                          <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                              <input
                                type="number"
                                min="0.01"
                                max={position.stake_amount}
                                step="0.01"
                                value={sellAmount}
                                onChange={e => setSellAmount(e.target.value)}
                                placeholder={`Max $${position.stake_amount.toFixed(2)}`}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-7 pr-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setSellAmount(position.stake_amount.toFixed(2))}
                              className="px-3 py-2 text-xs bg-slate-800 border border-slate-600 rounded-lg text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
                            >
                              Max
                            </button>
                          </div>

                          {/* Live preview */}
                          {previewReturn && (
                            <div className="bg-slate-800/60 rounded-lg p-3 space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-400">You receive:</span>
                                <span className="text-white font-semibold">${previewReturn}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Net P&L:</span>
                                <span className={`font-semibold ${
                                  parseFloat(previewPnl) >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {parseFloat(previewPnl) >= 0 ? '+' : ''}${previewPnl}
                                </span>
                              </div>
                            </div>
                          )}

                          {sellMsg && (
                            <p className={`text-xs ${sellMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                              {sellMsg}
                            </p>
                          )}

                          <button
                            type="submit"
                            disabled={sellLoading || !sellAmt || sellAmt <= 0 || sellAmt > position.stake_amount}
                            className="w-full py-2 rounded-lg text-sm font-semibold bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            {sellLoading ? 'Selling...' : `Confirm Sell $${sellAmt > 0 ? sellAmt.toFixed(2) : '0.00'}`}
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
