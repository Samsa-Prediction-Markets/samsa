// ========================================
// SAMSA - MARKETS
// Handles markets page rendering and filtering
// ========================================

// Store generated probability histories for consistency
const probabilityHistories = new Map();

// Outcome colors - Default (used as fallback)
const OUTCOME_COLORS = [
  { line: '#22c55e', fill: 'rgba(34, 197, 94, 0.2)', name: 'Yes' },   // Green
  { line: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)', name: 'No' },    // Red
  { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.2)', name: 'Option C' }, // Blue
  { line: '#f59e0b', fill: 'rgba(245, 158, 11, 0.2)', name: 'Option D' }, // Amber
  { line: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.2)', name: 'Option E' }, // Purple
];

// Binary market colors (Yes/No - Green/Red)
const BINARY_COLORS = [
  { line: '#22c55e', fill: 'rgba(34, 197, 94, 0.2)', name: 'Yes' },   // Green
  { line: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)', name: 'No' },    // Red
];

// Multi-option market colors (varied palette)
const MULTI_COLORS = [
  { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.2)', name: 'Option A' },   // Blue
  { line: '#a855f7', fill: 'rgba(168, 85, 247, 0.2)', name: 'Option B' },   // Purple
  { line: '#f59e0b', fill: 'rgba(245, 158, 11, 0.2)', name: 'Option C' },   // Amber
  { line: '#06b6d4', fill: 'rgba(6, 182, 212, 0.2)', name: 'Option D' },    // Cyan
  { line: '#ec4899', fill: 'rgba(236, 72, 153, 0.2)', name: 'Option E' },   // Pink
];

/**
 * Normalize outcome title - converts "Yes, Banned" → "Yes", "No, Still Operating" → "No"
 * @param {string} title - The outcome title
 * @returns {string} Normalized title
 */
function normalizeOutcomeTitle(title) {
  const lower = title.toLowerCase().trim();
  if (lower === 'yes' || lower.startsWith('yes,') || lower.startsWith('yes ')) {
    return 'Yes';
  }
  if (lower === 'no' || lower.startsWith('no,') || lower.startsWith('no ')) {
    return 'No';
  }
  return title;
}

/**
 * Get the appropriate color palette for a market
 * Only exact "Yes" and "No" titles are considered binary
 */
function getChartColors(market) {
  const titles = market.outcomes.map(o => normalizeOutcomeTitle(o.title).toLowerCase());
  const isBinary = market.outcomes.length === 2 && titles.includes('yes') && titles.includes('no');
  return isBinary ? BINARY_COLORS : MULTI_COLORS;
}

/**
 * Generate random probability history for an outcome
 * For binary markets, generates complementary histories
 * @param {string} cacheKey - Unique cache key
 * @param {number} currentProb - Current probability (0-100)
 * @param {number} points - Number of data points
 * @returns {number[]} Array of probability values (oldest to newest, last value = currentProb)
 */
function generateProbabilityHistory(cacheKey, currentProb, points = 30) {
  if (probabilityHistories.has(cacheKey)) {
    return probabilityHistories.get(cacheKey);
  }

  const history = [];
  let prob = currentProb;

  // Build history backwards from current probability
  // Start with current, then generate older values
  for (let i = 0; i < points; i++) {
    if (i === 0) {
      // Most recent point (will be at end of array) = current probability
      history.unshift(currentProb);
    } else {
      // Generate older data points with some variance
      const change = (Math.random() - 0.5) * 8;
      const meanReversion = (50 - prob) * 0.02;
      prob = Math.max(5, Math.min(95, prob - change + meanReversion));
      history.unshift(Math.round(prob));
    }
  }

  // Ensure the last point (rightmost on graph) equals the current probability
  history[history.length - 1] = currentProb;

  probabilityHistories.set(cacheKey, history);
  return history;
}

/**
 * Generate histories for all outcomes in a market
 * Binary markets have complementary probabilities (Yes + No = 100)
 * Ensures the last value in each history matches the displayed probability
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
    // Ensure the last point matches the actual outcome probability
    complementHistory[complementHistory.length - 1] = outcomes[1].probability;
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
 * Uses different color schemes for binary vs multi-option markets
 */
