// ========================================
// SAMSA - MARKETS
// Handles markets page rendering and filtering
// ========================================

// Store generated probability histories for consistency
const probabilityHistories = new Map();

// Outcome colors
const OUTCOME_COLORS = [
  { line: '#22c55e', fill: 'rgba(34, 197, 94, 0.2)', name: 'Yes' },   // Green
  { line: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)', name: 'No' },    // Red
  { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.2)', name: 'Option C' }, // Blue
  { line: '#f59e0b', fill: 'rgba(245, 158, 11, 0.2)', name: 'Option D' }, // Amber
  { line: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.2)', name: 'Option E' }, // Purple
];

/**
 * Generate random probability history for an outcome
 * For binary markets, generates complementary histories
 * @param {string} cacheKey - Unique cache key
 * @param {number} currentProb - Current probability (0-100)
 * @param {number} points - Number of data points
 * @returns {number[]} Array of probability values
 */
function generateProbabilityHistory(cacheKey, currentProb, points = 30) {
  if (probabilityHistories.has(cacheKey)) {
    return probabilityHistories.get(cacheKey);
  }
  
  const history = [];
  let prob = currentProb;
  
  for (let i = points - 1; i >= 0; i--) {
    if (i === 0) {
      history.unshift(currentProb);
    } else {
      const change = (Math.random() - 0.5) * 8;
      const meanReversion = (50 - prob) * 0.02;
      prob = Math.max(5, Math.min(95, prob - change + meanReversion));
      history.unshift(Math.round(prob));
    }
  }
  
  probabilityHistories.set(cacheKey, history);
  return history;
}

/**
 * Generate histories for all outcomes in a market
 * Binary markets have complementary probabilities (Yes + No = 100)
 */
function generateMarketHistories(marketId, outcomes, points = 30) {
  const cacheKey = `market-${marketId}`;
  
  if (probabilityHistories.has(cacheKey)) {
    return probabilityHistories.get(cacheKey);
  }
  
  const histories = [];
  
  // Generate first outcome history
  const firstHistory = generateProbabilityHistory(`${cacheKey}-0`, outcomes[0].probability, points);
  histories.push(firstHistory);
  
  // For binary markets (2 outcomes), generate complementary history
  if (outcomes.length === 2) {
    const complementHistory = firstHistory.map(val => 100 - val);
    histories.push(complementHistory);
  } else {
    // For multi-outcome markets, generate independent histories
    for (let i = 1; i < outcomes.length; i++) {
      histories.push(generateProbabilityHistory(`${cacheKey}-${i}`, outcomes[i].probability, points));
    }
  }
  
  probabilityHistories.set(cacheKey, histories);
  return histories;
}

/**
 * Generate SVG path for probability line
 */
function generateLinePath(data, width, height) {
  const padding = 4;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * graphWidth;
    const y = padding + graphHeight - (value / 100) * graphHeight;
    return { x, y };
  });
  
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cp1x = prev.x + (curr.x - prev.x) / 3;
    const cp2x = prev.x + 2 * (curr.x - prev.x) / 3;
    path += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  
  return path;
}

/**
 * Generate area fill path
 */
