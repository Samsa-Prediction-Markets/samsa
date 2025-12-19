// ============================================================================
// SAMSA PREDICTION MARKETS - CORE MODULE
// Consolidated configuration, state, utilities, and API
// ============================================================================

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  API_URL: 'http://localhost:3001/api',
  CACHE_TTL: 5 * 60 * 1000,
  STORAGE_PREFIX: 'samsa_',
  PLATFORM_FEE: 0.01
};

// Sports & Categories
const SPORTS = [
  { id: 'Q2736', name: 'Soccer', icon: '⚽' },
  { id: 'Q5372', name: 'Basketball', icon: '🏀' },
  { id: 'Q847', name: 'Tennis', icon: '🎾' },
  { id: 'Q5369', name: 'Baseball', icon: '⚾' },
  { id: 'Q1734', name: 'Volleyball', icon: '🏐' },
  { id: 'Q5375', name: 'Cricket', icon: '🏏' },
  { id: 'Q41323', name: 'American Football', icon: '🏈' },
  { id: 'Q41466', name: 'Ice Hockey', icon: '🏒' },
  { id: 'Q5377', name: 'Golf', icon: '⛳' },
  { id: 'Q32112', name: 'Combat', icon: '🥊' },
  { id: 'AUTO_RACING', name: 'Auto Racing', icon: '🏎️' },
  { id: 'Q3609', name: 'Cycling', icon: '🚴' },
  { id: 'Q5849', name: 'Rugby', icon: '🏉' },
  { id: 'MULTI_SPORTS', name: 'Multi-Sports', icon: '🏆' },
  { id: 'HANDBALL', name: 'Handball', icon: '🤾' },
  { id: 'LACROSSE', name: 'Lacrosse', icon: '🥍' },
  { id: 'SOFTBALL', name: 'Softball', icon: '🥎' }
];

const SPORT_MAPPINGS = {
  'soccer': 'Q2736', 'football': 'Q2736', 'basketball': 'Q5372', 'tennis': 'Q847',
  'baseball': 'Q5369', 'volleyball': 'Q1734', 'cricket': 'Q5375',
  'american football': 'Q41323', 'ice hockey': 'Q41466', 'golf': 'Q5377',
  'boxing': 'Q32112', 'mma': 'Q32112', 'wrestling': 'Q32112',
  'auto racing': 'AUTO_RACING', 'f1': 'AUTO_RACING', 'nascar': 'AUTO_RACING',
  'cycling': 'Q3609', 'rugby': 'Q5849'
};