function createMultiOutcomeChart(marketId, outcomes, width = 300, height = 120) {
  // Normalize and check for binary (handles "Yes, Banned" / "No, Still Operating")
  const titles = outcomes.map(o => normalizeOutcomeTitle(o.title).toLowerCase());
  const isBinary = outcomes.length === 2 && titles.includes('yes') && titles.includes('no');
  const colorPalette = isBinary ? BINARY_COLORS : MULTI_COLORS;

  // Empty state legend
  const legend = outcomes.map((outcome, idx) => {
    const color = colorPalette[idx % colorPalette.length];
    return `
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full" style="background: ${color.line}"></span>
        <span class="text-xs text-white font-medium">${normalizeOutcomeTitle(outcome.title)}</span>
        <span class="text-xs font-bold text-slate-500">--¢</span>
      </div>
    `;
  });

  return `
    <div class="relative">
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" class="rounded-xl">
        <!-- Grid lines -->
        <line x1="0" y1="${height * 0.25}" x2="${width}" y2="${height * 0.25}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" />
        <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" />
        <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" />
        <!-- Empty state message -->
        <text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#64748b" font-size="12">No trading data yet</text>
      </svg>
      <!-- Y-axis labels -->
      <div class="absolute left-1 top-1 text-[10px] text-slate-500">100¢</div>
      <div class="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">50¢</div>
      <div class="absolute left-1 bottom-1 text-[10px] text-slate-500">0¢</div>
      <!-- Legend -->
      <div class="flex flex-wrap gap-4 mt-2 justify-center">
        ${legend.join('')}
      </div>
    </div>
  `;
}

/**
 * Create mini multi-outcome chart for cards
 * Uses different color schemes for binary vs multi-option markets
 */
function createMiniMultiChart(marketId, outcomes) {
  const width = 280;
  const height = 70;

  // Normalize and check for binary (handles "Yes, Banned" / "No, Still Operating")
  const titles = outcomes.map(o => normalizeOutcomeTitle(o.title).toLowerCase());
  const isBinary = outcomes.length === 2 && titles.includes('yes') && titles.includes('no');
  const colorPalette = isBinary ? BINARY_COLORS : MULTI_COLORS;

  // For multi-option, show up to 4 lines; for binary, show 2
  const displayCount = isBinary ? 2 : Math.min(outcomes.length, 4);

  // Empty state legends
  const legends = outcomes.slice(0, displayCount).map((outcome, idx) => {
    const color = colorPalette[idx % colorPalette.length];
    return `
      <div class="flex items-center gap-1">
        <span class="w-2 h-2 rounded-full" style="background: ${color.line}"></span>
        <span class="text-xs" style="color: ${color.line}">${normalizeOutcomeTitle(outcome.title)}</span>
        <span class="text-xs text-slate-500">--¢</span>
      </div>
    `;
  });

  return `
    <div class="rounded-xl overflow-hidden bg-slate-800/30">
      <div class="flex items-center justify-between px-3 py-2">
        <span class="text-xs text-slate-500">30d Trend</span>
        <div class="flex flex-wrap gap-2 justify-end">
          ${legends.join('')}
        </div>
      </div>
      <svg class="w-full" style="aspect-ratio: ${width} / ${height};" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <!-- Grid -->
        <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="#334155" stroke-width="0.5" stroke-dasharray="2,2" />
        <!-- Empty state - no data -->
        <text x="${width / 2}" y="${height / 2 + 4}" text-anchor="middle" fill="#64748b" font-size="10">No trading data</text>
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

  // Always try to fetch markets from API first
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
    console.log('⚠️ API not available, loading from local JSON file:', error.message);

    // Fallback: Load from local JSON file
    if (markets.length === 0) {
      try {
        const localResponse = await fetch('data/markets.json');
        if (localResponse.ok) {
          const localMarkets = await localResponse.json();
          if (localMarkets && localMarkets.length > 0) {
            markets = localMarkets.map(normalizeMarket);
            console.log(`✅ Loaded ${localMarkets.length} markets from local JSON`);
          }
        }
      } catch (localError) {
        console.log('⚠️ Could not load local markets:', localError.message);
      }
    }
  }

  grid.innerHTML = markets.map(market => createMarketCardHTML(normalizeMarket(market))).join('');

  // Also render trending slideshow
  renderTrendingSlideshow();

  // Render suggested interests
  renderSuggestedInterests();
}

/**
 * Fetch current event markets from the API
 * These are timely markets closing soon with high relevance
 */
async function fetchCurrentEventMarkets() {
  try {
    const response = await fetch('http://localhost:3001/api/markets/current-events');
    if (response.ok) {
      const currentMarkets = await response.json();
      console.log(`✅ Loaded ${currentMarkets.length} current event markets`);
      return currentMarkets.map(normalizeMarket);
    }
  } catch (error) {
    console.log('⚠️ Could not fetch current events:', error.message);
  }
  return [];
}

/**
 * Fetch trending markets from the API
 */
async function fetchTrendingMarkets(limit = 5) {
  try {
    const response = await fetch(`http://localhost:3001/api/markets/trending?limit=${limit}`);
    if (response.ok) {
      const trending = await response.json();
      return trending.map(normalizeMarket);
    }
  } catch (error) {
    console.log('⚠️ Could not fetch trending markets:', error.message);
  }
  return [];
}

