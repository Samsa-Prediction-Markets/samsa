export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001/api',
  TIMEOUT: 10000,
};

export const ENDPOINTS = {
  MARKETS: '/markets',
  MARKET: (id) => `/markets/${id}`,
  TRENDING: '/markets/trending',
  CATEGORY: (cat) => `/markets/category/${cat}`,
  CURRENT_EVENTS: '/markets/current-events',
  PREDICTIONS: '/predictions',
  HEALTH: '/health',
};
