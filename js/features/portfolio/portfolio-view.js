// ========================================
// SAMSA - PORTFOLIO
// Handles portfolio page rendering and statistics
// ========================================

// Cache for profit/loss history (relative to $0 baseline)
let profitLossHistory = [];

/**
 * Initialize portfolio chart showing profit/loss from trading
 */
function initPortfolioChart() {
  const container = document.getElementById('portfolioChartContainer');
  if (!container) return;
  
  // Calculate current profit/loss
  const profitLoss = calculateProfitLoss();
  
  // Generate history ending at current profit/loss
  generateProfitLossHistory(profitLoss.netProfitLoss);
  
  // Render the chart
  renderPortfolioChart();
}

/**
 * Get current portfolio value (for display)
 */
function getPortfolioValue() {
  const balance = typeof getBalance === 'function' ? getBalance() : 0;
  const activePredictionsValue = (typeof predictions !== 'undefined' ? predictions : [])
    .filter(p => p.status === 'active')
    .reduce((sum, p) => sum + (p.stake || p.stake_amount || 0), 0);
  return balance + activePredictionsValue;
}

/**
 * Calculate profit/loss from trading activity
 * Profit/Loss = Current Portfolio Value - Total Deposited + Total Withdrawn
 */
function calculateProfitLoss() {
  const balance = typeof getBalance === 'function' ? getBalance() : 0;
  
  // Get all predictions (active, won, lost)
  const allPredictions = typeof predictions !== 'undefined' ? predictions : [];
  const activePredictions = allPredictions.filter(p => p.status === 'active');
  const settledPredictions = allPredictions.filter(p => p.status === 'won' || p.status === 'lost');
  
  const activePredictionsValue = activePredictions
    .reduce((sum, p) => sum + (p.stake || p.stake_amount || 0), 0);
  
  // Get wallet state for deposit/withdrawal totals
  const totalDeposited = typeof walletState !== 'undefined' ? (walletState.totalDeposited || 0) : 0;
  const totalWithdrawn = typeof walletState !== 'undefined' ? (walletState.totalWithdrawn || 0) : 0;
  
  // Current portfolio value
  const portfolioValue = balance + activePredictionsValue;
  
  // Net profit/loss = what you have now - what you put in + what you took out
  const netProfitLoss = portfolioValue - totalDeposited + totalWithdrawn;
  
  // Has started trading = has made at least one prediction (active or settled)
  const hasStartedTrading = allPredictions.length > 0;
  
  return {
    portfolioValue,
    totalDeposited,
    totalWithdrawn,
    netProfitLoss,
    hasStartedTrading,
    activePredictionsCount: activePredictions.length,
    settledPredictionsCount: settledPredictions.length
  };
}

/**
 * Generate profit/loss history that ends at current P/L
 * Shows journey from $0 baseline to current profit/loss
 */
function generateProfitLossHistory(currentProfitLoss, points = 30) {
  // If we already have history with correct endpoint, keep it
  if (profitLossHistory.length === points && 
      Math.abs(profitLossHistory[profitLossHistory.length - 1] - currentProfitLoss) < 0.01) {
    return;
  }
  
  // Generate new history ending at current P/L
  profitLossHistory = [];
  
  // Start from 0 (baseline) and walk to current profit/loss
  let value = 0;
  const volatility = Math.max(Math.abs(currentProfitLoss) * 0.3, 10); // Min volatility of $10
  
  for (let i = 0; i < points - 1; i++) {
    profitLossHistory.push(value);
    
    // Progress toward final value with some randomness
    const progress = (i + 1) / (points - 1);
    const targetValue = currentProfitLoss * progress;
    const randomChange = (Math.random() - 0.5) * volatility * 0.3;
    value = targetValue + randomChange;
  }
  
  // Ensure last point is exactly the current profit/loss
  profitLossHistory.push(currentProfitLoss);
}

