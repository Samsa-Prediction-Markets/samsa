// ========================================
// SAMSA - PORTFOLIO
// Handles portfolio page rendering and statistics
// ========================================

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

  // Calculate portfolio statistics
  const stats = calculatePortfolioStats();
  
  container.innerHTML = `
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <p class="text-slate-400 text-sm mb-1">Total Staked</p>
        <p class="text-3xl font-bold text-yellow-400">$${stats.totalStaked.toFixed(2)}</p>
      </div>
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <p class="text-slate-400 text-sm mb-1">Active Predictions</p>
        <p class="text-3xl font-bold text-yellow-400">${stats.activePredictions}</p>
        <p class="text-xs text-slate-500 mt-1">Potential: $${stats.potentialReturn.toFixed(2)}</p>
      </div>
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <p class="text-slate-400 text-sm mb-1">Net Profit/Loss</p>
        <p class="text-3xl font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}">
          ${stats.netProfit >= 0 ? '+' : ''}$${Math.abs(stats.netProfit).toFixed(2)}
        </p>
      </div>
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <p class="text-slate-400 text-sm mb-1">Win Rate</p>
        <p class="text-3xl font-bold text-yellow-400">${stats.winRate}%</p>
        <p class="text-xs text-slate-500 mt-1">${stats.wins}W / ${stats.losses}L</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6">
      <button onclick="filterPortfolio('active')" class="portfolio-tab px-4 py-2 rounded-lg font-semibold text-sm transition-all bg-yellow-500/20 text-yellow-400 border border-yellow-500/50" data-tab="active">
        Active (${stats.activePredictions})
      </button>
      <button onclick="filterPortfolio('won')" class="portfolio-tab px-4 py-2 rounded-lg font-semibold text-sm transition-all text-slate-400 border border-slate-700 hover:border-yellow-500/50" data-tab="won">
        Won (${stats.wins})
      </button>
      <button onclick="filterPortfolio('lost')" class="portfolio-tab px-4 py-2 rounded-lg font-semibold text-sm transition-all text-slate-400 border border-slate-700 hover:border-yellow-500/50" data-tab="lost">
        Lost (${stats.losses})
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
                  <span class="text-slate-400">Odds: </span>
                  <span class="text-white font-medium">${prediction.odds_at_prediction}%</span>
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