const TOPICS = {
  politics: [
    { id: 'Q7188', name: 'Government', icon: '🏛️' },
    { id: 'Q179805', name: 'Political Ideology', icon: '💭' },
    { id: 'Q82955', name: 'Political Actors', icon: '👥' },
    { id: 'Q7163', name: 'Political Issues', icon: '⚖️' },
    { id: 'Q11033', name: 'Mass Media', icon: '📰' },
    { id: 'Q198', name: 'Global Issues', icon: '🌍' },
    { id: 'USCON', name: 'Congress', icon: '🏛️' },
    { id: 'USPRES', name: 'White House', icon: '🏛️' },
    { id: 'USSC', name: 'Supreme Court', icon: '⚖️', categories: ['law'] },
    { id: 'USELEC', name: 'US Elections', icon: '🗳️' },
    { id: 'USLEG', name: 'Legislation', icon: '📜', categories: ['law'] },
    { id: 'USFED', name: 'Federal Reserve', icon: '🏦', categories: ['finance'] },
    { id: 'USIMM', name: 'Immigration', icon: '🛂', categories: ['social'] },
    { id: 'USGOV', name: 'State Governors', icon: '🏛️' }
  ],
  international: [
    { id: 'Q1065', name: 'United Nations', icon: '🇺🇳' },
    { id: 'Q7184', name: 'NATO', icon: '🛡️' },
    { id: 'Q458', name: 'European Union', icon: '🇪🇺' },
    { id: 'Q8142', name: 'Global Trade', icon: '💱' },
    { id: 'Q8458', name: 'Human Rights', icon: '⚖️' },
    { id: 'Q131569', name: 'International Treaty', icon: '📜' },
    { id: 'Q7283', name: 'Conflicts', icon: '💣' }
  ],
  finance: [
    { id: 'Q8142', name: 'Stock Markets', icon: '📈' },
    { id: 'Q1369352', name: 'Cryptocurrencies', icon: '₿', categories: ['technology'] },
    { id: 'Q192296', name: 'Real Estate', icon: '🏠' },
    { id: 'Q860861', name: 'Commodities', icon: '🛢️' },
    { id: 'USBANK', name: 'Banking', icon: '🏦', categories: ['economics'] },
    { id: 'USTAX', name: 'Taxation', icon: '💵', categories: ['politics', 'economics'] }
  ],
  environment: [
    { id: 'Q183129', name: 'Conservation', icon: '🌳' },
    { id: 'Q11023', name: 'Renewable Energy', icon: '🔋', categories: ['technology', 'climate'] },
    { id: 'Q7918', name: 'Biodiversity', icon: '🦎', categories: ['science'] },
    { id: 'Q830077', name: 'Sustainable Development', icon: '♻️', categories: ['economics'] },
    { id: 'Q51908', name: 'Environmental Policy', icon: '📋', categories: ['politics'] }
  ],
  climate: [
    { id: 'Q7937', name: 'Global Warming', icon: '🌡️', categories: ['science', 'environment'] },
    { id: 'Q125928', name: 'Carbon Emissions', icon: '💨', categories: ['environment'] },
    { id: 'Q1322263', name: 'Climate Agreements', icon: '📄', categories: ['politics', 'international'] },
    { id: 'Q124441', name: 'Climate Change Impacts', icon: '🌊', categories: ['environment', 'science'] }
  ],
  science: [
    { id: 'Q12483', name: 'Space Exploration', icon: '🚀', categories: ['technology'] },
    { id: 'Q11190', name: 'Medicine', icon: '💊', categories: ['health'] },
    { id: 'Q420', name: 'Biology', icon: '🧬' },
    { id: 'Q47258', name: 'Genetics', icon: '🧬', categories: ['health', 'technology'] },
    { id: 'Q11016', name: 'Artificial Intelligence', icon: '🤖', categories: ['technology'] }
  ],
  health: [
    { id: 'Q11190', name: 'Medicine', icon: '💊', categories: ['science'] },
    { id: 'Q1928478', name: 'Vaccine', icon: '💉', categories: ['science'] },
    { id: 'Q12136', name: 'Disease', icon: '🦠', categories: ['science'] },
    { id: 'Q3391743', name: 'Public Health', icon: '🏥', categories: ['politics', 'social'] },
    { id: 'MENTAL', name: 'Mental Health', icon: '🧠', categories: ['social', 'science'] },
    { id: 'PHARMA', name: 'Pharmaceuticals', icon: '💊', categories: ['finance', 'science'] }
  ],
  technology: [
    { id: 'Q11016', name: 'Artificial Intelligence', icon: '🤖', categories: ['science'] },
    { id: 'CYBER', name: 'Cybersecurity', icon: '🔒', categories: ['politics'] },
    { id: 'BIGTECH', name: 'Big Tech', icon: '🖥️', categories: ['finance'] },
    { id: 'SOCIAL', name: 'Social Media', icon: '📱', categories: ['entertainment'] },
    { id: 'ELECVEH', name: 'Electric Vehicles', icon: '🚗', categories: ['environment', 'finance'] }
  ],
  arts_and_culture: [
    { id: 'Q7889', name: 'Video Games', icon: '🎮', categories: ['technology', 'entertainment'] },
    { id: 'Q11424', name: 'Film', icon: '🎬', categories: ['entertainment'] },
    { id: 'Q7565', name: 'Concert Tours', icon: '🎤', categories: ['entertainment'] },
    { id: 'Q483382', name: 'Music Awards', icon: '🏆', categories: ['entertainment'] },
    { id: 'Q3305213', name: 'Art', icon: '🎨' }
  ],
  social: [
    { id: 'EDUC', name: 'Education', icon: '🎓', categories: ['politics'] },
    { id: 'LABOR', name: 'Labor & Unions', icon: '👷', categories: ['politics', 'economics'] },
    { id: 'HOUS', name: 'Housing', icon: '🏠', categories: ['economics', 'politics'] },
    { id: 'CRIME', name: 'Crime & Justice', icon: '⚖️', categories: ['politics'] },
    { id: 'CIVIL', name: 'Civil Rights', icon: '✊', categories: ['politics', 'international'] }
  ]
};

