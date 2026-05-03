import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Storage from '../services/storage';

const FALLBACK_MARKETS = [
  {
    id: 'mkt_btc_100k',
    title: 'Will Bitcoin reach $100,000 by end of 2025?',
    description: 'Predict whether Bitcoin will hit the $100k milestone',
    category: 'crypto',
    status: 'active',
    closeDate: '--',
    outcomes: [
      { id: 'yes', title: 'Yes', probability: 0 },
      { id: 'no', title: 'No', probability: 0 },
    ],
    volume: 0,
    traders: 0,
    image_url: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800',
  },
  {
    id: 'mkt_ai_coding',
    title: 'Will AI surpass human performance in coding by 2026?',
    description: 'Will AI models achieve superhuman performance on standard coding benchmarks?',
    category: 'technology',
    status: 'active',
    closeDate: '--',
    outcomes: [
      { id: 'yes', title: 'Yes', probability: 0 },
      { id: 'no', title: 'No', probability: 0 },
    ],
    volume: 0,
    traders: 0,
    image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
  },
  {
    id: 'mkt_fed_rates',
    title: 'Will the Fed cut interest rates in Q1 2025?',
    description: 'Predict whether the Federal Reserve will announce a rate cut',
    category: 'finance',
    status: 'active',
    closeDate: '--',
    outcomes: [
      { id: 'yes', title: 'Yes', probability: 0 },
      { id: 'no', title: 'No', probability: 0 },
    ],
    volume: 0,
    traders: 0,
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
  },
  {
    id: 'mkt_us_election',
    title: 'Who will win the 2028 US Presidential Election?',
    description: 'Predict the winner of the 2028 United States Presidential Election',
    category: 'politics',
    status: 'active',
    closeDate: '--',
    outcomes: [
      { id: 'democrat', title: 'Democratic Candidate', probability: 0 },
      { id: 'republican', title: 'Republican Candidate', probability: 0 },
      { id: 'other', title: 'Other/Independent', probability: 0 },
    ],
    volume: 0,
    traders: 0,
    image_url: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800',
  },
  {
    id: 'mkt_climate',
    title: 'Will 2025 be the hottest year on record?',
    description: 'Predict whether 2025 will surpass all previous years in global average temperature',
    category: 'climate',
    status: 'active',
    closeDate: '--',
    outcomes: [
      { id: 'yes', title: 'Yes', probability: 0 },
      { id: 'no', title: 'No', probability: 0 },
    ],
    volume: 0,
    traders: 0,
    image_url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800',
  },
  {
    id: 'mkt_spacex_mars',
    title: 'Will SpaceX launch a crewed mission to Mars by 2030?',
    description: 'Predict whether SpaceX will successfully launch humans toward Mars',
    category: 'science',
    status: 'active',
    closeDate: '--',
    outcomes: [
      { id: 'yes', title: 'Yes', probability: 0 },
      { id: 'no', title: 'No', probability: 0 },
    ],
    volume: 0,
    traders: 0,
    image_url: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=800',
  },
];

function normalizeMarket(market) {
  return {
    ...market,
    volume: market.volume ?? market.total_volume ?? 0,
    traders: market.traders ?? 0,
    closeDate: market.closeDate || formatCloseDate(market.close_date) || '--',
    outcomes: (market.outcomes || []).map(o => ({
      ...o,
      probability: typeof o.probability === 'number' ? o.probability : 0,
    })),
  };
}

function formatCloseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function useMarkets() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const apiMarkets = await api.getMarkets();
      if (apiMarkets && apiMarkets.length > 0) {
        const normalized = apiMarkets.map(normalizeMarket);
        setMarkets(normalized);
        await Storage.save('markets_cache', normalized);
      } else {
        throw new Error('No markets from API');
      }
    } catch (err) {
      console.log('Using fallback markets:', err.message);
      
      const cached = await Storage.load('markets_cache');
      if (cached && cached.length > 0) {
        setMarkets(cached);
      } else {
        setMarkets(FALLBACK_MARKETS);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const getTrending = useCallback(() => {
    return [...markets]
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 10);
  }, [markets]);

  const getByCategory = useCallback((category) => {
    if (category === 'all') return markets;
    return markets.filter(m => m.category === category);
  }, [markets]);

  const searchMarkets = useCallback((query) => {
    if (!query) return markets;
    const term = query.toLowerCase();
    return markets.filter(m =>
      m.title.toLowerCase().includes(term) ||
      m.description?.toLowerCase().includes(term) ||
      m.category.toLowerCase().includes(term)
    );
  }, [markets]);

  return {
    markets,
    loading,
    error,
    refresh: fetchMarkets,
    getTrending,
    getByCategory,
    searchMarkets,
  };
}

export default useMarkets;
