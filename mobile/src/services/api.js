import { API_CONFIG, ENDPOINTS } from '../constants/api';

class ApiService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.connected = false;
  }

  async fetch(endpoint, options = {}) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  async init() {
    try {
      const result = await this.fetch(ENDPOINTS.HEALTH);
      this.connected = result.ok === true;
    } catch {
      this.connected = false;
    }
    console.log(`API Status: ${this.connected ? '✓ Connected' : '✗ Offline'}`);
    return this.connected;
  }

  async getMarkets() {
    return this.fetch(ENDPOINTS.MARKETS);
  }

  async getMarket(id) {
    return this.fetch(ENDPOINTS.MARKET(id));
  }

  async getTrending(limit = 10) {
    return this.fetch(`${ENDPOINTS.TRENDING}?limit=${limit}`);
  }

  async getByCategory(category) {
    return this.fetch(ENDPOINTS.CATEGORY(category));
  }

  async getCurrentEvents() {
    return this.fetch(ENDPOINTS.CURRENT_EVENTS);
  }

  async createPrediction(data) {
    return this.fetch(ENDPOINTS.PREDICTIONS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
export default api;