/**
 * Render the portfolio chart SVG
 * Shows profit/loss with $0 baseline
 * Green above $0 (profit), Red below $0 (loss)
 */
function renderPortfolioChart() {
  const container = document.getElementById('portfolioChartContainer');
  if (!container) return;
  
  const width = 800;
  const height = 200;
  const padding = 8;
  
  // Check if user has started trading (made any predictions)
  const profitLoss = calculateProfitLoss();
  
  if (!profitLoss.hasStartedTrading) {
    // Show empty state - user hasn't made any trades yet
    container.innerHTML = `
      <div class="relative w-full h-full">
        <svg class="w-full h-full" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
          <!-- Subtle grid -->
          <line x1="0" y1="${height * 0.25}" x2="${width}" y2="${height * 0.25}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.2" />
          <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.2" />
          <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.2" />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p class="text-slate-500 text-lg mb-2">No trades yet</p>
          <p class="text-slate-600 text-sm">Make your first prediction to start tracking P/L</p>
        </div>
      </div>
    `;
    return;
  }
  
  // Ensure we have history
  if (profitLossHistory.length === 0) {
    generateProfitLossHistory(profitLoss.netProfitLoss);
  }
  
  // Find min/max for scaling - always include 0 in the range
  const allValues = [...profitLossHistory, 0];
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  
  // Add some padding to the range
  const rangePadding = Math.max((maxValue - minValue) * 0.1, 10);
  const chartMin = minValue - rangePadding;
  const chartMax = maxValue + rangePadding;
  const range = chartMax - chartMin;
  
  // Calculate Y position for a value
  const getY = (value) => padding + (1 - (value - chartMin) / range) * (height - 2 * padding);
  
  // $0 baseline Y position
  const zeroY = getY(0);
  
  // Generate SVG path points
  const points = profitLossHistory.map((value, i) => {
    const x = padding + (i / (profitLossHistory.length - 1)) * (width - 2 * padding);
    const y = getY(value);
    return { x, y, value };
  });
  
  // Create line path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  
  // Current profit/loss determines color
  const currentPL = profitLossHistory[profitLossHistory.length - 1];
  const isProfit = currentPL >= 0;
  const lineColor = isProfit ? '#22c55e' : '#ef4444';
  const fillColor = isProfit ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
  
  // Create area path from line to $0 baseline
  const areaPath = `${linePath} L${points[points.length - 1].x},${zeroY} L${points[0].x},${zeroY} Z`;
  
  // Format P/L value for display
  const plText = currentPL >= 0 ? `+$${currentPL.toFixed(2)}` : `-$${Math.abs(currentPL).toFixed(2)}`;
  const plColor = isProfit ? '#22c55e' : '#ef4444';
  
  container.innerHTML = `
    <div class="relative w-full h-full">
      <svg class="w-full h-full" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="portfolioGradientProfit" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style="stop-color:#22c55e;stop-opacity:0" />
            <stop offset="100%" style="stop-color:#22c55e;stop-opacity:0.3" />
          </linearGradient>
          <linearGradient id="portfolioGradientLoss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ef4444;stop-opacity:0" />
            <stop offset="100%" style="stop-color:#ef4444;stop-opacity:0.3" />
          </linearGradient>
        </defs>
        
        <!-- $0 Baseline (the key reference line) -->
        <line x1="0" y1="${zeroY}" x2="${width}" y2="${zeroY}" stroke="#64748b" stroke-width="2" stroke-dasharray="8,4" />
        
        <!-- Subtle grid lines for context -->
        <line x1="0" y1="${height * 0.15}" x2="${width}" y2="${height * 0.15}" stroke="#334155" stroke-width="0.5" stroke-dasharray="2,4" opacity="0.3" />
        <line x1="0" y1="${height * 0.85}" x2="${width}" y2="${height * 0.85}" stroke="#334155" stroke-width="0.5" stroke-dasharray="2,4" opacity="0.3" />
        
        <!-- Area fill (to/from $0 baseline) -->
        <path d="${areaPath}" fill="${isProfit ? 'url(#portfolioGradientProfit)' : 'url(#portfolioGradientLoss)'}" />
        
        <!-- P/L Line -->
        <path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        
        <!-- Current point indicator -->
        <circle cx="${points[points.length - 1].x}" cy="${points[points.length - 1].y}" r="5" fill="${lineColor}" />
        <circle cx="${points[points.length - 1].x}" cy="${points[points.length - 1].y}" r="8" fill="${lineColor}" opacity="0.3">
          <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        
        <!-- $0 label -->
        <text x="12" y="${zeroY - 6}" fill="#64748b" font-size="11" font-family="system-ui">$0</text>
      </svg>
      
      <!-- P/L indicator badge -->
      <div class="absolute top-2 right-2 px-3 py-1 rounded-lg ${isProfit ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}">
        <span class="text-sm font-bold" style="color: ${plColor}">${plText}</span>
        <span class="text-xs text-slate-400 ml-1">P/L</span>
      </div>
    </div>
  `;
}