function generateAreaPath(data, width, height) {
  const linePath = generateLinePath(data, width, height);
  const padding = 4;
  return `${linePath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;
}

/**
 * Create multi-outcome probability chart SVG
 */
function createMultiOutcomeChart(marketId, outcomes, width = 300, height = 120) {
  const histories = generateMarketHistories(marketId, outcomes);
  const gradientDefs = [];
  const areaPaths = [];
  const linePaths = [];
  const dots = [];
  const legend = [];
  
  outcomes.forEach((outcome, idx) => {
    const history = histories[idx];
    const color = OUTCOME_COLORS[idx] || OUTCOME_COLORS[0];
    const gradientId = `grad-${marketId}-${idx}`;
    const currentY = 4 + (height - 8) - (outcome.probability / 100) * (height - 8);
    
    // Gradient definition
    gradientDefs.push(`
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${color.line};stop-opacity:0.15" />
        <stop offset="100%" style="stop-color:${color.line};stop-opacity:0" />
      </linearGradient>
    `);
    
    // Area fill
    areaPaths.push(`<path d="${generateAreaPath(history, width, height)}" fill="url(#${gradientId})" />`);
    
    // Line
    linePaths.push(`<path d="${generateLinePath(history, width, height)}" fill="none" stroke="${color.line}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`);
    
    // Current point with pulse animation
    dots.push(`
      <circle cx="${width - 4}" cy="${currentY}" r="4" fill="${color.line}" />
      <circle cx="${width - 4}" cy="${currentY}" r="6" fill="${color.line}" opacity="0.3">
        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" begin="${idx * 0.3}s" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" begin="${idx * 0.3}s" />
      </circle>
    `);
    
    // Legend item
    const startProb = history[0];
    const endProb = history[history.length - 1];
    const change = endProb - startProb;
    const changeSign = change >= 0 ? '+' : '';
    
    legend.push(`
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full" style="background: ${color.line}"></span>
        <span class="text-xs text-white font-medium">${outcome.title}</span>
        <span class="text-xs font-bold" style="color: ${color.line}">${outcome.probability}%</span>
        <span class="text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}">${changeSign}${change.toFixed(0)}</span>
      </div>
    `);
  });
  
  return `
    <div class="relative">
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" class="rounded-xl">
        <defs>${gradientDefs.join('')}</defs>
        <!-- Grid lines -->
        <line x1="0" y1="${height * 0.25}" x2="${width}" y2="${height * 0.25}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" />
        <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" />
        <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" />
        <!-- Area fills -->
        ${areaPaths.join('')}
        <!-- Lines -->
        ${linePaths.join('')}
        <!-- Current points -->
        ${dots.join('')}
      </svg>
      <!-- Y-axis labels -->
      <div class="absolute left-1 top-1 text-[10px] text-slate-500">100%</div>
      <div class="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">50%</div>
      <div class="absolute left-1 bottom-1 text-[10px] text-slate-500">0%</div>
      <!-- Legend -->
      <div class="flex flex-wrap gap-4 mt-2 justify-center">
        ${legend.join('')}
      </div>
    </div>
  `;
}

/**
 * Create mini multi-outcome chart for cards
 */
function createMiniMultiChart(marketId, outcomes) {
  const histories = generateMarketHistories(marketId, outcomes, 30);
  const width = 280;
  const height = 100;
  
  const linePaths = [];
  const areaPaths = [];
  const gradientDefs = [];
  const dots = [];
  
  outcomes.slice(0, 2).forEach((outcome, idx) => {
    const history = histories[idx];
    const color = OUTCOME_COLORS[idx];
    const gradientId = `mini-grad-${marketId}-${idx}`;
    const currentY = 4 + (height - 8) - (outcome.probability / 100) * (height - 8);
    
    gradientDefs.push(`
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${color.line};stop-opacity:0.15" />
        <stop offset="100%" style="stop-color:${color.line};stop-opacity:0" />
      </linearGradient>
    `);
    
    areaPaths.push(`<path d="${generateAreaPath(history, width, height)}" fill="url(#${gradientId})" />`);
    linePaths.push(`<path d="${generateLinePath(history, width, height)}" fill="none" stroke="${color.line}" stroke-width="2" stroke-linecap="round" />`);
    dots.push(`<circle cx="${width - 4}" cy="${currentY}" r="3" fill="${color.line}" />`);
  });
  
  // Calculate trends for legend
  const legends = outcomes.slice(0, 2).map((outcome, idx) => {
    const history = histories[idx];
    const startProb = history[0];
    const endProb = history[history.length - 1];
    const change = endProb - startProb;
    const color = OUTCOME_COLORS[idx];
    const arrow = change >= 0 ? '↑' : '↓';
    
    return `
      <div class="flex items-center gap-1">
        <span class="w-2 h-2 rounded-full" style="background: ${color.line}"></span>
        <span class="text-xs" style="color: ${color.line}">${outcome.title}</span>
        <span class="text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}">${arrow}${Math.abs(change).toFixed(0)}%</span>
      </div>
    `;
  });
  
  return `
    <div class="mb-4 rounded-xl overflow-hidden bg-slate-800/30 p-2">
      <div class="flex items-center justify-between mb-1 px-1">
        <span class="text-xs text-slate-500">30d Trend</span>
        <div class="flex gap-3">
          ${legends.join('')}
        </div>
      </div>
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>${gradientDefs.join('')}</defs>
        <!-- Grid -->
        <line x1="0" y1="${height/2}" x2="${width}" y2="${height/2}" stroke="#334155" stroke-width="0.5" stroke-dasharray="2,2" />
        ${areaPaths.join('')}
        ${linePaths.join('')}
        ${dots.join('')}
      </svg>
    </div>
  `;
}