const CATEGORY_COLORS = {
  politics: 'from-blue-500 to-indigo-600',
  sports: 'from-green-500 to-emerald-600',
  international: 'from-cyan-500 to-blue-600',
  finance: 'from-amber-500 to-orange-600',
  environment: 'from-green-600 to-teal-600',
  climate: 'from-sky-500 to-blue-500',
  science: 'from-indigo-500 to-purple-600',
  health: 'from-red-500 to-pink-600',
  arts_and_culture: 'from-fuchsia-500 to-purple-600',
  technology: 'from-purple-500 to-pink-600',
  crypto: 'from-orange-500 to-red-600',
  entertainment: 'from-pink-500 to-rose-600',
  social: 'from-teal-500 to-cyan-600',
  economics: 'from-yellow-500 to-amber-600',
  law: 'from-slate-500 to-gray-600'
};

const LEAGUE_LOGOS = {
  'Q9448': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/200px-Premier_League_Logo.svg.png',
  'Q324867': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/LaLiga_logo_2023.svg/200px-LaLiga_logo_2023.svg.png',
  'Q82595': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/df/Bundesliga_logo_%282017%29.svg/200px-Bundesliga_logo_%282017%29.svg.png',
  'Q15804': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e1/Serie_A_logo_%282019%29.svg/200px-Serie_A_logo_%282019%29.svg.png',
  'Q155223': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/03/National_Basketball_Association_logo.svg/200px-National_Basketball_Association_logo.svg.png',
  'Q1215884': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/National_Football_League_logo.svg/200px-National_Football_League_logo.svg.png',
  'Q265538': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Major_League_Baseball_logo.svg/200px-Major_League_Baseball_logo.svg.png',
  'Q1215892': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/05_NHL_Shield.svg/200px-05_NHL_Shield.svg.png',
  'Q1968': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/F1.svg/200px-F1.svg.png'
};

// Backwards compatibility
const SELECTED_SPORTS = SPORTS;
const SELECTED_POLITICAL_TOPICS = TOPICS.politics;
const SELECTED_INTERNATIONAL_TOPICS = TOPICS.international;
const SELECTED_FINANCE_TOPICS = TOPICS.finance;
const SELECTED_ENVIRONMENT_TOPICS = TOPICS.environment;
const SELECTED_CLIMATE_TOPICS = TOPICS.climate;
const SELECTED_SCIENCE_TOPICS = TOPICS.science;
const SELECTED_HEALTH_TOPICS = TOPICS.health;
const SELECTED_ARTS_CULTURE_TOPICS = TOPICS.arts_and_culture;
const SPORT_LABEL_MAPPINGS = SPORT_MAPPINGS;

// ============================================================================
// STATE
// ============================================================================

// Markets data - loaded from backend API
// All values (probability, volume, traders, stake) are populated by backend
let markets = [];

let INTERESTS_DATA = {
  politics: [], sports: [], international: [], finance: [],
  environment: [], climate: [], science: [], health: [], arts_and_culture: [],
  technology: [], social: []
};

let currentCategory = 'all';
let currentInterestsCategory = 'all';
let localFavorites = [];
let predictions = [];

// ============================================================================
// UTILITIES
// ============================================================================