/**
 * Update portfolio chart when values change
 */
function updatePortfolioChart() {
  const profitLoss = calculateProfitLoss();
  generateProfitLossHistory(profitLoss.netProfitLoss);
  renderPortfolioChart();
  
  // Update the displayed portfolio value
  const portfolioValueEl = document.getElementById('portfolioValue');
  if (portfolioValueEl) {
    portfolioValueEl.textContent = `$${profitLoss.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Show the portfolio view (now redirects to combined dashboard)
 */
function showPortfolio() {
  // Portfolio is now combined with dashboard
  showDashboard();
}

/**
 * Render the portfolio with user's predictions
 */
function renderPortfolio() {
  const container = document.getElementById('portfolioContent');
  if (!container) return;
  
  container.innerHTML = `
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <p class="text-slate-400 text-sm mb-1">Total Staked</p>
        <p class="text-3xl font-bold text-yellow-400">$0.00</p>
      </div>
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <p class="text-slate-400 text-sm mb-1">Active Predictions</p>
        <p class="text-3xl font-bold text-yellow-400">0</p>
        <p class="text-xs text-slate-500 mt-1">Potential: $0.00</p>
      </div>
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <p class="text-slate-400 text-sm mb-1">Net Profit/Loss</p>
        <p class="text-3xl font-bold text-slate-400">$0.00</p>
      </div>
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <p class="text-slate-400 text-sm mb-1">Win Rate</p>
        <p class="text-3xl font-bold text-yellow-400">0%</p>
        <p class="text-xs text-slate-500 mt-1">0W / 0L</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6">
      <button onclick="filterPortfolio('active')" class="portfolio-tab px-4 py-2 rounded-lg font-semibold text-sm transition-all bg-yellow-500/20 text-yellow-400 border border-yellow-500/50" data-tab="active">
        Active (0)
      </button>
      <button onclick="filterPortfolio('won')" class="portfolio-tab px-4 py-2 rounded-lg font-semibold text-sm transition-all text-slate-400 border border-slate-700 hover:border-yellow-500/50" data-tab="won">
        Won (0)
      </button>
      <button onclick="filterPortfolio('lost')" class="portfolio-tab px-4 py-2 rounded-lg font-semibold text-sm transition-all text-slate-400 border border-slate-700 hover:border-yellow-500/50" data-tab="lost">
        Lost (0)
      </button>
    </div>

    <!-- Predictions List -->
    <div id="portfolioPredictions" class="space-y-4">
      ${renderPredictionsList('active')}
    </div>
  `;
}

/**
 * Calculate portfolio statistics
 */
function calculatePortfolioStats() {
  const activePreds = predictions.filter(p => p.status === 'active');
  const wonPreds = predictions.filter(p => p.status === 'won');
  const lostPreds = predictions.filter(p => p.status === 'lost');

  const totalStaked = predictions.reduce((sum, p) => sum + (p.stake_amount || 0), 0);
  const totalReturned = predictions.reduce((sum, p) => sum + (p.actual_return || 0), 0);
  const potentialReturn = activePreds.reduce((sum, p) => sum + (p.potential_return || 0), 0);
  
  const settledStake = predictions
    .filter(p => p.status !== 'active')
    .reduce((sum, p) => sum + (p.stake_amount || 0), 0);
  const netProfit = totalReturned - settledStake;

  const totalSettled = wonPreds.length + lostPreds.length;
  const winRate = totalSettled > 0 ? Math.round((wonPreds.length / totalSettled) * 100) : 0;

  return {
    totalStaked,
    activePredictions: activePreds.length,
    potentialReturn,
    netProfit,
    winRate,
    wins: wonPreds.length,
    losses: lostPreds.length
  };
}

/**
 * Filter portfolio by prediction status
 */
function filterPortfolio(status) {
  // Update tab styling
  document.querySelectorAll('.portfolio-tab').forEach(btn => {
    btn.classList.remove('bg-yellow-500/20', 'text-yellow-400', 'border-yellow-500/50');
    btn.classList.add('text-slate-400', 'border-slate-700');
  });
  
  const activeTab = document.querySelector(`.portfolio-tab[data-tab="${status}"]`);
  if (activeTab) {
    activeTab.classList.remove('text-slate-400', 'border-slate-700');
    activeTab.classList.add('bg-yellow-500/20', 'text-yellow-400', 'border-yellow-500/50');
  }

  // Update predictions list
  const container = document.getElementById('portfolioPredictions');
  if (container) {
    container.innerHTML = renderPredictionsList(status);
  }
}

/**
 * Render predictions list by status
 */
function renderPredictionsList(status) {
  const filteredPredictions = predictions.filter(p => p.status === status);
  
  if (filteredPredictions.length === 0) {
    return `
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center">
        <p class="text-slate-400">No ${status} predictions</p>
      </div>
    `;
  }

  return filteredPredictions.map(prediction => {
    const market = markets.find(m => m.id === prediction.market_id);
    const outcome = market?.outcomes?.find(o => o.id === prediction.outcome_id);
    
    return `
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-yellow-500/50 transition-all duration-200 rounded-2xl p-6 cursor-pointer" onclick="showDetail(${prediction.market_id})">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-yellow-400 mb-1">${market?.title || 'Unknown Market'}</h3>
            <p class="text-yellow-400 font-medium mb-3">${outcome?.title || 'Unknown Outcome'}</p>
            <div class="flex flex-wrap gap-4 text-sm">
              <div>
                <span class="text-slate-400">Stake: </span>
                <span class="text-white font-medium">$${prediction.stake_amount}</span>
              </div>
              ${status === 'active' ? `
<div>
                <span class="text-slate-400">Price: </span>
                <span class="text-white font-medium">${prediction.odds_at_prediction}¢</span>
              </div>
                <div>
                  <span class="text-slate-400">Potential: </span>
                  <span class="text-green-400 font-medium">$${prediction.potential_return?.toFixed(2)}</span>
                </div>
              ` : ''}
              ${status === 'won' ? `
                <div>
                  <span class="text-slate-400">Return: </span>
                  <span class="text-green-400 font-medium">$${prediction.actual_return?.toFixed(2)}</span>
                </div>
                <div>
                  <span class="text-slate-400">Profit: </span>
                  <span class="text-green-400 font-medium">+$${(prediction.actual_return - prediction.stake_amount).toFixed(2)}</span>
                </div>
              ` : ''}
              ${status === 'lost' ? `
                <div>
                  <span class="text-slate-400">Loss: </span>
                  <span class="text-red-400 font-medium">-$${prediction.stake_amount}</span>
                </div>
              ` : ''}
            </div>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-semibold ${
            status === 'active' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' :
            status === 'won' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
            'bg-red-500/20 text-red-400 border border-red-500/50'
          }">
            ${status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