// Trending slideshow state
let currentTrendingSlide = 0;
let trendingMarketsData = [];

/**
 * Normalize market data from API (snake_case) to expected format (camelCase)
 */
function normalizeMarket(market) {
  return {
    ...market,
    // Normalize property names
    volume: market.volume || market.total_volume || 0,
    volume24h: market.volume24h || Math.round((market.total_volume || 0) * 0.15) || 0,
    traders: market.traders || Math.round((market.total_volume || 0) / 50) || 0,
    closeDate: market.closeDate || formatCloseDate(market.close_date) || 'TBD',
    // Normalize outcomes
    outcomes: (market.outcomes || []).map(o => ({
      ...o,
      stake: o.stake || o.total_stake || 0
    })),
    // Default news if not present
    news: market.news || [
      { title: 'Market activity increasing', source: 'Samsa', time: '1h ago' }
    ]
  };
}

/**
 * Format close date from ISO string or return as-is
 */
function formatCloseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

async function renderMarkets() {
  const grid = document.getElementById('marketsGrid');
  
  // Always try to fetch markets from API
  try {
    const response = await fetch('http://localhost:3001/api/markets');
    if (response.ok) {
      const apiMarkets = await response.json();
      if (apiMarkets && apiMarkets.length > 0) {
        // Normalize API markets and merge with local sample markets
        const normalizedApiMarkets = apiMarkets.map(normalizeMarket);
        const apiIds = new Set(normalizedApiMarkets.map(m => m.id));
        const uniqueSampleMarkets = markets.filter(m => !apiIds.has(m.id));
        markets = [...normalizedApiMarkets, ...uniqueSampleMarkets];
        console.log(`✅ Loaded ${apiMarkets.length} markets from API`);
      }
    }
  } catch (error) {
    console.log('⚠️ API not available, using sample markets:', error.message);
  }
  
  grid.innerHTML = markets.map(market => createMarketCardHTML(normalizeMarket(market))).join('');
  
  // Also render trending slideshow
  renderTrendingSlideshow();
  
  // Render suggested interests
  renderSuggestedInterests();
}

/**
 * Render suggested interests section
 */
function renderSuggestedInterests() {
  const container = document.getElementById('suggestedInterests');
  if (!container) return;
  
  // Get interests from different categories
  const allInterests = getSuggestedInterestsList();
  
  // Shuffle and take 6
  const shuffled = allInterests.sort(() => Math.random() - 0.5).slice(0, 6);
  
  container.innerHTML = shuffled.map(interest => createSuggestedInterestCard(interest)).join('');
}

/**
 * Get list of interests to suggest
 */
