import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MarketCard from '../components/MarketCard';
import { useMarkets } from '../hooks/useMarkets';

const CATEGORIES = ['all', 'politics', 'international', 'environment', 'climate', 'science', 'health', 'finance', 'technology'];

export default function ExplorePage() {
  const { markets, loading } = useMarkets();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All Markets');
  const [search, setSearch] = useState('');
  const [trendingIndex, setTrendingIndex] = useState(0);

  const trending = [...markets]
    .sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0))
    .slice(0, 5);

  const filtered = markets.filter(m => {
    const categoryMatch = selectedCategory === 'All Markets' || m.category === selectedCategory.toLowerCase();
    const searchMatch = !search || m.title?.toLowerCase().includes(search.toLowerCase());
    return categoryMatch && searchMatch;
  });

  useEffect(() => {
    if (trending.length === 0) return;
    const interval = setInterval(() => {
      setTrendingIndex(prev => (prev + 1) % trending.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [trending.length]);

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-8">
      <div className="mb-12">
        <div className="flex items-center justify-end mb-8">
          <div className="flex items-center gap-2.5">
            <div className="relative search-container">
              <input
                type="text"
                placeholder="Search markets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 text-white placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
              />
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2" style={{ color: 'rgb(212, 175, 55)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </span>
            </div>
            <div className="relative category-dropdown-container">
              <button className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-950 font-semibold rounded-xl hover:brightness-110 transition flex items-center gap-2 whitespace-nowrap">
                <span>{selectedCategory}</span>
                <span className="text-sm">▼</span>
              </button>
              <div className="absolute right-0 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-10 hidden group-hover:block">
                {['All Markets', ...CATEGORIES.filter(c => c !== 'all').map(c => c.charAt(0).toUpperCase() + c.slice(1))].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-800 transition ${selectedCategory === cat ? 'text-white' : 'text-slate-300'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Markets Slideshow */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span style={{ color: 'rgb(212, 175, 55)' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </span>
            Trending
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {trending.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setTrendingIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === trendingIndex ? 'bg-yellow-400 w-6' : 'bg-slate-600'
                    }`}
                />
              ))}
            </div>
            <button
              onClick={() => setTrendingIndex(prev => (prev - 1 + trending.length) % trending.length)}
              className="w-10 h-10 bg-slate-800/80 border border-slate-700 rounded-full flex items-center justify-center text-white hover:bg-slate-700 hover:border-yellow-500/50 transition-all"
            >
              ←
            </button>
            <button
              onClick={() => setTrendingIndex(prev => (prev + 1) % trending.length)}
              className="w-10 h-10 bg-slate-800/80 border border-slate-700 rounded-full flex items-center justify-center text-white hover:bg-slate-700 hover:border-yellow-500/50 transition-all"
            >
              →
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 min-h-[320px]">
          {trending.length > 0 && trending[trendingIndex] && (
            <div className="p-8 animate-fadeIn">
              <div className="max-w-3xl">
                <span className="inline-block text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 mb-4">
                  {trending[trendingIndex].category}
                </span>
                <h3 className="text-3xl font-bold text-white mb-4">{trending[trendingIndex].title}</h3>
                <p className="text-slate-400 mb-6">{trending[trendingIndex].description}</p>
                <button
                  onClick={() => navigate(`/markets/${trending[trendingIndex].id}`)}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-950 font-semibold rounded-xl hover:brightness-110 transition"
                >
                  View Market
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All Markets Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span style={{ color: 'rgb(212, 175, 55)' }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </span>
          All Markets
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-slate-700 border-t-yellow-400 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
          {filtered.map(m => <MarketCard key={m.id} market={m} />)}
        </div>
      )}
    </div>
  );
}