const Utils = {
  formatCurrency: (value, currency = '$') =>
    `${currency}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,

  formatPercentage: (value) => `${Math.round(value)}%`,

  formatDate: (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),

  formatRelativeTime: (date) => {
    const diffMs = Date.now() - new Date(date);
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'just now';
  },

  debounce: (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  generateId: (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

  truncateText: (text, maxLength = 100) =>
    text.length <= maxLength ? text : text.substring(0, maxLength - 3) + '...',

  isEmpty: (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }
};

// Global function exports for backwards compatibility
const formatCurrency = Utils.formatCurrency;
const formatPercentage = Utils.formatPercentage;
const formatDate = Utils.formatDate;
const formatRelativeTime = Utils.formatRelativeTime;
const debounce = Utils.debounce;
const generateId = Utils.generateId;
const truncateText = Utils.truncateText;
const isEmpty = Utils.isEmpty;

// ============================================================================
// STORAGE
// ============================================================================

const Storage = {
  save: (key, value) => {
    try {
      localStorage.setItem(CONFIG.STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) { console.error('Storage save error:', e); }
  },

  load: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(CONFIG.STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Storage load error:', e);
      return defaultValue;
    }
  },

  remove: (key) => {
    try { localStorage.removeItem(CONFIG.STORAGE_PREFIX + key); }
    catch (e) { console.error('Storage remove error:', e); }
  },

  clear: () => {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CONFIG.STORAGE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  }
};

// Backwards compatibility
const saveToStorage = Storage.save;
const loadFromStorage = Storage.load;
const removeFromStorage = Storage.remove;
const clearAllStorage = Storage.clear;

// Favorites
function loadLocalFavorites() {
  const stored = Storage.load('favorites', []);
  localFavorites.length = 0;
  localFavorites.push(...stored);
  return stored;
}

function saveLocalFavorites(favorites) {
  Storage.save('favorites', favorites);
}

function isFavorited(itemId) {
  return Storage.load('favorites', []).some(f => f.id === itemId);
}

// Dashboard section collapse/expand state
const dashboardSectionStates = {
  positions: false,
  following: false,
  watchlist: false,
  interests: false
};

function toggleDashboardSection(section) {
  const contentEl = document.getElementById(`${section}Content`);
  const chevronEl = document.getElementById(`${section}Chevron`);
  
  if (!contentEl || !chevronEl) return;
  
  const isExpanded = dashboardSectionStates[section];
  
  if (isExpanded) {
    // Collapse
    contentEl.style.maxHeight = '0';
    contentEl.style.paddingTop = '0';
    contentEl.style.paddingBottom = '0';
    chevronEl.style.transform = 'rotate(0deg)';
  } else {
    // Expand
    contentEl.style.maxHeight = contentEl.scrollHeight + 100 + 'px';
    contentEl.style.paddingTop = '0';
    contentEl.style.paddingBottom = '1.25rem';
    chevronEl.style.transform = 'rotate(180deg)';
  }
  
  dashboardSectionStates[section] = !isExpanded;
}

// Initialize dashboard sections (expand all by default on page load)
function initDashboardSections() {
  ['positions', 'following', 'watchlist', 'interests'].forEach(section => {
    // Start expanded
    dashboardSectionStates[section] = false;
    toggleDashboardSection(section);
  });
}

async function toggleFavorite(itemId, itemName, itemType, category) {
  const favorites = Storage.load('favorites', []);
  const index = favorites.findIndex(f => f.id === itemId);

  if (index >= 0) {
    favorites.splice(index, 1);
    saveLocalFavorites(favorites);
    return false;
  } else {
    favorites.push({ id: itemId, name: itemName, type: itemType, category, addedAt: new Date().toISOString() });
    saveLocalFavorites(favorites);
    return true;
  }
}

// Watchlist storage (for markets/events)
let localWatchlist = [];

function loadWatchlist() {
  const stored = Storage.load('watchlist', []);
  localWatchlist.length = 0;
  localWatchlist.push(...stored);
  return stored;
}

function saveWatchlist(watchlist) {
  Storage.save('watchlist', watchlist);
}

function isWatchlisted(marketId) {
  return Storage.load('watchlist', []).some(w => w.id === marketId);
}

async function toggleWatchlist(marketId, marketTitle, category) {
  const watchlist = Storage.load('watchlist', []);
  const index = watchlist.findIndex(w => w.id === marketId);

  if (index >= 0) {
    watchlist.splice(index, 1);
    saveWatchlist(watchlist);
    updateSidebarWatchlist();
    return false;
  } else {
    watchlist.push({
      id: marketId,
      title: marketTitle,
      category,
      addedAt: new Date().toISOString()
    });
    saveWatchlist(watchlist);
    updateSidebarWatchlist();
    return true;
  }
}

// Make watchlist functions globally available
window.isWatchlisted = isWatchlisted;
window.toggleWatchlist = toggleWatchlist;
window.loadWatchlist = loadWatchlist;

// Make dashboard section toggle functions globally available
window.toggleDashboardSection = toggleDashboardSection;
window.initDashboardSections = initDashboardSections;

// Predictions storage
function loadPredictions() { return Storage.load('predictions', []); }
function savePrediction(prediction) {
  const preds = loadPredictions();
  preds.push(prediction);
  Storage.save('predictions', preds);
}

// ============================================================================
// API SERVICE
// ============================================================================

let apiConnected = false;
const dataCache = new Map();

async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

const API = {
  init: async () => {
    try {
      const result = await apiCall('/health');
      apiConnected = result.ok === true;
    } catch { apiConnected = false; }
    console.log(`API Status: ${apiConnected ? '✓ Connected' : '✗ Offline'}`);
    return apiConnected;
  },

  isConnected: () => apiConnected,

  // Markets
  getMarkets: () => apiCall('/markets'),
  getMarket: (id) => apiCall(`/markets/${id}`),
  createMarket: (data) => apiCall('/markets', { method: 'POST', body: JSON.stringify(data) }),
  resolveMarket: (id, winningOutcomeId) => apiCall(`/markets/${id}/resolve`, { method: 'POST', body: JSON.stringify({ winning_outcome_id: winningOutcomeId }) }),

  // Current Events & Trending Markets
  getCurrentEvents: () => apiCall('/markets/current-events'),
  getTrending: (limit = 10) => apiCall(`/markets/trending?limit=${limit}`),
  getByCategory: (category) => apiCall(`/markets/category/${category}`),
  getSuggestions: () => apiCall('/markets/suggestions'),

  // Predictions
  getPredictions: (marketId = null) => apiCall(`/predictions${marketId ? `?market_id=${marketId}` : ''}`),
  createPrediction: (data) => apiCall('/predictions', { method: 'POST', body: JSON.stringify(data) }),

  // Favorites
  getFavorites: (userId = 'demo') => apiCall(`/favorites?user_id=${userId}`),
  addFavorite: (data) => apiCall('/favorites', { method: 'POST', body: JSON.stringify(data) }),
  removeFavorite: (id) => apiCall(`/favorites/${id}`, { method: 'DELETE' })
};

window.SamsaApi = API;

// ============================================================================
// DATA LOADER
// ============================================================================

async function fetchWithCache(url, options = {}) {
  const cacheKey = `${url}_${JSON.stringify(options)}`;
  const cached = dataCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  dataCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

function clearCache(urlPattern = null) {
  if (urlPattern) {
    for (const key of dataCache.keys()) {
      if (key.includes(urlPattern)) dataCache.delete(key);
    }
  } else {
    dataCache.clear();
  }
}

async function loadJsonFile(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}`);
    return await response.json();
  } catch (error) {
    console.error('Error loading JSON:', error);
    return null;
  }
}