/**
 * Fetch markets by category
 */
async function fetchMarketsByCategory(category) {
  try {
    const response = await fetch(`http://localhost:3001/api/markets/category/${category}`);
    if (response.ok) {
      const categoryMarkets = await response.json();
      return categoryMarkets.map(normalizeMarket);
    }
  } catch (error) {
    console.log(`⚠️ Could not fetch ${category} markets:`, error.message);
  }
  return [];
}

/**
 * Get market suggestions for creating new markets
 */
async function fetchMarketSuggestions() {
  try {
    const response = await fetch('http://localhost:3001/api/markets/suggestions');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.log('⚠️ Could not fetch market suggestions:', error.message);
  }
  return [];
}

/**
 * Create a new market via the API
 */
async function createNewMarket(marketData) {
  try {
    const response = await fetch('http://localhost:3001/api/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(marketData)
    });

    if (response.ok) {
      const newMarket = await response.json();
      console.log('✅ Created new market:', newMarket.title);
      // Refresh markets display
      await renderMarkets();
      return newMarket;
    } else {
      const error = await response.json();
      console.error('❌ Failed to create market:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating market:', error.message);
    return null;
  }
}

/**
 * Get markets closing soon (within next 30 days)
 */
function getMarketsClosingSoon() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return markets
    .filter(m => {
      if (!m.closeDate && !m.close_date) return false;
      const closeDate = new Date(m.closeDate || m.close_date);
      return closeDate > now && closeDate <= thirtyDaysFromNow;
    })
    .sort((a, b) => {
      const aClose = new Date(a.closeDate || a.close_date);
      const bClose = new Date(b.closeDate || b.close_date);
      return aClose - bClose;
    });
}

/**
 * Get hot markets (high volume in the last 24h)
 */