function getSuggestedInterestsList() {
  const interests = [];
  
  // Add sports from config if available
  if (typeof SELECTED_SPORTS !== 'undefined') {
    SELECTED_SPORTS.forEach(sport => {
      interests.push({
        id: sport.id,
        name: sport.name,
        category: 'sports',
        color: 'from-green-500 to-emerald-600'
      });
    });
  }
  
  // Add political topics if available
  if (typeof SELECTED_POLITICAL_TOPICS !== 'undefined') {
    SELECTED_POLITICAL_TOPICS.slice(0, 5).forEach(topic => {
      interests.push({
        id: topic.id,
        name: topic.name,
        category: 'politics',
        color: 'from-blue-500 to-indigo-600'
      });
    });
  }
  
  // Add finance topics if available
  if (typeof SELECTED_FINANCE_TOPICS !== 'undefined') {
    SELECTED_FINANCE_TOPICS.slice(0, 5).forEach(topic => {
      interests.push({
        id: topic.id,
        name: topic.name,
        category: 'finance',
        color: 'from-yellow-500 to-amber-600'
      });
    });
  }
  
  // Add science topics if available
  if (typeof SELECTED_SCIENCE_TOPICS !== 'undefined') {
    SELECTED_SCIENCE_TOPICS.slice(0, 5).forEach(topic => {
      interests.push({
        id: topic.id,
        name: topic.name,
        category: 'science',
        color: 'from-purple-500 to-violet-600'
      });
    });
  }
  
  // Add some default interests if none found
  if (interests.length === 0) {
    interests.push(
      { id: 'soccer', name: 'Soccer', category: 'sports', color: 'from-green-500 to-emerald-600' },
      { id: 'basketball', name: 'Basketball', category: 'sports', color: 'from-orange-500 to-red-600' },
      { id: 'crypto', name: 'Cryptocurrency', category: 'finance', color: 'from-yellow-500 to-amber-600' },
      { id: 'ai', name: 'AI & Tech', category: 'technology', color: 'from-cyan-500 to-blue-600' },
      { id: 'politics', name: 'US Politics', category: 'politics', color: 'from-blue-500 to-indigo-600' },
      { id: 'climate', name: 'Climate', category: 'environment', color: 'from-green-500 to-teal-600' },
      { id: 'movies', name: 'Movies', category: 'entertainment', color: 'from-pink-500 to-rose-600' },
      { id: 'music', name: 'Music', category: 'entertainment', color: 'from-purple-500 to-pink-600' }
    );
  }
  
  return interests;
}

/**
 * Create a suggested interest card
 */
function createSuggestedInterestCard(interest) {
  const isFollowing = typeof isFavorited === 'function' ? isFavorited(interest.id) : false;
  const icon = window.SamsaIcons ? window.SamsaIcons.getIcon(interest.name, 'w-8 h-8') : '';
  
  return `
    <div class="group relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-yellow-500/50 transition-all duration-300 rounded-xl p-4 cursor-pointer"
      onclick="handleInterestClick('${interest.id}', '${interest.name}', '${interest.category}')">
      <div class="absolute inset-0 bg-gradient-to-br ${interest.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
      <div class="relative text-center">
        <span class="flex justify-center mb-2">${icon}</span>
        <h4 class="text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors truncate">${interest.name}</h4>
        <p class="text-xs text-slate-500 mt-1 capitalize">${interest.category}</p>
        <button onclick="event.stopPropagation(); toggleFollowInterest('${interest.id}', '${interest.name}', '${interest.category}', this)"
          class="mt-3 w-full text-xs py-1.5 rounded-lg transition-all ${isFollowing 
            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' 
            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600'}">
          ${isFollowing ? '✓ Following' : '+ Follow'}
        </button>
      </div>
    </div>
  `;
}

/**
 * Handle click on suggested interest
 */
function handleInterestClick(id, name, category) {
  if (category === 'sports' && typeof showInterestSubcategories === 'function') {
    showInterestSubcategories(id, name);
  } else {
    // For non-sports, just navigate to interests
    if (typeof navigateTo === 'function') {
      navigateTo('interests');
    }
  }
}

/**
 * Toggle follow on an interest
 */
function toggleFollowInterest(id, name, category, buttonEl) {
  if (typeof handleFollowClick === 'function') {
    handleFollowClick(id, name, 'interest', category, buttonEl);
  } else {
    // Fallback toggle
    const isFollowing = buttonEl.textContent.includes('Following');
    if (isFollowing) {
      buttonEl.innerHTML = '+ Follow';
      buttonEl.className = 'mt-3 w-full text-xs py-1.5 rounded-lg transition-all bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600';
    } else {
      buttonEl.innerHTML = '✓ Following';
      buttonEl.className = 'mt-3 w-full text-xs py-1.5 rounded-lg transition-all bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
    }
  }
}

/**
 * Render trending markets as a slideshow
 */