async function loadAllInterestsData() {
  console.log('Loading interests data...');

  // Map items preserving multi-category labels
  const mapToInterest = (items, category) => items.map(item => ({
    id: item.id,
    wikidataId: item.id,
    name: item.name,
    image: item.icon,
    category,
    // Include additional categories for multi-category items
    categories: item.categories ? [category, ...item.categories] : [category]
  }));

  INTERESTS_DATA.politics = mapToInterest(TOPICS.politics, 'politics');
  INTERESTS_DATA.sports = mapToInterest(SPORTS, 'sports');
  INTERESTS_DATA.international = mapToInterest(TOPICS.international, 'international');
  INTERESTS_DATA.finance = mapToInterest(TOPICS.finance, 'finance');
  INTERESTS_DATA.environment = mapToInterest(TOPICS.environment, 'environment');
  INTERESTS_DATA.climate = mapToInterest(TOPICS.climate, 'climate');
  INTERESTS_DATA.science = mapToInterest(TOPICS.science, 'science');
  INTERESTS_DATA.health = mapToInterest(TOPICS.health, 'health');
  INTERESTS_DATA.technology = mapToInterest(TOPICS.technology, 'technology');
  INTERESTS_DATA.arts_and_culture = mapToInterest(TOPICS.arts_and_culture, 'arts_and_culture');
  INTERESTS_DATA.social = mapToInterest(TOPICS.social, 'social');

  const totalCount = Object.values(INTERESTS_DATA).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`Loaded ${totalCount} interests`);
}

// ============================================================================
// MARKET FILTERS
// ============================================================================

function filterMarketsBySearch(marketsList, searchTerm) {
  if (!searchTerm) return marketsList;
  const term = searchTerm.toLowerCase();
  return marketsList.filter(m =>
    m.title.toLowerCase().includes(term) ||
    m.description.toLowerCase().includes(term) ||
    m.category.toLowerCase().includes(term)
  );
}

function filterMarketsByCategory(marketsList, category) {
  return category === 'all' ? marketsList : marketsList.filter(m => m.category === category);
}

function filterMarketsByStatus(marketsList, status) {
  return marketsList.filter(m => m.status === status);
}

function sortMarkets(marketsList, sortBy) {
  const sorted = [...marketsList];
  switch (sortBy) {
    case 'volume': return sorted.sort((a, b) => (b.volume || 0) - (a.volume || 0));
    case 'closing': return sorted.sort((a, b) => new Date(a.closeDate) - new Date(b.closeDate));
    case 'newest': return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'popular': return sorted.sort((a, b) => (b.traders || 0) - (a.traders || 0));
    default: return sorted;
  }
}

function applyMarketFilters(marketsList, options = {}) {
  let result = marketsList;
  if (options.search) result = filterMarketsBySearch(result, options.search);
  if (options.category) result = filterMarketsByCategory(result, options.category);
  if (options.status) result = filterMarketsByStatus(result, options.status);
  if (options.sortBy) result = sortMarkets(result, options.sortBy);
  return result;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

console.log('%c[SAMSA] Core v5.0 loaded', 'color: yellow; font-weight: bold');