function getHotMarkets(limit = 5) {
  return [...markets]
    .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
    .slice(0, limit);
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
 * Handle watchlist button click on market cards
 */
async function handleWatchlistClick(marketId, marketTitle, category, buttonEl) {
  if (typeof toggleWatchlist === 'function') {
    const isNowWatchlisted = await toggleWatchlist(marketId, marketTitle, category);

    // Update the button
    if (isNowWatchlisted) {
      buttonEl.innerHTML = '★';
      buttonEl.classList.remove('text-slate-500', 'hover:text-amber-400');
      buttonEl.classList.add('text-amber-400', 'hover:text-amber-300');
      buttonEl.title = 'Remove from watchlist';
    } else {
      buttonEl.innerHTML = '☆';
      buttonEl.classList.remove('text-amber-400', 'hover:text-amber-300');
      buttonEl.classList.add('text-slate-500', 'hover:text-amber-400');
      buttonEl.title = 'Add to watchlist';
    }

    // Update all other buttons for this market (in case it appears multiple places)
    if (typeof updateWatchlistButtons === 'function') {
      updateWatchlistButtons(marketId, isNowWatchlisted);
    }
  }
}

// Make watchlist handler globally available
window.handleWatchlistClick = handleWatchlistClick;

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

  // Auto-advance slides every 8 seconds (disabled for now)
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
 * Uses market card-style outcome buttons
 */
function createTrendingSlide(market) {
  const isBinary = isBinaryMarket(market);
  const typeLabel = getMarketTypeLabel(market);

  // Generate trading options using market card-style buttons
  let tradingOptions;

  if (isBinary) {
    // Binary: Show Yes/No with market card-style green/red buttons
    tradingOptions = `
      <div class="flex gap-2">
        ${market.outcomes.slice(0, 2).map((outcome, idx) => `
          <button class="flex-1 relative overflow-hidden rounded-lg px-3 py-2 transition-all duration-200 border ${idx === 0 ? 'bg-green-500/10 border-green-500/50 hover:border-green-500 hover:bg-green-500/20' : 'bg-red-500/10 border-red-500/50 hover:border-red-500 hover:bg-red-500/20'} active:scale-95" onclick="event.stopPropagation(); openPredictionForm('${market.id}', '${outcome.id}')">
            <div class="flex flex-col gap-1">
              <span class="text-white font-medium text-xs text-center">${normalizeOutcomeTitle(outcome.title)}</span>
              <span class="text-lg font-bold text-center ${idx === 0 ? 'text-green-400' : 'text-red-400'}">--¢</span>
            </div>
          </button>
        `).join('')}
      </div>
    `;
  } else {
    // Multi-option: Show options with market card-style grid
    const displayOutcomes = market.outcomes.slice(0, 4);
    const hasMore = market.outcomes.length > 4;

    tradingOptions = `
      <div class="w-full flex flex-wrap gap-2">
        ${displayOutcomes.map((outcome, idx) => {
      const colors = MULTI_OPTION_COLORS[idx % MULTI_OPTION_COLORS.length];
      return `
            <button class="w-[calc(50%-4px)] relative overflow-hidden rounded-lg px-3 py-2 transition-all duration-200 border ${colors.bg} ${colors.border} ${colors.hover} active:scale-[0.98] flex flex-col items-center justify-center" onclick="event.stopPropagation(); openPredictionForm('${market.id}', '${outcome.id}')">
              <span class="text-white font-medium text-xs truncate text-center w-full">${normalizeOutcomeTitle(outcome.title)}</span>
              <span class="text-lg font-bold ${colors.text}">--¢</span>
            </button>
          `;
    }).join('')}
        ${hasMore ? `<p class="w-full text-xs text-slate-500 text-center mt-1">+${market.outcomes.length - 4} more options</p>` : ''}
      </div>
    `;
  }

  const isInWatchlist = typeof isWatchlisted === 'function' ? isWatchlisted(market.id) : false;
  const watchlistIcon = isInWatchlist ? '★' : '☆';
  const watchlistClass = isInWatchlist ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-amber-400';

  return `
    <div class="p-6 animate-fadeIn">
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${CATEGORY_COLORS[market.category] || 'from-slate-500 to-slate-600'} text-white">${market.category}</span>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${typeLabel.class}">
            <span>${typeLabel.icon}</span>
            <span>${typeLabel.text}</span>
          </span>
          <span class="text-xs text-green-400 font-medium flex items-center gap-1">
            <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Live
          </span>
        </div>
        <div class="flex items-center gap-3">
          <button onclick="event.stopPropagation(); handleWatchlistClick('${market.id}', '${market.title.replace(/'/g, "\\'")}', '${market.category}', this)"
            data-watchlist-id="${market.id}"
            class="text-xl transition-colors ${watchlistClass}"
            title="${isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}">
            ${watchlistIcon}
          </button>
          <div class="text-right">
            <p class="text-xs text-slate-400">Closes</p>
            <p class="text-sm text-white font-medium">${market.closeDate}</p>
          </div>
        </div>
      </div>
      
      <!-- Title -->
      <h3 class="text-xl font-bold text-white mb-4 cursor-pointer hover:text-yellow-400 transition-colors" onclick="showDetail('${market.id}')">${market.title}</h3>
      
      <!-- Main Content: Graph Left, Options Right -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left: Chart -->
        <div class="bg-slate-800/30 rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-slate-400">30-Day Price</span>
            <span class="text-sm font-semibold text-slate-500">--</span>
          </div>
          ${createTrendingChart(market.id, market.outcomes, 400, 160)}
          <!-- Legend -->
          <div class="flex flex-wrap justify-center gap-4 mt-3">
            ${market.outcomes.slice(0, isBinary ? 2 : 4).map((outcome, idx) => `
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" style="background: ${OUTCOME_COLORS[idx]?.line || '#3b82f6'}"></span>
                <span class="text-xs text-slate-400 truncate max-w-[80px]">${normalizeOutcomeTitle(outcome.title)}</span>
                <span class="text-xs font-bold text-slate-500">--¢</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Right: Trading Options -->
        <div class="flex flex-col justify-between">
          <!-- Options -->
          <div class="mb-4">
            ${tradingOptions}
          </div>
          
          <!-- Stats -->
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-slate-800/30 rounded-lg p-3 text-center">
              <p class="text-xs text-slate-500 mb-1">Volume</p>
              <p class="text-sm font-bold text-yellow-400">$0</p>
            </div>
            <div class="bg-slate-800/30 rounded-lg p-3 text-center">
              <p class="text-xs text-slate-500 mb-1">24h</p>
              <p class="text-sm font-bold text-yellow-400">$0</p>
            </div>
            <div class="bg-slate-800/30 rounded-lg p-3 text-center">
              <p class="text-xs text-slate-500 mb-1">Traders</p>
              <p class="text-sm font-bold text-yellow-400">0</p>
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
 * Create chart for trending slide - empty state
 */
function createTrendingChart(marketId, outcomes, width, height) {
  return `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" class="rounded-lg">
      <!-- Grid lines -->
      <line x1="0" y1="${height * 0.25}" x2="${width}" y2="${height * 0.25}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" />
      <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" />
      <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" />
      <!-- Empty state message -->
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#64748b" font-size="12">No trading data yet</text>
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

/**
 * Check if a market is binary (Yes/No style) vs multi-option
 * Only matches exact "Yes" and "No" titles
 */
function isBinaryMarket(market) {
  if (market.outcomes.length !== 2) return false;
  const titles = market.outcomes.map(o => normalizeOutcomeTitle(o.title).toLowerCase());
  // Match normalized "yes" and "no" (handles "Yes, Banned" / "No, Still Operating")
  return titles.includes('yes') && titles.includes('no');
}

/**
 * Get market type label
 */
function getMarketTypeLabel(market) {
  if (isBinaryMarket(market)) {
    return { text: 'Binary', icon: '⚖️', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  }
  return { text: `${market.outcomes.length} Options`, icon: '📊', class: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
}

/**
 * Multi-option colors for non-binary markets
 */
const MULTI_OPTION_COLORS = [
  { bg: 'bg-blue-500/10', border: 'border-blue-500/50', hover: 'hover:border-blue-500 hover:bg-blue-500/20', text: 'text-blue-400' },
  { bg: 'bg-purple-500/10', border: 'border-purple-500/50', hover: 'hover:border-purple-500 hover:bg-purple-500/20', text: 'text-purple-400' },
  { bg: 'bg-amber-500/10', border: 'border-amber-500/50', hover: 'hover:border-amber-500 hover:bg-amber-500/20', text: 'text-amber-400' },
  { bg: 'bg-cyan-500/10', border: 'border-cyan-500/50', hover: 'hover:border-cyan-500 hover:bg-cyan-500/20', text: 'text-cyan-400' },
  { bg: 'bg-pink-500/10', border: 'border-pink-500/50', hover: 'hover:border-pink-500 hover:bg-pink-500/20', text: 'text-pink-400' },
];

function createMarketCardHTML(market) {
  const isBinary = isBinaryMarket(market);
  const typeLabel = getMarketTypeLabel(market);

  // Generate outcome buttons based on market type
  let outcomeButtons;

  if (isBinary) {
    // Binary market: Show Yes/No with green/red styling
    outcomeButtons = market.outcomes.slice(0, 2).map((outcome, idx) => `
      <button class="flex-1 relative overflow-hidden rounded-lg px-3 py-2 transition-all duration-200 border ${idx === 0 ? 'bg-green-500/10 border-green-500/50 hover:border-green-500 hover:bg-green-500/20' : 'bg-red-500/10 border-red-500/50 hover:border-red-500 hover:bg-red-500/20'} active:scale-95" onclick="event.stopPropagation(); openPredictionForm('${market.id}', '${outcome.id}')">
        <div class="flex flex-col gap-1">
          <span class="text-white font-medium text-xs text-center">${normalizeOutcomeTitle(outcome.title)}</span>
          <span class="text-lg font-bold text-center ${idx === 0 ? 'text-green-400' : 'text-red-400'}">--¢</span>
        </div>
      </button>
    `).join('');
  } else {
    // Multi-option market: Show top options with varied colors
    const displayOutcomes = market.outcomes.slice(0, 4); // Show up to 4 options
    const hasMore = market.outcomes.length > 4;

    outcomeButtons = `
      <div class="w-full flex flex-wrap gap-2">
        ${displayOutcomes.map((outcome, idx) => {
      const colors = MULTI_OPTION_COLORS[idx % MULTI_OPTION_COLORS.length];
      return `
            <button class="w-[calc(50%-4px)] relative overflow-hidden rounded-lg px-3 py-2 transition-all duration-200 border ${colors.bg} ${colors.border} ${colors.hover} active:scale-[0.98] flex flex-col items-center justify-center" onclick="event.stopPropagation(); openPredictionForm('${market.id}', '${outcome.id}')">
              <span class="text-white font-medium text-xs truncate text-center w-full">${normalizeOutcomeTitle(outcome.title)}</span>
              <span class="text-lg font-bold ${colors.text}">--¢</span>
            </button>
          `;
    }).join('')}
        ${hasMore ? `<p class="w-full text-xs text-slate-500 text-center mt-1">+${market.outcomes.length - 4} more options</p>` : ''}
      </div>
    `;
  }

  const isInWatchlist = typeof isWatchlisted === 'function' ? isWatchlisted(market.id) : false;
  const watchlistIcon = isInWatchlist ? '★' : '☆';
  const watchlistClass = isInWatchlist ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-amber-400';

  return `
    <div class="market-card group relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/10 cursor-pointer rounded-2xl grid" data-category="${market.category}" data-type="${isBinary ? 'binary' : 'multi'}" onclick="showDetail('${market.id}')">
      <div class="[grid-area:1/1] bg-gradient-to-br from-yellow-500/0 to-yellow-600/0 group-hover:from-yellow-500/5 group-hover:to-yellow-600/5 transition-all duration-300"></div>
      <div class="[grid-area:1/1] p-4 flex flex-col gap-2 z-10">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${CATEGORY_COLORS[market.category] || 'from-slate-500 to-slate-600'} text-white">${market.category}</span>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${typeLabel.class}">
              <span>${typeLabel.icon}</span>
              <span>${typeLabel.text}</span>
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="event.stopPropagation(); handleWatchlistClick('${market.id}', '${market.title.replace(/'/g, "\\'")}', '${market.category}', this)"
              data-watchlist-id="${market.id}"
              class="text-lg transition-colors ${watchlistClass}"
              title="${isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}">
              ${watchlistIcon}
            </button>
            <span class="text-xs text-green-400 font-medium">🟢 Live</span>
          </div>
        </div>
        ${createMiniMultiChart(market.id, market.outcomes)}
        <h3 class="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors duration-200">${market.title}</h3>
        <p class="text-sm text-slate-400 line-clamp-2">${market.description}</p>
        <div class="flex gap-2">
          ${outcomeButtons}
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
  const isBinary = isBinaryMarket(safeMarket);
  const typeLabel = getMarketTypeLabel(safeMarket);
  const isInWatchlist = typeof isWatchlisted === 'function' ? isWatchlisted(safeMarket.id) : false;
  const watchlistIcon = isInWatchlist ? '★' : '☆';

  // Generate histories for price changes
  const histories = generateMarketHistories(safeMarket.id, safeMarket.outcomes);

  // Calculate time remaining
  const closeDate = safeMarket.closeDate || 'TBD';

  return `
    <!-- Kalshi-style Market Detail Page -->
    <div class="max-w-7xl mx-auto">
      
      <!-- Header Section -->
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-3">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${CATEGORY_COLORS[safeMarket.category] || 'from-slate-500 to-slate-600'} text-white">${safeMarket.category}</span>
          <span class="flex items-center gap-1.5 text-xs text-green-400 font-medium">
            <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Open
          </span>
        </div>
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">${safeMarket.title}</h1>
        <p class="text-slate-400 text-sm md:text-base">${safeMarket.description}</p>
      </div>

      <!-- Main Two-Column Layout -->
      <div class="flex flex-col lg:flex-row gap-6">
        
        <!-- Left Column: Chart & Info -->
        <div class="flex-1 min-w-0 space-y-4">
          
          <!-- Price Chart Card -->
          <div class="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div class="flex items-center gap-4">
                <span class="text-white font-semibold">Price</span>
                <div class="flex gap-1">
                  <button class="px-3 py-1 text-xs rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">1H</button>
                  <button class="px-3 py-1 text-xs rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">24H</button>
                  <button class="px-3 py-1 text-xs rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">7D</button>
                  <button class="px-3 py-1 text-xs rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">30D</button>
                  <button class="px-3 py-1 text-xs rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">ALL</button>
                </div>
              </div>
              <button onclick="handleWatchlistClick('${safeMarket.id}', '${safeMarket.title.replace(/'/g, "\\'")}', '${safeMarket.category}', this)"
                data-watchlist-id="${safeMarket.id}"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${isInWatchlist ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400 hover:text-amber-400'}"
                title="${isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}">
                <span>${watchlistIcon}</span>
                <span class="hidden sm:inline">${isInWatchlist ? 'Saved' : 'Save'}</span>
              </button>
            </div>
            <div class="p-4">
              ${createMultiOutcomeChart(safeMarket.id, safeMarket.outcomes, 600, 220)}
            </div>
          </div>

          <!-- Trading Options -->
          <div class="text-sm text-slate-400 mb-2">Select an outcome to trade</div>
          <div id="outcomeButtonsGrid" class="grid grid-cols-2 gap-3">
            ${isBinary ?
      safeMarket.outcomes.map((outcome, idx) => {
        const isYes = idx === 0;
        return `
                  <button id="outcomeBtn-${outcome.id}" onclick="showInlineTradingForm('${safeMarket.id}', '${outcome.id}')" 
                    class="outcome-btn flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${isYes ? 'border-green-500/50 bg-green-500/10 hover:border-green-500 hover:bg-green-500/20' : 'border-red-500/50 bg-red-500/10 hover:border-red-500 hover:bg-red-500/20'}">
                    <span class="text-white font-medium mb-1">${normalizeOutcomeTitle(outcome.title)}</span>
                    <span class="text-2xl font-bold ${isYes ? 'text-green-400' : 'text-red-400'}">--¢</span>
                  </button>
                `;
      }).join('')
      :
      safeMarket.outcomes.map((outcome, idx) => {
        const multiColor = MULTI_OPTION_COLORS[idx % MULTI_OPTION_COLORS.length];
        return `
                  <button id="outcomeBtn-${outcome.id}" onclick="showInlineTradingForm('${safeMarket.id}', '${outcome.id}')" 
                    class="outcome-btn flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${multiColor.border} ${multiColor.bg} ${multiColor.hover}">
                    <span class="text-white font-medium mb-1">${normalizeOutcomeTitle(outcome.title)}</span>
                    <span class="text-2xl font-bold ${multiColor.text}">--¢</span>
                  </button>
                `;
      }).join('')
    }
          </div>

          <!-- Rules Summary -->
          <div class="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-800">
              <span class="text-white font-semibold">Rules Summary</span>
            </div>
            <div class="p-4 text-sm">
              <p class="text-slate-300 leading-relaxed">
                This <span class="text-white font-medium capitalize">${safeMarket.category}</span> market is a <span class="text-white font-medium">${isBinary ? 'binary (Yes/No)' : 'multi-outcome (' + safeMarket.outcomes.length + ' options)'}</span> prediction market that closes on <span class="text-white font-medium">${closeDate}</span>. The market will be resolved based on official sources and verified reports. Once closed, winning positions will be paid out according to the settlement rules.
              </p>
            </div>
          </div>

          <!-- How It Works - LMSR Model -->
          <div class="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-800">
              <span class="text-white font-semibold">How It Works</span>
            </div>
            <div class="p-4 text-sm space-y-4">
              <p class="text-slate-300 leading-relaxed">
                This market uses the <span class="text-yellow-400 font-medium">Logarithmic Market Scoring Rule (LMSR)</span> with a rebated-risk model. Prices between 0¢ and 100¢ represent the market's estimated probability for each outcome. When you place a trade, your potential profit is proportional to the risk you take—betting on lower probability outcomes yields higher returns if correct.
              </p>
              <p class="text-slate-300 leading-relaxed">
                <span class="text-green-400 font-medium">If you win</span>, your profit equals your stake multiplied by (1 − probability), minus a 1% platform fee. <span class="text-red-400 font-medium">If you lose</span>, you receive a partial refund equal to your stake multiplied by the probability at the time of your trade. This rebate system means you never lose your entire stake—you always get back a portion based on the odds.
              </p>
              <p class="text-slate-400 leading-relaxed text-xs">
                For example, a $100 trade at 40% probability would return $159.40 total (including $59.40 profit) if correct, or a $40 refund if incorrect. The higher the risk, the higher the potential reward.
              </p>
            </div>
          </div>
        </div>

        <!-- Right Column: Sidebar (Sticky) -->
        <div class="lg:w-[340px] flex-shrink-0">
          <div class="lg:sticky lg:top-4 space-y-4">

            <!-- Inline Trading Form Container (shown when outcome is selected) -->
            <div id="inlineTradingForm" class="hidden"></div>

            <!-- Stats Card -->
            <div id="statsCard" class="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
              <div class="px-4 py-3 border-b border-slate-800">
                <span class="text-white font-semibold text-sm">Market Stats</span>
              </div>
              <div class="p-4 space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-slate-500 text-sm">Volume</span>
                  <span class="text-white font-semibold">$0</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-500 text-sm">24h Volume</span>
                  <span class="text-white font-semibold">$0</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-500 text-sm">Traders</span>
                  <span class="text-white font-semibold">0</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-500 text-sm">Liquidity</span>
                  <span class="text-white font-semibold">$0</span>
                </div>
              </div>
            </div>

            <!-- Outcome Breakdown -->
            <div class="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
              <div class="px-4 py-3 border-b border-slate-800">
                <span class="text-white font-semibold text-sm">Probability</span>
              </div>
              <div class="p-4">
                <!-- Stacked bar -->
                <div class="h-3 rounded-full overflow-hidden flex mb-4 bg-slate-700">
                  ${safeMarket.outcomes.map((outcome, idx) => {
      const color = OUTCOME_COLORS[idx] || OUTCOME_COLORS[0];
      const width = 100 / safeMarket.outcomes.length;
      return `<div class="h-full transition-all" style="width: ${width}%; background: ${color.line}; opacity: 0.3"></div>`;
    }).join('')}
                </div>
                <!-- Legend -->
                <div class="space-y-2">
                  ${safeMarket.outcomes.map((outcome, idx) => {
      const color = OUTCOME_COLORS[idx] || OUTCOME_COLORS[0];
      return `
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full" style="background: ${color.line}"></span>
                          <span class="text-slate-300 text-sm">${normalizeOutcomeTitle(outcome.title)}</span>
                        </div>
                        <span class="font-semibold text-sm text-slate-500">--%</span>
                      </div>
                    `;
    }).join('')}
                </div>
              </div>
            </div>

            <!-- Related News -->
            <div class="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
              <div class="px-4 py-3 border-b border-slate-800">
                <span class="text-white font-semibold">Related News</span>
              </div>
              <div class="divide-y divide-slate-800">
                ${(safeMarket.news || []).map(item => `
                  <div class="px-4 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer">
                    <h4 class="text-white text-sm font-medium mb-1">${item.title}</h4>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                      <span>${item.source}</span>
                      <span>•</span>
                      <span>${item.time}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

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

  // Update category button states
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('bg-yellow-500/20', 'text-yellow-400', 'border-yellow-500/50');
    btn.classList.add('text-slate-400', 'border-slate-700');

    // Highlight the matching category button
    if (btn.dataset.category === category) {
      btn.classList.remove('text-slate-400', 'border-slate-700');
      btn.classList.add('bg-yellow-500/20', 'text-yellow-400', 'border-yellow-500/50');
    }
  });

  filterMarkets();
}

// Make filterByCategory globally available for sidebar
window.filterByCategory = filterByCategory;