function renderTrendingSlideshow() {
  const container = document.getElementById('trendingSlideshow');
  const dotsContainer = document.getElementById('trendingDots');
  if (!container) return;
  
  // Sort markets by volume to get "trending" ones, normalize each
  trendingMarketsData = [...markets]
    .map(normalizeMarket)
    .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
    .slice(0, 5);
  
  // Render dots
  if (dotsContainer) {
    dotsContainer.innerHTML = trendingMarketsData.map((_, idx) => `
      <button onclick="goToTrendingSlide(${idx})" 
        class="w-2 h-2 rounded-full transition-all duration-300 ${idx === currentTrendingSlide ? 'bg-yellow-500 w-6' : 'bg-slate-600 hover:bg-slate-500'}">
      </button>
    `).join('');
  }
  
  // Render current slide
  renderCurrentTrendingSlide();
  
  // Auto-advance slides every 8 seconds
  if (!window.trendingSlideInterval) {
    window.trendingSlideInterval = setInterval(() => {
      nextTrendingSlide();
    }, 8000);
  }
}

/**
 * Render the current trending slide
 */
function renderCurrentTrendingSlide() {
  const container = document.getElementById('trendingSlideshow');
  const dotsContainer = document.getElementById('trendingDots');
  if (!container || trendingMarketsData.length === 0) return;
  
  const market = trendingMarketsData[currentTrendingSlide];
  container.innerHTML = createTrendingSlide(market);
  
  // Update dots
  if (dotsContainer) {
    dotsContainer.querySelectorAll('button').forEach((dot, idx) => {
      if (idx === currentTrendingSlide) {
        dot.className = 'w-6 h-2 rounded-full transition-all duration-300 bg-yellow-500';
      } else {
        dot.className = 'w-2 h-2 rounded-full transition-all duration-300 bg-slate-600 hover:bg-slate-500';
      }
    });
  }
}

/**
 * Create a detailed trending slide with graph on left, options on right
 */
