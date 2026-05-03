import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useMarkets } from '../hooks/useMarkets';

// Robinhood-style equity chart
function EquityChart({ equityPoints, startingBalance, currentValue }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  const W = 800, H = 200, PX = 0, PY = 16;

  if (!equityPoints || equityPoints.length < 2) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-600 text-sm">Make your first prediction to see your equity chart</p>
      </div>
    );
  }

  const values = equityPoints.map(p => p.value);
  const allValues = [startingBalance, ...values];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const pad = Math.max((maxVal - minVal) * 0.2, 500);
  const chartMin = minVal - pad;
  const chartMax = maxVal + pad;
  const range = chartMax - chartMin || 1;

  const getX = (i) => PX + (i / (equityPoints.length - 1)) * (W - PX * 2);
  const getY = (v) => PY + (1 - (v - chartMin) / range) * (H - PY * 2);

  const points = equityPoints.map((p, i) => ({ x: getX(i), y: getY(p.value), ...p }));
  const baselineY = getY(startingBalance);
  const isProfit = currentValue >= startingBalance;
  const lineColor = isProfit ? '#22c55e' : '#ef4444';
  const gradId = isProfit ? 'eq-grad-profit' : 'eq-grad-loss';

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length-1].x},${H} L${points[0].x},${H} Z`;

  const handleMouseMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xRatio = (e.clientX - rect.left) / rect.width;
    const idx = Math.min(Math.round(xRatio * (points.length - 1)), points.length - 1);
    setHover(points[Math.max(0, idx)]);
  };

  return (
    <div className="relative w-full h-full" onMouseLeave={() => setHover(null)}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
      >
        <defs>
          <linearGradient id="eq-grad-profit" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#22c55e', stopOpacity: 0.25 }} />
            <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 0 }} />
          </linearGradient>
          <linearGradient id="eq-grad-loss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 0.25 }} />
            <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        {/* Baseline */}
        <line x1={0} y1={baselineY} x2={W} y2={baselineY}
          stroke="#475569" strokeWidth="1" strokeDasharray="6,4" opacity="0.5" />

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Equity line */}
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover scrubber */}
        {hover && (
          <>
            <line x1={hover.x} y1={PY} x2={hover.x} y2={H - PY}
              stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
            <circle cx={hover.x} cy={hover.y} r="5" fill={lineColor} stroke="#0f172a" strokeWidth="2" />
          </>
        )}
      </svg>

      {/* Hover tooltip */}
      {hover && (
        <div
          className="absolute top-2 pointer-events-none px-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-xs"
          style={{ left: `${Math.min(Math.max((hover.x / W) * 100, 5), 75)}%` }}
        >
          <p className="text-white font-semibold">${hover.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-slate-400">{new Date(hover.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { markets } = useMarkets();
  const [selectedRange, setSelectedRange] = useState('1D');
  const [activeFilter, setActiveFilter] = useState('all');
  const [predictions, setPredictions] = useState([]);
  const [allPredictions, setAllPredictions] = useState([]);
  const [sellingKey, setSellingKey] = useState(null); // 'marketId__outcomeId'
  const [sellAmount, setSellAmount] = useState('');
  const [sellLoading, setSellLoading] = useState(false);
  const [sellMsg, setSellMsg] = useState('');

  const fetchPredictions = () => {
    api.getPredictions()
      .then(data => {
        const allPreds = Array.isArray(data) ? data : [];
        const userId = session?.user?.id || 'demo_user';
        const userPredictions = allPreds.filter(p => p.user_id === userId);
        const activePredictions = userPredictions.filter(p => p.status === 'active');
        setAllPredictions(userPredictions);
        setPredictions(activePredictions);
      })
      .catch(() => {
        setPredictions([]);
        setAllPredictions([]);
      });
  };

  useEffect(() => {
    fetchPredictions();
    // Auto-refresh every 60 seconds so the chart and portfolio value stay live
    const interval = setInterval(fetchPredictions, 60_000);
    return () => clearInterval(interval);
  }, [session]);

  // Calculate portfolio metrics
  const startingBalance = 100000;
  const totalStaked = predictions.reduce((sum, p) => sum + (p.stake_amount || 0), 0);
  const settledPredictions = allPredictions.filter(p => p.status === 'won' || p.status === 'lost');
  const totalReturned = settledPredictions.reduce((sum, p) => sum + (p.actual_return || 0), 0);
  const settledStake = settledPredictions.reduce((sum, p) => sum + (p.stake_amount || 0), 0);
  const netProfitLoss = totalReturned - settledStake;
  const availableBalance = startingBalance + netProfitLoss - totalStaked;

  // Mark-to-market: expected value using FIXED entry payouts weighted by current probability
  // win_payout  = S + S(1−p_entry)  = S(2−p_entry)   [fixed at trade time]
  // loss_refund = S − S(1−p_entry)  = S × p_entry     [fixed at trade time]
  // current_value = p_current × win_payout + (1−p_current) × loss_refund
  // → value always stays between loss_refund and win_payout floors/ceilings
  const activeMtmValue = predictions.reduce((sum, p) => {
    const market = markets.find(m => m.id === p.market_id);
    const outcome = market?.outcomes?.find(o => o.id === p.outcome_id);
    const pCurrent = (outcome?.probability ?? p.odds_at_prediction ?? 50) / 100;
    const pEntry   = (p.odds_at_prediction || 50) / 100;
    const S = p.stake_amount || 0;
    const winPayout   = S * (2 - pEntry);   // S + S(1−p_entry)
    const lossRefund  = S * pEntry;          // S − S(1−p_entry)
    return sum + pCurrent * winPayout + (1 - pCurrent) * lossRefund;
  }, 0);

  const portfolioValue = availableBalance + activeMtmValue;
  const unrealizedPnl = activeMtmValue - totalStaked;
  const todayChange = netProfitLoss + unrealizedPnl;
  const todayChangePercent = startingBalance > 0 ? (todayChange / startingBalance) * 100 : 0;

  // Forecasting stats
  const totalPredictionCount = allPredictions.length;
  const wonCount = allPredictions.filter(p => p.status === 'won').length;
  const settledCount = settledPredictions.length;
  const accuracyPercent = settledCount > 0 ? Math.round((wonCount / settledCount) * 100) : 0;

  // Build equity curve:
  //  - Resolved trades (won/lost) are plotted at their creation timestamp.
  //  - Active positions contribute a live MTM step stamped at the current time,
  //    so the right side of the chart always reflects today's valuation.
  //  - The final point is pinned to portfolioValue so chart == header number.
  const buildEquityPoints = (preds) => {
    if (!preds.length) return [];

    const sorted = preds
      .filter(p => p.created_at)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Anchor: starting balance at the time of the very first prediction
    const firstDate = sorted[0].created_at;
    let runningValue = startingBalance;
    const points = [{ date: firstDate, value: runningValue }];

    // Plot each resolved trade at the time it was made
    sorted.forEach(p => {
      if (p.status === 'won') {
        runningValue += (p.actual_return || 0) - (p.stake_amount || 0);
        points.push({ date: p.created_at, value: runningValue });
      } else if (p.status === 'lost') {
        runningValue -= (p.stake_amount || 0) - (p.actual_return || 0);
        points.push({ date: p.created_at, value: runningValue });
      }
      // active positions: cash is just repositioned, no equity change yet
    });

    // MTM step for active positions — stamped NOW so the chart shows the
    // current live valuation on the right side of the time axis
    const now = new Date().toISOString();
    predictions.forEach(p => {
      const market = markets.find(m => m.id === p.market_id);
      const outcome = market?.outcomes?.find(o => o.id === p.outcome_id);
      const currentProb = outcome?.probability ?? p.odds_at_prediction ?? 50;
      const entryProb = p.odds_at_prediction || 50;
      const mtmDelta = (p.stake_amount || 0) * ((currentProb / entryProb) - 1);
      if (Math.abs(mtmDelta) > 0.01) {
        runningValue += mtmDelta;
        points.push({ date: now, value: runningValue });
      }
    });

    // Pin final point to exact portfolioValue so chart == header
    points.push({ date: now, value: portfolioValue });
    return points;
  };

  const equityPoints = buildEquityPoints(allPredictions);

  // Group predictions by market
  const groupedPredictions = predictions.reduce((acc, pred) => {
    if (!acc[pred.market_id]) {
      acc[pred.market_id] = [];
    }
    acc[pred.market_id].push(pred);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content (Left Side) */}
        <div className="flex-1">
          {/* Account Selector & Value */}
          <div className="mb-2">
            <button className="flex items-center gap-2 text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg transition-colors -ml-3">
              <span className="text-2xl font-semibold">Portfolio</span>
              <span className="text-slate-400">▾</span>
            </button>
          </div>

          {/* Portfolio Value */}
          <div className="mb-1">
            <h1 className="text-5xl font-bold text-white">${portfolioValue.toFixed(2)}</h1>
          </div>
          <div className="flex items-center gap-2 mb-8">
            <span className={`font-medium ${todayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {todayChange >= 0 ? '+' : ''}${todayChange.toFixed(2)} ({todayChange >= 0 ? '+' : ''}{todayChangePercent.toFixed(2)}%)
            </span>
            <span className="text-slate-400">All Time</span>
          </div>

          {/* Portfolio Chart */}
          <div className="mb-6">
            <div className="h-64 relative">
              <EquityChart
                equityPoints={equityPoints}
                startingBalance={startingBalance}
                currentValue={portfolioValue}
              />
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
            <div className="flex gap-1">
              {['1D', '1W', '1M', '3M', 'YTD', '1Y', 'ALL'].map(range => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${selectedRange === range
                    ? 'text-green-400 border-b-2 border-green-400'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors" style={{ color: 'rgb(212, 175, 55)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          {/* Paper Trading Balance */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ color: 'rgb(212, 175, 55)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                  </svg>
                </span>
                <span className="text-white font-medium">Paper Trading Balance</span>
                <span className="text-slate-500 cursor-help text-sm" title="Virtual money for practice trading">ⓘ</span>
              </div>
              <span className="text-2xl font-bold text-yellow-400">${availableBalance.toFixed(2)}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">This is virtual money for practice. No real funds are involved.</p>
          </div>

          {/* Forecasting Statistics */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span style={{ color: 'rgb(212, 175, 55)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </span>
              <span className="text-white font-medium">Your Forecasting Stats</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">{totalPredictionCount}</p>
                <p className="text-slate-500 text-xs">Predictions</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{accuracyPercent}%</p>
                <p className="text-slate-500 text-xs">Accuracy</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">0%</p>
                <p className="text-slate-500 text-xs">Calibration</p>
              </div>
            </div>
            <p className="text-slate-600 text-xs text-center mt-3">
              Accuracy = correct predictions • Calibration = confidence matches outcomes
            </p>
          </div>

          {/* Get More Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Get more out of Samsa</h2>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Did you know?</p>
                    <p className="text-white">You can explore trending markets and make predictions on events you care about.</p>
                  </div>
                  <button className="text-slate-500 hover:text-white p-1">✕</button>
                </div>
                <button
                  onClick={() => navigate('/explore')}
                  className="text-yellow-400 hover:text-yellow-300 text-sm font-medium mt-3 transition-colors"
                >
                  Explore markets
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity with Filters */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
              <div className="flex gap-1">
                {['all', 'trade', 'resolution'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${activeFilter === filter
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-800/50'
                      }`}
                  >
                    {filter === 'all' ? 'All' : filter === 'trade' ? 'Trades' : 'Resolutions'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-slate-500 text-sm text-center py-8">
                <p>No activity yet</p>
                <p className="text-xs mt-1">Your trades and resolutions will appear here</p>
              </div>
            </div>
            <button className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
              View all activity →
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Positions Section */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                <h3 className="text-white font-semibold">Positions</h3>
                <span className="text-slate-500 text-xs">{Object.keys(groupedPredictions).length} active</span>
              </div>
              {Object.keys(groupedPredictions).length === 0 ? (
                <p className="text-slate-500 text-sm">No open positions</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedPredictions).map(([marketId, marketPredictions]) => {
                    const market = markets.find(m => m.id === marketId);

                    // Aggregate by outcome
                    const outcomeMap = {};
                    marketPredictions.forEach(pred => {
                      const oid = pred.outcome_id;
                      if (!outcomeMap[oid]) {
                        outcomeMap[oid] = { totalStake: 0, weightedOdds: 0 };
                      }
                      const s = pred.stake_amount || 0;
                      outcomeMap[oid].totalStake += s;
                      outcomeMap[oid].weightedOdds += (pred.odds_at_prediction || 50) * s;
                    });

                    return (
                      <div key={marketId} className="bg-slate-800/30 rounded-lg p-3">
                        <p
                          className="text-white text-sm font-medium mb-2 line-clamp-2 cursor-pointer hover:text-yellow-400 transition-colors"
                          onClick={() => navigate(`/markets/${marketId}`)}
                        >
                          {market?.title || 'Unknown Market'}
                        </p>
                        <div className="space-y-2">
                          {Object.entries(outcomeMap).map(([outcomeId, data]) => {
                            const outcome = market?.outcomes?.find(o => o.id === outcomeId);
                            const currentProb = outcome?.probability ?? 50;
                            const avgEntry = data.totalStake > 0 ? data.weightedOdds / data.totalStake : 50;
                            // Expected value using FIXED entry payouts, weighted by current probability
                            const pCurrent = currentProb / 100;
                            const pEntry   = avgEntry / 100;
                            const S = data.totalStake;
                            const winPayout  = S * (2 - pEntry);   // S + S(1−p_entry)
                            const lossRefund = S * pEntry;          // S × p_entry
                            const mtmValue = pCurrent * winPayout + (1 - pCurrent) * lossRefund;
                            const unrealizedPnl = mtmValue - S;
                            const sellKey = `${marketId}__${outcomeId}`;
                            const isSelling = sellingKey === sellKey;
                            const sellAmt = parseFloat(sellAmount) || 0;
                            const previewReturn = isSelling && sellAmt > 0
                              ? Math.min(sellAmt * (currentProb / avgEntry), sellAmt * 2).toFixed(2)
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
                                  market_id: marketId,
                                  outcome_id: outcomeId,
                                  user_id: userId,
                                  sell_amount: sellAmt,
                                });
                                setSellMsg(`✅ Sold $${sellAmt.toFixed(2)}`);
                                setTimeout(() => window.location.reload(), 1000);
                              } catch (err) {
                                setSellMsg(`❌ ${err.message}`);
                              } finally {
                                setSellLoading(false);
                              }
                            };

                            return (
                              <div key={outcomeId}>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-400">{outcome?.title || 'Unknown'}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="text-right">
                                      {/* Live MTM value — red if below cost, green if above */}
                                      <span className={`font-semibold ${
                                        mtmValue < data.totalStake ? 'text-red-400' :
                                        mtmValue > data.totalStake ? 'text-green-400' : 'text-slate-300'
                                      }`}>
                                        ${mtmValue.toFixed(2)}
                                      </span>
                                      {/* Unrealized P&L delta */}
                                      <span className={`block text-[10px] leading-tight ${
                                        unrealizedPnl < 0 ? 'text-red-500' :
                                        unrealizedPnl > 0 ? 'text-green-500' : 'text-slate-500'
                                      }`}>
                                        {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}
                                      </span>
                                    </div>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        if (isSelling) {
                                          setSellingKey(null); setSellAmount(''); setSellMsg('');
                                        } else {
                                          setSellingKey(sellKey); setSellAmount(''); setSellMsg('');
                                        }
                                      }}
                                      className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                                        isSelling
                                          ? 'bg-slate-700 text-slate-300'
                                          : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                                      }`}
                                    >
                                      {isSelling ? 'Cancel' : 'Sell'}
                                    </button>
                                  </div>
                                </div>

                                {/* Inline sell panel */}
                                {isSelling && (
                                  <form
                                    onSubmit={handleSell}
                                    onClick={e => e.stopPropagation()}
                                    className="mt-2 space-y-2"
                                  >
                                    <p className="text-slate-500 text-xs">Current: {currentProb.toFixed(1)}% · Entry: {avgEntry.toFixed(1)}%</p>
                                    <div className="flex gap-1">
                                      <div className="relative flex-1">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                                        <input
                                          type="number"
                                          min="0.01"
                                          max={data.totalStake}
                                          step="0.01"
                                          value={sellAmount}
                                          onChange={e => setSellAmount(e.target.value)}
                                          placeholder={`Max $${data.totalStake.toFixed(2)}`}
                                          className="w-full bg-slate-800 border border-slate-600 rounded pl-5 pr-2 py-1.5 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-red-500"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setSellAmount(data.totalStake.toFixed(2))}
                                        className="px-2 py-1.5 text-xs bg-slate-800 border border-slate-600 rounded text-slate-400 hover:text-white transition-colors"
                                      >
                                        Max
                                      </button>
                                    </div>

                                    {previewReturn && (
                                      <div className="bg-slate-800 rounded p-2 space-y-1 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">Receive:</span>
                                          <span className="text-white font-medium">${previewReturn}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">P&L:</span>
                                          <span className={`font-medium ${
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
                                      disabled={sellLoading || !sellAmt || sellAmt <= 0 || sellAmt > data.totalStake}
                                      className="w-full py-1.5 rounded text-xs font-semibold bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                      {sellLoading ? 'Selling...' : 'Confirm Sell'}
                                    </button>
                                  </form>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Following Section */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <h3 className="text-white font-semibold">Following</h3>
                <span className="text-slate-500 text-xs">0 markets</span>
              </div>
              <p className="text-slate-500 text-sm">No markets followed</p>
            </div>
          </div>

          {/* Watchlist Section */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                <h3 className="text-white font-semibold">Watchlist</h3>
                <span className="text-slate-500 text-xs">0 items</span>
              </div>
              <p className="text-slate-500 text-sm">No watchlist items</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
