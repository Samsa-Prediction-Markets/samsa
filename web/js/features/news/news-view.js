// ========================================
// SAMSA - NEWS VIEW
// Handles news page rendering
// ========================================

const SAMPLE_NEWS = [
  {
    id: '1',
    title: 'Federal Reserve signals potential rate cuts in 2025',
    description: 'Fed Chair indicates openness to rate adjustments as inflation cools',
    source: 'Reuters',
    time: '2h ago',
    category: 'finance',
    relatedMarkets: ['mkt_fed_rates'],
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400'
  },
  {
    id: '2',
    title: 'OpenAI announces GPT-5 development timeline',
    description: 'Company shares roadmap for next-generation AI model release',
    source: 'TechCrunch',
    time: '4h ago',
    category: 'technology',
    relatedMarkets: ['mkt_gpt5_release', 'mkt_ai_coding'],
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400'
  },
  {
    id: '3',
    title: 'Bitcoin approaches key resistance level amid ETF inflows',
    description: 'Institutional investors continue accumulating as price nears $100k',
    source: 'CoinDesk',
    time: '5h ago',
    category: 'crypto',
    relatedMarkets: ['mkt_btc_100k'],
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400'
  },
  {
    id: '4',
    title: 'Climate scientists warn 2025 could break temperature records',
    description: 'New data suggests global warming acceleration continues',
    source: 'Nature',
    time: '6h ago',
    category: 'climate',
    relatedMarkets: ['mkt_climate'],
    image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400'
  },
  {
    id: '5',
    title: 'SpaceX Starship achieves successful orbital test',
    description: 'Major milestone brings Mars mission timeline into focus',
    source: 'Space.com',
    time: '8h ago',
    category: 'science',
    relatedMarkets: ['mkt_spacex_mars'],
    image: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=400'
  },
  {
    id: '6',
    title: 'EU Parliament debates Ukraine membership fast-track',
    description: 'Growing support for accelerated accession process',
    source: 'Politico',
    time: '10h ago',
    category: 'international',
    relatedMarkets: ['mkt_eu_expansion'],
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400'
  },
  {
    id: '7',
    title: 'Supreme Court to hear TikTok ban arguments',
    description: 'Landmark case could determine future of social media regulation',
    source: 'The Verge',
    time: '12h ago',
    category: 'technology',
    relatedMarkets: ['mkt_tiktok_ban'],
    image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400'
  },
  {
    id: '8',
    title: 'Healthcare stocks rally on FDA approval news',
    description: 'Multiple drug approvals boost pharmaceutical sector',
    source: 'Bloomberg',
    time: '14h ago',
    category: 'health',
    relatedMarkets: [],
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400'
  }
];

function renderNews() {
  const container = document.getElementById('newsGrid');
  if (!container) return;

  container.innerHTML = SAMPLE_NEWS.map(news => createNewsCardHTML(news)).join('');
}

function createNewsCardHTML(news) {
  const categoryColors = {
    finance: 'from-amber-500 to-orange-600',
    technology: 'from-purple-500 to-pink-600',
    crypto: 'from-yellow-500 to-amber-600',
    climate: 'from-sky-500 to-blue-500',
    science: 'from-indigo-500 to-purple-600',
    international: 'from-cyan-500 to-blue-600',
    health: 'from-red-500 to-pink-600',
    politics: 'from-blue-500 to-indigo-600'
  };

  const gradientClass = categoryColors[news.category] || 'from-slate-500 to-slate-600';
  const hasRelatedMarkets = news.relatedMarkets && news.relatedMarkets.length > 0;

  return `
    <div class="news-card group bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-yellow-500/50 transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer">
      ${news.image ? `
        <div class="relative h-48 overflow-hidden">
          <img src="${news.image}" alt="${news.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
          <div class="absolute bottom-4 left-4 right-4">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${gradientClass} text-white">${news.category}</span>
          </div>
        </div>
      ` : ''}
      <div class="p-5">
        <div class="flex items-center justify-between mb-3">
          ${!news.image ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${gradientClass} text-white">${news.category}</span>` : ''}
          <span class="text-xs text-slate-500">${news.time}</span>
        </div>
        <h3 class="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors mb-2">${news.title}</h3>
        <p class="text-sm text-slate-400 mb-4">${news.description}</p>
        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-500">${news.source}</span>
          ${hasRelatedMarkets ? `
            <span class="text-xs text-yellow-400 font-medium flex items-center gap-1">
              <span class="w-3 h-3">${window.SamsaIcons ? window.SamsaIcons.getIconByKey('trending', 'w-3 h-3', 'rgb(212,175,55)') : '↗'}</span>
              ${news.relatedMarkets.length} related market${news.relatedMarkets.length > 1 ? 's' : ''}
            </span>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function showNews() {
  hideAllViews();
  document.getElementById('newsView')?.classList.remove('hidden');
  renderNews();
}

window.showNews = showNews;
window.renderNews = renderNews;