function createTrendingSlide(market) {
  const histories = generateMarketHistories(market.id, market.outcomes, 30);
  const mainHistory = histories[0];
  const startProb = mainHistory[0];
  const endProb = mainHistory[mainHistory.length - 1];
  const change = endProb - startProb;
  const isUp = change >= 0;
  
  return `
    <div class="p-6 animate-fadeIn">
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${CATEGORY_COLORS[market.category] || 'from-slate-500 to-slate-600'} text-white">${market.category}</span>
          <span class="text-xs text-green-400 font-medium flex items-center gap-1">
            <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Live
          </span>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-400">Closes</p>
          <p class="text-sm text-white font-medium">${market.closeDate}</p>
        </div>
      </div>
      
      <!-- Title -->
      <h3 class="text-xl font-bold text-white mb-4 cursor-pointer hover:text-yellow-400 transition-colors" onclick="showDetail('${market.id}')">${market.title}</h3>
      
      <!-- Main Content: Graph Left, Options Right -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left: Chart -->
        <div class="bg-slate-800/30 rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-slate-400">30-Day Probability</span>
            <span class="text-sm font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}">
              ${isUp ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}%
            </span>
          </div>
          ${createTrendingChart(market.id, market.outcomes, 400, 160)}
          <!-- Legend -->
          <div class="flex justify-center gap-6 mt-3">
            ${market.outcomes.slice(0, 2).map((outcome, idx) => `
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full" style="background: ${OUTCOME_COLORS[idx].line}"></span>
                <span class="text-xs text-slate-400">${outcome.title}</span>
                <span class="text-xs font-bold" style="color: ${OUTCOME_COLORS[idx].line}">${outcome.probability}%</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Right: Trading Options -->
        <div class="flex flex-col justify-between">
          <!-- Options -->
          <div class="space-y-3 mb-4">
            ${market.outcomes.slice(0, 2).map((outcome, idx) => `
              <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-yellow-500/50 transition-all cursor-pointer group"
                onclick="openPredictionForm('${market.id}', '${outcome.id}')">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="w-4 h-4 rounded-full" style="background: ${OUTCOME_COLORS[idx].line}"></span>
                    <span class="text-white font-medium group-hover:text-yellow-400 transition-colors">${outcome.title}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-2xl font-bold" style="color: ${OUTCOME_COLORS[idx].line}">${(outcome.probability / 100).toFixed(2)}</span>
                  </div>
                </div>
                <div class="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all" style="width: ${outcome.probability}%; background: ${OUTCOME_COLORS[idx].line}"></div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <!-- Stats -->
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-slate-800/30 rounded-lg p-3 text-center">
              <p class="text-xs text-slate-500 mb-1">Volume</p>
              <p class="text-sm font-bold text-yellow-400">$${(market.volume || 0).toLocaleString()}</p>
            </div>
            <div class="bg-slate-800/30 rounded-lg p-3 text-center">
              <p class="text-xs text-slate-500 mb-1">24h</p>
              <p class="text-sm font-bold text-yellow-400">$${(market.volume24h || 0).toLocaleString()}</p>
            </div>
            <div class="bg-slate-800/30 rounded-lg p-3 text-center">
              <p class="text-xs text-slate-500 mb-1">Traders</p>
              <p class="text-sm font-bold text-yellow-400">${(market.traders || 0).toLocaleString()}</p>
            </div>
          </div>
          
          <!-- Trade Button -->
          <button onclick="showDetail('${market.id}')" 
            class="mt-4 w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-950 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
            <span>View Market</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create chart for trending slide
 */
function createTrendingChart(marketId, outcomes, width, height) {
  const histories = generateMarketHistories(marketId, outcomes, 30);
  const gradientDefs = [];
  const areaPaths = [];
  const linePaths = [];
  const dots = [];
  
  outcomes.slice(0, 2).forEach((outcome, idx) => {
    const history = histories[idx];
    const color = OUTCOME_COLORS[idx];
    const gradientId = `trending-grad-${marketId}-${idx}`;
    const currentY = 4 + (height - 8) - (outcome.probability / 100) * (height - 8);
    
    gradientDefs.push(`
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${color.line};stop-opacity:0.2" />
        <stop offset="100%" style="stop-color:${color.line};stop-opacity:0" />
      </linearGradient>
    `);
    
    areaPaths.push(`<path d="${generateAreaPath(history, width, height)}" fill="url(#${gradientId})" />`);
    linePaths.push(`<path d="${generateLinePath(history, width, height)}" fill="none" stroke="${color.line}" stroke-width="2.5" stroke-linecap="round" />`);
    dots.push(`
      <circle cx="${width - 4}" cy="${currentY}" r="4" fill="${color.line}" />
      <circle cx="${width - 4}" cy="${currentY}" r="6" fill="${color.line}" opacity="0.3">
        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" begin="${idx * 0.3}s" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" begin="${idx * 0.3}s" />
      </circle>
    `);
  });
  
  return `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" class="rounded-lg">
      <defs>${gradientDefs.join('')}</defs>
      <!-- Grid lines -->
      <line x1="0" y1="${height * 0.25}" x2="${width}" y2="${height * 0.25}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" />
      <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" />
      <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" />
      ${areaPaths.join('')}
      ${linePaths.join('')}
      ${dots.join('')}
    </svg>
  `;
}

/**
 * Go to next trending slide
 */
function nextTrendingSlide() {
  if (trendingMarketsData.length === 0) return;
  currentTrendingSlide = (currentTrendingSlide + 1) % trendingMarketsData.length;
  renderCurrentTrendingSlide();
}

/**
 * Go to previous trending slide
 */
function prevTrendingSlide() {
  if (trendingMarketsData.length === 0) return;
  currentTrendingSlide = (currentTrendingSlide - 1 + trendingMarketsData.length) % trendingMarketsData.length;
  renderCurrentTrendingSlide();
}

/**
 * Go to specific trending slide
 */
function goToTrendingSlide(index) {
  if (index < 0 || index >= trendingMarketsData.length) return;
  currentTrendingSlide = index;
  renderCurrentTrendingSlide();
}

function createMarketCardHTML(market) {
  return `
    <div class="market-card group relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/10 cursor-pointer rounded-2xl" data-category="${market.category}" onclick="showDetail('${market.id}')">
      <div class="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-600/0 group-hover:from-yellow-500/5 group-hover:to-yellow-600/5 transition-all duration-300"></div>
      <div class="relative p-6">
        <div class="flex items-start justify-between mb-4">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${CATEGORY_COLORS[market.category] || 'from-slate-500 to-slate-600'} text-white">${market.category}</span>
          <span class="text-xs text-green-400 font-medium">🟢 Live</span>
        </div>
        ${createMiniMultiChart(market.id, market.outcomes)}
        <h3 class="text-lg font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors duration-200">${market.title}</h3>
        <p class="text-sm text-slate-400 mb-3 line-clamp-2">${market.description}</p>
        <div class="flex gap-2">
          ${market.outcomes.slice(0, 2).map((outcome, idx) => `
            <button class="flex-1 relative overflow-hidden rounded-lg px-3 py-2 transition-all duration-200 border ${idx === 0 ? 'bg-green-500/10 border-green-500/50 hover:border-green-500 hover:bg-green-500/20' : 'bg-red-500/10 border-red-500/50 hover:border-red-500 hover:bg-red-500/20'} active:scale-95" onclick="event.stopPropagation(); openPredictionForm('${market.id}', '${outcome.id}')">
              <div class="flex flex-col gap-1">
                <span class="text-white font-medium text-xs text-center">${outcome.title}</span>
                <span class="text-lg font-bold text-center ${idx === 0 ? 'text-green-400' : 'text-red-400'}">${(outcome.probability / 100).toFixed(2)}</span>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function showMarkets() {
  hideAllViews();
  document.getElementById('marketsView').classList.remove('hidden');
}

function showDetail(marketId) {
  // Handle both string and numeric IDs
  const market = markets.find(m => String(m.id) === String(marketId));
  if (!market) {
    console.error('Market not found:', marketId);
    return;
  }
  hideAllViews();
  document.getElementById('detailView').classList.remove('hidden');
  // Normalize market to ensure all properties exist
  const normalizedMarket = normalizeMarket(market);
  document.getElementById('detailContent').innerHTML = generateDetailHTML(normalizedMarket);
}

function generateDetailHTML(market) {
  // Ensure market has all expected properties with fallbacks
  const safeMarket = normalizeMarket(market);
  
  return `
    <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 mb-8">
      <!-- Multi-Outcome Probability Chart -->
      <div class="mb-6 rounded-2xl overflow-hidden bg-slate-800/30 p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-white flex items-center gap-2">
            <span>📈</span> Probability History
          </h3>
          <div class="flex gap-2">
            <button class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700">7D</button>
            <button class="px-3 py-1 text-xs rounded-lg bg-yellow-500/20 text-yellow-400">30D</button>
            <button class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700">ALL</button>
          </div>
        </div>
        ${createMultiOutcomeChart(safeMarket.id, safeMarket.outcomes, 600, 220)}
      </div>
      
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-3">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${CATEGORY_COLORS[safeMarket.category] || 'from-slate-500 to-slate-600'} text-white">${safeMarket.category}</span>
            <span class="text-xs text-green-400 font-medium flex items-center gap-1"><span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>Live Trading</span>
          </div>
          <h1 class="text-4xl font-bold text-white mb-4">${safeMarket.title}</h1>
          <p class="text-lg text-slate-300">${safeMarket.description}</p>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div class="bg-slate-800/50 rounded-xl p-4"><p class="text-slate-400 text-sm mb-1">Total Volume</p><p class="text-2xl font-bold text-yellow-400">$${(safeMarket.volume || 0).toLocaleString()}</p></div>
        <div class="bg-slate-800/50 rounded-xl p-4"><p class="text-slate-400 text-sm mb-1">24h Volume</p><p class="text-2xl font-bold text-yellow-400">$${(safeMarket.volume24h || 0).toLocaleString()}</p></div>
        <div class="bg-slate-800/50 rounded-xl p-4"><p class="text-slate-400 text-sm mb-1">Traders</p><p class="text-2xl font-bold text-yellow-400">${(safeMarket.traders || 0).toLocaleString()}</p></div>
        <div class="bg-slate-800/50 rounded-xl p-4"><p class="text-slate-400 text-sm mb-1">Closes</p><p class="text-xl font-bold text-yellow-400">${safeMarket.closeDate || 'TBD'}</p></div>
      </div>
    </div>
    <div class="grid lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-8">
        <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-2"><span style="color: rgb(212, 175, 55);"><svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg></span> Trading Options</h2>
          <div class="space-y-4">
            ${safeMarket.outcomes.map((outcome, idx) => {
              const color = OUTCOME_COLORS[idx] || OUTCOME_COLORS[0];
              const histories = generateMarketHistories(safeMarket.id, safeMarket.outcomes);
              const history = histories[idx];
              const startProb = history[0];
              const endProb = history[history.length - 1];
              const change = endProb - startProb;
              const changeSign = change >= 0 ? '+' : '';
              
              return `
              <div class="bg-slate-800/50 rounded-2xl p-5 border border-slate-700 hover:border-yellow-500/50 transition-all duration-200" style="border-left: 4px solid ${color.line}">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="w-3 h-3 rounded-full" style="background: ${color.line}"></span>
                      <h3 class="text-lg font-semibold text-white">${outcome.title}</h3>
                      <span class="text-xs px-2 py-0.5 rounded" style="background: ${color.fill}; color: ${color.line}">
                        ${changeSign}${change.toFixed(0)}% 30d
                      </span>
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-3xl font-bold" style="color: ${color.line}">${(outcome.probability / 100).toFixed(2)}</span>
                      <span class="text-sm text-slate-400">$${(outcome.stake || 0).toLocaleString()} staked</span>
                    </div>
                  </div>
                  <button onclick="openPredictionForm('${safeMarket.id}', '${outcome.id}')" class="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-950 font-semibold px-4 py-2 rounded-lg transition-all">Trade</button>
                </div>
                <div class="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div class="absolute top-0 left-0 h-full rounded-full transition-all duration-500" style="width: ${outcome.probability}%; background: ${color.line}"></div>
                </div>
                <!-- Individual outcome mini chart -->
                <div class="mt-3 h-12">
                  ${createSingleOutcomeChart(history, color.line, 400, 48)}
                </div>
              </div>
            `}).join('')}
          </div>
        </div>
      </div>
      <div class="space-y-8">
        <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2"><span>📰</span> News</h2>
          <div class="space-y-4">
            ${(safeMarket.news || []).map(item => `
              <div class="bg-slate-800/50 rounded-xl p-4 hover:bg-slate-800/70 transition-colors cursor-pointer">
                <h3 class="text-white font-semibold mb-2 text-sm">${item.title}</h3>
                <div class="flex items-center justify-between text-xs"><span class="text-slate-400">${item.source}</span><span class="text-slate-500">${item.time}</span></div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Outcome Comparison -->
        <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2"><span>⚖️</span> Comparison</h2>
          <div class="space-y-3">
            ${safeMarket.outcomes.map((outcome, idx) => {
              const color = OUTCOME_COLORS[idx] || OUTCOME_COLORS[0];
              return `
                <div class="flex items-center gap-3">
                  <span class="w-3 h-3 rounded-full flex-shrink-0" style="background: ${color.line}"></span>
                  <span class="text-slate-300 text-sm flex-1">${outcome.title}</span>
                  <span class="text-lg font-bold" style="color: ${color.line}">${outcome.probability}%</span>
                </div>
              `;
            }).join('')}
          </div>
          <div class="mt-4 h-4 rounded-full overflow-hidden flex">
            ${safeMarket.outcomes.map((outcome, idx) => {
              const color = OUTCOME_COLORS[idx] || OUTCOME_COLORS[0];
              return `<div class="h-full transition-all" style="width: ${outcome.probability}%; background: ${color.line}"></div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create single outcome chart for detail cards
 */
function createSingleOutcomeChart(history, color, width, height) {
  const linePath = generateLinePath(history, width, height);
  
  return `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" class="opacity-70">
      <path d="${linePath}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" />
    </svg>
  `;
}

function filterMarkets() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('.market-card').forEach(card => {
    const category = card.dataset.category;
    const text = card.textContent.toLowerCase();
    const matchesSearch = text.includes(searchTerm);
    const matchesCategory = currentCategory === 'all' || category === currentCategory;
    card.style.display = (matchesSearch && matchesCategory) ? 'block' : 'none';
  });
}

function filterByCategory(category) {
  currentCategory = category;
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('bg-yellow-500/20', 'text-yellow-400', 'border-yellow-500/50');
    btn.classList.add('text-slate-400', 'border-slate-700');
  });
  event.target.classList.remove('text-slate-400', 'border-slate-700');
  event.target.classList.add('bg-yellow-500/20', 'text-yellow-400', 'border-yellow-500/50');
  filterMarkets();
}
