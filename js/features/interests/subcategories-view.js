// ========================================
// SAMSA - SUBCATEGORIES
// Handles subcategories view for interests
// ========================================

// Cached leagues data
let leaguesData = null;

// Sport name mappings to match interests with leagues data
const SPORT_NAME_MAPPINGS = {
  'Soccer': ['Soccer', 'Association Football'],
  'Basketball': ['Basketball'],
  'Tennis': ['Tennis'],
  'Baseball': ['Baseball'],
  'Volleyball': ['Volleyball'],
  'Cricket': ['Cricket'],
  'American Football': ['American Football', 'Canadian Football'],
  'Ice Hockey': ['Ice Hockey'],
  'Golf': ['Golf'],
  'Combat': ['Combat'],
  'Auto Racing': ['Auto Racing'],
  'Cycling': ['Cycling'],
  'Rugby': ['Rugby Union', 'Rugby League'],
  'Multi-Sports': ['Multi-Sports'],
  'Handball': ['Handball'],
  'Lacrosse': ['Lacrosse', 'Indoor Lacrosse', 'Field Lacrosse'],
  'Softball': ['Softball'],
};

// Emoji mappings for sports
const SPORT_EMOJIS = {
  'Soccer': '⚽',
  'Association Football': '⚽',
  'Basketball': '🏀',
  'Tennis': '🎾',
  'Baseball': '⚾',
  'Volleyball': '🏐',
  'Cricket': '🏏',
  'American Football': '🏈',
  'Canadian Football': '🏈',
  'Ice Hockey': '🏒',
  'Golf': '⛳',
  'Combat': '🥊',
  'Auto Racing': '🏎️',
  'Cycling': '🚴',
  'Rugby Union': '🏉',
  'Rugby League': '🏉',
  'Multi-Sports': '🏆',
  'Handball': '🤾',
  'Lacrosse': '🥍',
  'Indoor Lacrosse': '🥍',
  'Field Lacrosse': '🥍',
  'Softball': '🥎',
};

// Country flag emojis
const COUNTRY_FLAGS = {
  'USA': '🇺🇸',
  'USA/Canada': '🇺🇸',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'England/Wales': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Germany': '🇩🇪',
  'Spain': '🇪🇸',
  'Italy': '🇮🇹',
  'France': '🇫🇷',
  'Japan': '🇯🇵',
  'Australia': '🇦🇺',
  'Australia/New Zealand': '🇦🇺',
  'India': '🇮🇳',
  'Brazil': '🇧🇷',
  'Mexico': '🇲🇽',
  'Canada': '🇨🇦',
  'South Korea': '🇰🇷',
  'China': '🇨🇳',
  'Russia': '🇷🇺',
  'Netherlands': '🇳🇱',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Portugal': '🇵🇹',
  'Belgium': '🇧🇪',
  'Switzerland': '🇨🇭',
  'Austria': '🇦🇹',
  'Poland': '🇵🇱',
  'Sweden': '🇸🇪',
  'Denmark': '🇩🇰',
  'Turkey': '🇹🇷',
  'Greece': '🇬🇷',
  'Czech Republic': '🇨🇿',
  'Ukraine': '🇺🇦',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
  'Peru': '🇵🇪',
  'Uruguay': '🇺🇾',
  'Paraguay': '🇵🇾',
  'Ecuador': '🇪🇨',
  'Venezuela': '🇻🇪',
  'Bolivia': '🇧🇴',
  'Pakistan': '🇵🇰',
  'Bangladesh': '🇧🇩',
  'New Zealand': '🇳🇿',
  'South Africa': '🇿🇦',
  'Singapore': '🇸🇬',
  'Philippines': '🇵🇭',
  'Finland': '🇫🇮',
  'Europe': '🇪🇺',
  'Asia': '🌏',
  'Americas': '🌎',
  'International': '🌍',
  'United Kingdom': '🇬🇧',
  'West Indies': '🏝️',
  'Taiwan': '🇹🇼',
};

// About descriptions for sports
const SPORT_DESCRIPTIONS = {
  'Soccer': 'Association football, commonly known as soccer, is the world\'s most popular sport played by over 250 million players in more than 200 countries. Professional leagues span across every continent with passionate fan bases.',
  'Basketball': 'Basketball is a fast-paced team sport invented in 1891. The NBA is the premier professional league, while international competitions like EuroLeague and FIBA showcase global talent.',
  'Tennis': 'Tennis is a racket sport played individually or in doubles. The four Grand Slam tournaments (Australian Open, French Open, Wimbledon, US Open) are the most prestigious events.',
  'Baseball': 'Baseball is a bat-and-ball sport popular in North America, Japan, and Latin America. MLB is the oldest major professional sports league in the United States and Canada.',
  'American Football': 'American football is a team sport known for its strategic complexity and physical intensity. The NFL\'s Super Bowl is one of the most-watched annual sporting events worldwide.',
  'Ice Hockey': 'Ice hockey is a fast and physical team sport played on ice. The NHL features the best players from around the world competing at the highest level.',
  'Cricket': 'Cricket is a bat-and-ball game with a massive following in South Asia, Australia, and England. T20 leagues like the IPL have revolutionized the sport\'s entertainment value.',
  'Golf': 'Golf is a precision club-and-ball sport where players aim to hit balls into holes in the fewest strokes. The four major championships define the pinnacle of the sport.',
  'Combat': 'Combat sports include mixed martial arts (MMA), boxing, wrestling, and other fighting disciplines. UFC has become the dominant organization in MMA.',
  'Auto Racing': 'Auto racing encompasses various motorsport disciplines from Formula 1\'s technical precision to NASCAR\'s stock car racing and MotoGP\'s motorcycle racing.',
  'Cycling': 'Professional cycling features grand tours like the Tour de France, single-day classics, and world championships across road, track, and mountain biking disciplines.',
  'Rugby': 'Rugby is a contact team sport with two main variants: Rugby Union and Rugby League. The Rugby World Cup is the sport\'s premier international competition.',
  'Multi-Sports': 'Multi-sport events bring together athletes from various disciplines. The Olympic Games represent the pinnacle of international multi-sport competition.',
  'Volleyball': 'Volleyball is a team sport where two teams compete to ground the ball on the opponent\'s court. Both indoor and beach volleyball have professional circuits.',
  'Handball': 'Handball is a fast-paced indoor team sport popular in Europe. Professional leagues in Germany, France, and Spain showcase elite competition.',
  'Lacrosse': 'Lacrosse is a team sport using a lacrosse stick to catch, carry, and pass a ball. It has Native American origins and is growing in popularity worldwide.',
  'Softball': 'Softball is a variant of baseball played with a larger ball on a smaller field. It\'s popular at collegiate and international levels.',
};

function showInterestSubcategories(wikidataId, name) {
  hideAllViews();
  const el = document.getElementById('subcategoryView');
  if (el) {
    el.classList.remove('hidden');
    loadSubcategories(wikidataId, name);
  }
}

async function loadSubcategories(wikidataId, name) {
  // Set loading state
  const headerEl = document.getElementById('subcategoryHeader');
  const statsEl = document.getElementById('subcategoryStats');
  const aboutEl = document.getElementById('subcategoryAbout');
  const marketsEl = document.getElementById('subcategoryMarkets');
  const newsEl = document.getElementById('subcategoryNews');
  const quickStatsEl = document.getElementById('subcategoryQuickStats');
  const relatedEl = document.getElementById('subcategoryRelated');

  // Get icon from utility
  const icon = window.SamsaIcons ? window.SamsaIcons.getIcon(name, 'w-12 h-12') : '';

  // Set header
  if (headerEl) {
    headerEl.innerHTML = `
      <span class="flex items-center justify-center w-16 h-16">${icon}</span>
      <div class="flex-1">
        <h1 class="text-3xl font-bold text-white">${name}</h1>
        <p class="text-slate-400">Leagues, competitions, and markets</p>
      </div>
      <button onclick="handleFollowClick('${wikidataId}', '${name.replace(/'/g, "\\'")}', 'interest', 'sports', this)"
        class="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${isFavorited(wikidataId)
        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30'
        : 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 hover:from-yellow-400 hover:to-amber-400'}">
        ${isFavorited(wikidataId) ? '✓ Following' : '+ Follow'}
      </button>
    `;
  }

  // Set loading states
  if (aboutEl) aboutEl.innerHTML = '<span class="animate-pulse">Loading...</span>';
  if (marketsEl) marketsEl.innerHTML = '<div class="col-span-full text-center text-slate-400 py-4 animate-pulse">Loading leagues...</div>';
  if (newsEl) newsEl.innerHTML = '<div class="animate-pulse text-slate-400">Loading news...</div>';
  if (quickStatsEl) quickStatsEl.innerHTML = '<div class="animate-pulse text-slate-400">Loading stats...</div>';
  if (relatedEl) relatedEl.innerHTML = '<div class="animate-pulse text-slate-400">Loading related...</div>';

  try {
    const subcategories = await fetchSubcategories(wikidataId, name);
    renderSubcategoryOverview(name, wikidataId, subcategories);
  } catch (error) {
    console.error('Error loading subcategories:', error);
    if (aboutEl) aboutEl.innerHTML = '<span class="text-red-400">Failed to load. Please try again.</span>';
  }
}

async function fetchSubcategories(wikidataId, interestName) {
  // Load leagues data if not cached
  if (!leaguesData) {
    try {
      const response = await fetch('./data/top-leagues-attendance.json');
      leaguesData = await response.json();
    } catch (error) {
      console.error('Error loading leagues data:', error);
      leaguesData = [];
    }
  }

  // Find matching sports for this interest
  const sportVariants = SPORT_NAME_MAPPINGS[interestName] || [interestName];

  // Filter leagues that match any of the sport variants
  const matchingLeagues = leaguesData.filter(league =>
    sportVariants.some(sport =>
      league.sport.toLowerCase() === sport.toLowerCase()
    )
  );

  // Sort by tier (tier 1 first) then by name
  matchingLeagues.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.name.localeCompare(b.name);
  });

  // Convert to subcategory format
  return matchingLeagues.map(league => ({
    id: league.name.replace(/\s+/g, '_').toLowerCase(),
    name: league.name,
    emoji: getLeagueEmoji(league),
    country: league.country,
    tier: league.tier,
    sport: league.sport
  }));
}

function getLeagueEmoji(league) {
  // Use SVG icon from icon utility
  if (window.SamsaIcons) {
    return window.SamsaIcons.getIcon(league.sport, 'w-full h-full');
  }
  // Fallback to emoji
  const country = league.country.split('/')[0].trim();
  if (COUNTRY_FLAGS[country]) {
    return COUNTRY_FLAGS[country];
  }
  if (COUNTRY_FLAGS[league.country]) {
    return COUNTRY_FLAGS[league.country];
  }
  return SPORT_EMOJIS[league.sport] || '🏆';
}

function renderSubcategoryOverview(name, wikidataId, subcategories) {
  const statsEl = document.getElementById('subcategoryStats');
  const aboutEl = document.getElementById('subcategoryAbout');
  const marketsEl = document.getElementById('subcategoryMarkets');
  const newsEl = document.getElementById('subcategoryNews');
  const quickStatsEl = document.getElementById('subcategoryQuickStats');
  const relatedEl = document.getElementById('subcategoryRelated');

  // Count stats
  const tier1Count = subcategories.filter(s => s.tier === 1).length;
  const tier2Count = subcategories.filter(s => s.tier === 2).length;
  const countries = [...new Set(subcategories.map(s => s.country.split('/')[0].trim()))];

  // Render Stats - only showing league/team structure info (no market data)
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <p class="text-slate-400 text-sm mb-2">Total Leagues</p>
        <p class="text-3xl font-bold text-yellow-400">${subcategories.length}</p>
      </div>
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <p class="text-slate-400 text-sm mb-2">Top Tier</p>
        <p class="text-3xl font-bold text-yellow-400">${tier1Count}</p>
        <p class="text-xs text-slate-500 mt-1">Premier competitions</p>
      </div>
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <p class="text-slate-400 text-sm mb-2">Countries</p>
        <p class="text-3xl font-bold text-yellow-400">${countries.length}</p>
        <p class="text-xs text-slate-500 mt-1">Worldwide coverage</p>
      </div>
    `;
  }

  // Render About
  if (aboutEl) {
    const description = SPORT_DESCRIPTIONS[name] || `Explore ${name} leagues and competitions from around the world. Follow your favorite leagues to get updates on markets and predictions.`;
    aboutEl.innerHTML = description;
  }

  // Render Markets/Leagues (Top Tier First)
  if (marketsEl) {
    const tier1 = subcategories.filter(s => s.tier === 1).slice(0, 8);

    if (tier1.length > 0) {
      marketsEl.innerHTML = tier1.map(league => {
        const leagueIcon = window.SamsaIcons ? window.SamsaIcons.getIcon(league.sport, 'w-6 h-6') : '';
        return `
        <div class="bg-slate-800/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all cursor-pointer group border border-slate-700 hover:border-yellow-500/50"
          onclick="showLeagueDetail('${league.id}', '${league.name.replace(/'/g, "\\'")}', '${league.country}', '${league.sport}', '${name}')">
          <div class="flex items-center gap-3 mb-3">
            <span class="flex items-center justify-center w-8 h-8">${leagueIcon}</span>
            <div class="flex-1 min-w-0">
              <h4 class="text-white font-semibold group-hover:text-yellow-400 transition-colors truncate">${league.name}</h4>
              <p class="text-slate-500 text-xs">${league.country}</p>
            </div>
          </div>
          <div class="flex items-center justify-end">
            <button onclick="event.stopPropagation(); handleFollowClick('${league.id}', '${league.name.replace(/'/g, "\\'")}', 'league', '${name}', this)"
              class="text-xs px-3 py-1 rounded-lg transition-all ${isFavorited(league.id)
          ? 'bg-yellow-500/20 text-yellow-400'
          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}">
              ${isFavorited(league.id) ? '✓' : '+'}
            </button>
          </div>
        </div>
      `}).join('');

      // Add "View All" button if more leagues exist
      if (subcategories.length > 8) {
        marketsEl.innerHTML += `
          <div class="col-span-full">
            <button onclick="showAllLeagues('${name}')" 
              class="w-full py-3 text-yellow-400 hover:text-yellow-300 font-semibold text-sm transition-colors">
              View all ${subcategories.length} leagues →
            </button>
          </div>
        `;
      }
    } else {
      marketsEl.innerHTML = '<div class="col-span-full text-center text-slate-400 py-4">No leagues available for this category</div>';
    }
  }

  // Render News - will be populated by backend
  if (newsEl) {
    newsEl.innerHTML = `
      <div class="text-center py-4">
        <p class="text-slate-500 text-sm">No news available</p>
      </div>
    `;
  }

  // Render Quick Stats
  if (quickStatsEl) {
    quickStatsEl.innerHTML = `
      <div class="flex justify-between items-center py-2 border-b border-slate-800">
        <span class="text-slate-400 text-sm">Tier 1 Leagues</span>
        <span class="text-white font-semibold">${tier1Count}</span>
      </div>
      <div class="flex justify-between items-center py-2 border-b border-slate-800">
        <span class="text-slate-400 text-sm">Tier 2 Leagues</span>
        <span class="text-white font-semibold">${tier2Count}</span>
      </div>
      <div class="flex justify-between items-center py-2 border-b border-slate-800">
        <span class="text-slate-400 text-sm">Other Leagues</span>
        <span class="text-white font-semibold">${subcategories.length - tier1Count - tier2Count}</span>
      </div>
      <div class="flex justify-between items-center py-2">
        <span class="text-slate-400 text-sm">Countries</span>
        <span class="text-white font-semibold">${countries.length}</span>
      </div>
    `;
  }

  // Render Related (other sports)
  if (relatedEl) {
    const allSports = Object.keys(SPORT_NAME_MAPPINGS).filter(s => s !== name);
    const relatedSports = allSports.sort(() => Math.random() - 0.5).slice(0, 4);

    relatedEl.innerHTML = relatedSports.map(sport => {
      const sportIcon = window.SamsaIcons ? window.SamsaIcons.getIcon(sport, 'w-5 h-5') : '';
      return `
        <div class="flex items-center gap-3 py-2 hover:bg-slate-800/50 rounded-lg px-2 cursor-pointer transition-colors"
          onclick="showInterestSubcategories('${sport}', '${sport}')">
          <span class="flex items-center justify-center w-6 h-6">${sportIcon}</span>
          <span class="text-white text-sm">${sport}</span>
        </div>
      `;
    }).join('');
  }
}

// Show all leagues in a modal or expanded view
function showAllLeagues(sportName) {
  const sportVariants = SPORT_NAME_MAPPINGS[sportName] || [sportName];
  const allLeagues = leaguesData.filter(league =>
    sportVariants.some(sport => league.sport.toLowerCase() === sport.toLowerCase())
  );

  // Sort by tier
  allLeagues.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.name.localeCompare(b.name);
  });

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  const tier1 = allLeagues.filter(l => l.tier === 1);
  const tier2 = allLeagues.filter(l => l.tier === 2);
  const tier3Plus = allLeagues.filter(l => l.tier >= 3);

  const sportIcon = window.SamsaIcons ? window.SamsaIcons.getIcon(sportName, 'w-8 h-8') : '';
  const starIcon = window.SamsaIcons ? window.SamsaIcons.getIcon('star', 'w-5 h-5') : '⭐';

  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-3">
          <span class="flex items-center justify-center w-10 h-10">${sportIcon}</span>
          <h2 class="text-2xl font-bold text-white">${sportName} Leagues</h2>
        </div>
        <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-2xl">✕</button>
      </div>
      
      ${tier1.length > 0 ? `
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">${starIcon} Top Tier (${tier1.length})</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            ${tier1.map(league => renderLeagueItem(league, sportName)).join('')}
          </div>
        </div>
      ` : ''}
      
      ${tier2.length > 0 ? `
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-slate-300 mb-3">🥈 Second Tier (${tier2.length})</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            ${tier2.map(league => renderLeagueItem(league, sportName)).join('')}
          </div>
        </div>
      ` : ''}
      
      ${tier3Plus.length > 0 ? `
        <div>
          <h3 class="text-lg font-semibold text-slate-400 mb-3">🏅 Other (${tier3Plus.length})</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            ${tier3Plus.map(league => renderLeagueItem(league, sportName)).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(modal);
}

function renderLeagueItem(league, parentName) {
  const icon = window.SamsaIcons ? window.SamsaIcons.getIcon(league.sport, 'w-5 h-5') : '';
  const leagueId = league.name.replace(/\s+/g, '_').toLowerCase();
  const isFollowing = isFavorited(leagueId);

  return `
    <div class="bg-slate-800/50 rounded-xl p-3 hover:bg-slate-800/70 transition-all border border-slate-700 hover:border-yellow-500/50 group cursor-pointer"
      onclick="document.querySelector('.fixed')?.remove(); showLeagueDetail('${leagueId}', '${league.name.replace(/'/g, "\\'")}', '${league.country}', '${league.sport}', '${parentName}')">
      <div class="flex items-center gap-2 mb-2">
        <span class="flex items-center justify-center w-6 h-6">${icon}</span>
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-medium truncate group-hover:text-yellow-400 transition-colors">${league.name}</p>
          <p class="text-slate-500 text-xs">${league.country}</p>
        </div>
      </div>
      <button onclick="event.stopPropagation(); handleFollowClick('${leagueId}', '${league.name.replace(/'/g, "\\'")}', 'league', '${parentName}', this)"
        class="w-full text-xs py-1.5 rounded-lg transition-all ${isFollowing
      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600'}">
        ${isFollowing ? '✓ Following' : '+ Follow'}
      </button>
    </div>
  `;
}

// ========================================
// LEAGUE DETAIL VIEW
// ========================================

// Store current context for back navigation
let currentLeagueContext = {
  sportName: ''
};

function showLeagueDetail(leagueId, leagueName, country, sport, parentSport) {
  // Store context for back navigation
  currentLeagueContext = {
    sportName: parentSport
  };

  hideAllViews();
  const el = document.getElementById('leagueDetailView');
  if (el) {
    el.classList.remove('hidden');
    loadLeagueDetail(leagueId, leagueName, country, sport, parentSport);
  }
}

function goBackFromLeague() {
  if (currentLeagueContext.sportName) {
    showInterestSubcategories(
      currentLeagueContext.sportName,
      currentLeagueContext.sportName
    );
  } else {
    showInterests();
  }
}

async function loadLeagueDetail(leagueId, leagueName, country, sport, parentSport) {
  const headerEl = document.getElementById('leagueHeader');
  const statsEl = document.getElementById('leagueStats');
  const aboutEl = document.getElementById('leagueAbout');
  const marketsEl = document.getElementById('leagueMarkets');
  const teamsEl = document.getElementById('leagueTeams');
  const infoEl = document.getElementById('leagueInfo');
  const newsEl = document.getElementById('leagueNews');
  const relatedEl = document.getElementById('leagueRelated');

  // Get icon from utility
  const icon = window.SamsaIcons ? window.SamsaIcons.getIcon(sport, 'w-12 h-12') : '';

  // Set header
  if (headerEl) {
    headerEl.innerHTML = `
      <span class="flex items-center justify-center w-16 h-16">${icon}</span>
      <div class="flex-1">
        <h1 class="text-3xl font-bold text-white">${leagueName}</h1>
        <p class="text-slate-400">${country} • ${sport}</p>
      </div>
      <button onclick="handleFollowClick('${leagueId}', '${leagueName.replace(/'/g, "\\'")}', 'league', '${parentSport}', this)"
        class="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${isFavorited(leagueId)
        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30'
        : 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 hover:from-yellow-400 hover:to-amber-400'}">
        ${isFavorited(leagueId) ? '✓ Following' : '+ Follow'}
      </button>
    `;
  }

  // Generate consistent teams count for this league
  const seed = leagueName.length + country.length;
  const teamsCount = 10 + (seed % 22);

  // Fetch league stats from backend API (defaults to 0 if not available)
  let leagueStats = { activeMarkets: 0, totalVolume: 0, predictions: 0 };
  try {
    const response = await fetch(`/api/leagues/${leagueId}/stats`);
    if (response.ok) {
      const data = await response.json();
      leagueStats = {
        activeMarkets: data.active_markets || 0,
        totalVolume: data.total_volume || 0,
        predictions: data.predictions || 0
      };
    }
  } catch (err) {
    // Backend not available, use defaults
    console.log('League stats API not available, using defaults');
  }

  // Render Stats - values fetched from backend (defaults to 0)
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <p class="text-slate-400 text-sm mb-2">Active Markets</p>
        <p class="text-3xl font-bold text-green-400">${leagueStats.activeMarkets}</p>
        <p class="text-xs text-slate-500 mt-1">Open for predictions</p>
      </div>
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <p class="text-slate-400 text-sm mb-2">Total Volume</p>
        <p class="text-3xl font-bold text-yellow-400">$${leagueStats.totalVolume.toLocaleString()}</p>
        <p class="text-xs text-slate-500 mt-1">All time</p>
      </div>
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <p class="text-slate-400 text-sm mb-2">Predictions</p>
        <p class="text-3xl font-bold text-yellow-400">${leagueStats.predictions}</p>
        <p class="text-xs text-slate-500 mt-1">Total placed</p>
      </div>
    `;
  }

  // Render About
  if (aboutEl) {
    aboutEl.innerHTML = getLeagueDescription(leagueName, country, sport);
  }

  // Markets section - will be populated by backend
  if (marketsEl) {
    marketsEl.innerHTML = `
      <div class="col-span-full text-center py-8">
        <div class="text-slate-500 mb-2">
          <svg class="w-12 h-12 mx-auto opacity-50" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <p class="text-slate-400 text-sm">No markets available yet</p>
        <p class="text-slate-500 text-xs mt-1">Markets will appear here when created</p>
      </div>
    `;
  }

  // Render Teams
  if (teamsEl) {
    const teams = generateSampleTeams(leagueName, sport, teamsCount);
    teamsEl.innerHTML = teams.map(team => `
      <div class="bg-slate-800/50 rounded-lg p-3 hover:bg-slate-800/70 transition-colors cursor-pointer text-center">
        <span class="flex justify-center mb-1">${team.icon}</span>
        <p class="text-white text-xs font-medium truncate">${team.name}</p>
      </div>
    `).join('');
  }

  // Render League Info - only structural info, no market stats
  if (infoEl) {
    infoEl.innerHTML = `
      <div class="flex justify-between items-center py-2 border-b border-slate-800">
        <span class="text-slate-400 text-sm">Country</span>
        <span class="text-white font-semibold">${country}</span>
      </div>
      <div class="flex justify-between items-center py-2 border-b border-slate-800">
        <span class="text-slate-400 text-sm">Sport</span>
        <span class="text-white font-semibold">${sport}</span>
      </div>
      <div class="flex justify-between items-center py-2 border-b border-slate-800">
        <span class="text-slate-400 text-sm">Teams</span>
        <span class="text-white font-semibold">${teamsCount}</span>
      </div>
      <div class="flex justify-between items-center py-2">
        <span class="text-slate-400 text-sm">Season</span>
        <span class="text-white font-semibold">2024-25</span>
      </div>
    `;
  }

  // Render News - will be populated by backend
  if (newsEl) {
    newsEl.innerHTML = `
      <div class="text-center py-4">
        <p class="text-slate-500 text-sm">No news available</p>
      </div>
    `;
  }

  // Render Related Leagues
  if (relatedEl) {
    const sportVariants = SPORT_NAME_MAPPINGS[parentSport] || [parentSport];
    const relatedLeagues = leaguesData
      .filter(l => sportVariants.some(s => l.sport.toLowerCase() === s.toLowerCase()))
      .filter(l => l.name !== leagueName)
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    relatedEl.innerHTML = relatedLeagues.map(league => {
      const leagueIcon = window.SamsaIcons ? window.SamsaIcons.getIcon(league.sport, 'w-5 h-5') : '';
      const lid = league.name.replace(/\s+/g, '_').toLowerCase();
      return `
        <div class="flex items-center gap-3 py-2 hover:bg-slate-800/50 rounded-lg px-2 cursor-pointer transition-colors"
          onclick="showLeagueDetail('${lid}', '${league.name.replace(/'/g, "\\'")}', '${league.country}', '${league.sport}', '${parentSport}')">
          <span class="flex items-center justify-center w-6 h-6">${leagueIcon}</span>
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm truncate">${league.name}</p>
            <p class="text-slate-500 text-xs">${league.country}</p>
          </div>
        </div>
      `;
    }).join('');
  }
}

function getLeagueDescription(leagueName, country, sport) {
  const descriptions = {
    'Premier League': 'The Premier League is the top tier of English football, founded in 1992. It is one of the most-watched sports leagues globally, featuring 20 clubs competing for the championship each season.',
    'La Liga': 'La Liga is the top professional football division of the Spanish football league system. It features legendary clubs like Real Madrid and Barcelona, known for producing world-class talent.',
    'NBA': 'The National Basketball Association (NBA) is the premier men\'s professional basketball league in North America. Founded in 1946, it features 30 teams and is considered the top basketball league in the world.',
    'NFL': 'The National Football League (NFL) is a professional American football league consisting of 32 teams. The season culminates in the Super Bowl, one of the most-watched annual sporting events.',
    'MLB': 'Major League Baseball (MLB) is a professional baseball organization and the oldest major professional sports league in the United States and Canada, established in 1903.',
    'NHL': 'The National Hockey League (NHL) is a professional ice hockey league in North America comprising 32 teams. The Stanley Cup is the championship trophy awarded annually.',
    'UFC': 'The Ultimate Fighting Championship (UFC) is the largest mixed martial arts (MMA) organization in the world, featuring top fighters across multiple weight divisions.',
    'Formula 1': 'Formula One (F1) is the highest class of international racing for single-seater formula racing cars. The World Championship has been running since 1950.',
    'Champions League': 'The UEFA Champions League is an annual club football competition organized by UEFA. It is the most prestigious club competition in European football.',
  };

  return descriptions[leagueName] ||
    `${leagueName} is a professional ${sport.toLowerCase()} competition based in ${country}. Follow this league to stay updated on matches, standings, and prediction markets.`;
}

/**
 * Generate markets in the EXACT same format as main markets
 * This allows using createMarketCardHTML directly
 */
function generateLeagueMarketsData(leagueName, sport, count, leagueId) {
  const marketTemplates = {
    'Soccer': [
      { title: 'Match Winner', description: 'Predict the winner of the upcoming match', outcomes: ['Home Win', 'Away Win'] },
      { title: 'League Champion', description: 'Who will win the league title this season?', outcomes: ['Top Favorite', 'Other Teams'] },
      { title: 'Top Scorer', description: 'Who will be the top scorer of the season?', outcomes: ['Current Leader', 'Challenger'] },
      { title: 'Total Goals', description: 'Will the total goals be over or under 2.5?', outcomes: ['Over 2.5', 'Under 2.5'] },
    ],
    'Basketball': [
      { title: 'Game Winner', description: 'Predict the winner of the next game', outcomes: ['Home Team', 'Away Team'] },
      { title: 'Championship Winner', description: 'Who will win the championship this year?', outcomes: ['Favorite', 'Field'] },
      { title: 'MVP Award', description: 'Who will be named the Most Valuable Player?', outcomes: ['Top Candidate', 'Dark Horse'] },
      { title: 'Points Total', description: 'Will total points be over or under 220?', outcomes: ['Over 220', 'Under 220'] },
    ],
    'American Football': [
      { title: 'Game Winner', description: 'Predict the winner of the upcoming game', outcomes: ['Home Team', 'Away Team'] },
      { title: 'Championship Winner', description: 'Who will win the championship?', outcomes: ['Favorite', 'Underdog'] },
      { title: 'MVP Award', description: 'Who will be named MVP?', outcomes: ['Leading Candidate', 'Other'] },
    ],
    'Ice Hockey': [
      { title: 'Game Winner', description: 'Predict the winner of the next game', outcomes: ['Home Team', 'Away Team'] },
      { title: 'Stanley Cup Winner', description: 'Who will win the Stanley Cup?', outcomes: ['Favorite', 'Field'] },
      { title: 'Goals Total', description: 'Total goals over or under 5.5?', outcomes: ['Over 5.5', 'Under 5.5'] },
    ],
    'default': [
      { title: 'Competition Winner', description: 'Predict the winner of this competition', outcomes: ['Favorite', 'Underdog'] },
      { title: 'Match Result', description: 'Predict the result of the next match', outcomes: ['Home', 'Away'] },
    ]
  };

  const templates = marketTemplates[sport] || marketTemplates['default'];
  const generatedMarkets = [];

  // Generate unique IDs starting from 1000 to avoid collision with main markets
  const baseId = 1000 + leagueId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  for (let i = 0; i < Math.min(count, 5); i++) {
    const template = templates[i % templates.length];
    const prob1 = Math.floor(Math.random() * 40) + 30; // 30-70
    const prob2 = 100 - prob1;
    const volume = Math.floor(Math.random() * 50000) + 10000;
    const marketId = baseId + i;

    const market = {
      id: marketId,
      title: `${leagueName}: ${template.title}`,
      description: template.description,
      category: sport.toLowerCase().replace(/\s+/g, '-'),
      closeDate: getRandomFutureDate(),
      outcomes: template.outcomes.map((name, idx) => {
        const isYesNo = template.outcomes.length === 2 && 
          template.outcomes.map(n => n.toLowerCase()).includes('yes') && 
          template.outcomes.map(n => n.toLowerCase()).includes('no');
        const colors = isYesNo ? LEAGUE_BINARY_COLORS : LEAGUE_MULTI_COLORS;
        return {
          id: idx + 1,
          title: name,
          probability: idx === 0 ? prob1 : prob2,
          stake: Math.floor(Math.random() * 10000) + 5000,
          color: colors[idx]?.line || LEAGUE_MULTI_COLORS[idx % LEAGUE_MULTI_COLORS.length].line
        };
      }),
      volume: volume,
      volume24h: Math.floor(volume * 0.15),
      traders: Math.floor(Math.random() * 500) + 100,
      news: [
        { title: `Latest ${leagueName} updates and analysis`, source: 'Sports News', time: '1h ago' },
        { title: `Expert predictions for upcoming ${leagueName} matches`, source: 'Betting Insider', time: '3h ago' },
        { title: `${leagueName} odds movement and trends`, source: 'Odds Portal', time: '6h ago' }
      ]
    };

    generatedMarkets.push(market);

    // Add to global markets array so showDetail works
    if (!markets.find(m => m.id === marketId)) {
      markets.push(market);
    }
  }

  return generatedMarkets;
}

// Keep old function for backward compatibility
function generateSampleMarkets(leagueName, sport, count) {
  return generateLeagueMarketsData(leagueName, sport, count, leagueName.replace(/\s+/g, '_').toLowerCase());
}

function generateSampleTeams(leagueName, sport, count) {
  const teamColors = ['#3b82f6', '#ef4444', '#ffffff', '#22c55e', '#eab308', '#a855f7', '#f97316', '#1f2937', '#f59e0b', '#6366f1'];
  const teams = [];

  for (let i = 0; i < Math.min(count, 12); i++) {
    const color = teamColors[i % teamColors.length];
    teams.push({
      name: `Team ${i + 1}`,
      icon: `<svg class="w-6 h-6" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${color}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/></svg>`
    });
  }

  return teams;
}

function getRandomFutureDate() {
  const days = Math.floor(Math.random() * 30) + 1;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ========================================
// MARKET CHARTS FOR LEAGUE PAGES
// ========================================

// Cache for league market probability histories
const leagueMarketHistories = new Map();

// Binary market colors (Yes/No - Green/Red)
const LEAGUE_BINARY_COLORS = [
  { line: '#22c55e', fill: 'rgba(34, 197, 94, 0.2)' },   // Green (Yes)
  { line: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)' },   // Red (No)
];

// Multi-option market colors (varied palette)
const LEAGUE_MULTI_COLORS = [
  { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.2)' },   // Blue
  { line: '#a855f7', fill: 'rgba(168, 85, 247, 0.2)' },   // Purple
  { line: '#f59e0b', fill: 'rgba(245, 158, 11, 0.2)' },   // Amber
  { line: '#06b6d4', fill: 'rgba(6, 182, 212, 0.2)' },    // Cyan
  { line: '#ec4899', fill: 'rgba(236, 72, 153, 0.2)' },   // Pink
];

// Default colors (fallback)
const LEAGUE_OUTCOME_COLORS = LEAGUE_MULTI_COLORS;

/**
 * Normalize outcome name - converts "Yes, Banned" → "Yes", "No, Still Operating" → "No"
 * @param {string} name - The outcome name
 * @returns {string} Normalized name
 */
function normalizeLeagueOutcomeName(name) {
  const lower = (name || '').toLowerCase().trim();
  if (lower === 'yes' || lower.startsWith('yes,') || lower.startsWith('yes ')) {
    return 'Yes';
  }
  if (lower === 'no' || lower.startsWith('no,') || lower.startsWith('no ')) {
    return 'No';
  }
  return name;
}

/**
 * Check if league market outcomes are binary (Yes/No style)
 */
function isLeagueBinaryMarket(outcomes) {
  if (outcomes.length !== 2) return false;
  const names = outcomes.map(o => normalizeLeagueOutcomeName(o.name || o.title || '').toLowerCase());
  return names.includes('yes') && names.includes('no');
}

/**
 * Get appropriate color palette for league market
 */
function getLeagueColors(outcomes) {
  return isLeagueBinaryMarket(outcomes) ? LEAGUE_BINARY_COLORS : LEAGUE_MULTI_COLORS;
}

/**
 * Generate probability history for league market outcomes
 */
function generateLeagueMarketHistories(marketId, outcomes, points = 30) {
  if (leagueMarketHistories.has(marketId)) {
    return leagueMarketHistories.get(marketId);
  }

  const histories = [];

  // Generate first outcome history
  const firstHistory = [];
  let prob = outcomes[0].odds;

  for (let i = points - 1; i >= 0; i--) {
    if (i === 0) {
      firstHistory.unshift(outcomes[0].odds);
    } else {
      const change = (Math.random() - 0.5) * 8;
      const meanReversion = (50 - prob) * 0.02;
      prob = Math.max(5, Math.min(95, prob - change + meanReversion));
      firstHistory.unshift(Math.round(prob));
    }
  }
  histories.push(firstHistory);

  // For binary markets, generate complementary history
  if (outcomes.length === 2) {
    const complementHistory = firstHistory.map(val => 100 - val);
    histories.push(complementHistory);
  } else {
    // For multi-outcome, generate independent histories
    for (let i = 1; i < outcomes.length; i++) {
      const history = [];
      prob = outcomes[i].odds;
      for (let j = points - 1; j >= 0; j--) {
        if (j === 0) {
          history.unshift(outcomes[i].odds);
        } else {
          const change = (Math.random() - 0.5) * 6;
          prob = Math.max(5, Math.min(95, prob - change));
          history.unshift(Math.round(prob));
        }
      }
      histories.push(history);
    }
  }

  leagueMarketHistories.set(marketId, histories);
  return histories;
}

/**
 * Generate SVG line path for chart
 */
function generateLeaguePath(data, width, height) {
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
 * Generate area path for gradient fill
 */
function generateLeagueAreaPath(data, width, height) {
  const linePath = generateLeaguePath(data, width, height);
  const padding = 4;
  return `${linePath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;
}

/**
 * Create multi-outcome chart for league markets
 * Matches the style of createMiniMultiChart from main markets
 * Uses binary colors for Yes/No, multi colors otherwise
 */
function createLeagueMultiChart(marketId, outcomes, width = 280, height = 70) {
  const histories = generateLeagueMarketHistories(marketId, outcomes);
  const colorPalette = getLeagueColors(outcomes);
  const gradientDefs = [];
  const areaPaths = [];
  const linePaths = [];
  const dots = [];

  outcomes.slice(0, 2).forEach((outcome, idx) => {
    const history = histories[idx];
    const color = colorPalette[idx] || colorPalette[0];
    const gradientId = `league-grad-${marketId}-${idx}`;
    const currentY = 4 + (height - 8) - (outcome.odds / 100) * (height - 8);

    gradientDefs.push(`
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${color.line};stop-opacity:0.15" />
        <stop offset="100%" style="stop-color:${color.line};stop-opacity:0" />
      </linearGradient>
    `);

    areaPaths.push(`<path d="${generateLeagueAreaPath(history, width, height)}" fill="url(#${gradientId})" />`);
    linePaths.push(`<path d="${generateLeaguePath(history, width, height)}" fill="none" stroke="${color.line}" stroke-width="2" stroke-linecap="round" />`);
    dots.push(`<circle cx="${width - 4}" cy="${currentY}" r="3" fill="${color.line}" />`);
  });

  // Calculate trends for legend - matches main markets style
  const legends = outcomes.slice(0, 2).map((outcome, idx) => {
    const history = histories[idx];
    const startProb = history[0];
    const endProb = history[history.length - 1];
    const change = endProb - startProb;
    const color = colorPalette[idx] || colorPalette[0];
    const arrow = change >= 0 ? '↑' : '↓';

    return `
      <div class="flex items-center gap-1">
        <span class="w-2 h-2 rounded-full" style="background: ${color.line}"></span>
        <span class="text-xs" style="color: ${color.line}">${normalizeLeagueOutcomeName(outcome.name)}</span>
        <span class="text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}">${arrow}${Math.abs(change).toFixed(0)}¢</span>
      </div>
    `;
  });

  return `
    <div class="rounded-xl overflow-hidden bg-slate-800/30">
      <div class="flex items-center justify-between px-3 py-2">
        <span class="text-xs text-slate-500">30d Trend</span>
        <div class="flex gap-3">
          ${legends.join('')}
        </div>
      </div>
      <svg class="w-full" style="aspect-ratio: ${width} / ${height};" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>${gradientDefs.join('')}</defs>
        <!-- Grid -->
        <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="#334155" stroke-width="0.5" stroke-dasharray="2,2" />
        ${areaPaths.join('')}
        ${linePaths.join('')}
        ${dots.join('')}
      </svg>
    </div>
  `;
}

/**
 * Create a market card with probability chart for league pages
 * Matches the exact style of main markets page
 */
function createLeagueMarketCard(market, marketId) {
  // Store market data for later use
  const marketDataStr = encodeURIComponent(JSON.stringify(market));

  // Generate a description from the title
  const description = `Predict the outcome of ${market.title}. Closes ${market.closes}.`;

  return `
    <div class="market-card group relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/10 cursor-pointer rounded-2xl"
      onclick="showLeagueMarketDetail('${marketId}', decodeURIComponent('${marketDataStr}'))">
      <div class="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-600/0 group-hover:from-yellow-500/5 group-hover:to-yellow-600/5 transition-all duration-300"></div>
      <div class="relative p-4 flex flex-col gap-3">
        <div class="flex items-start justify-between">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-500 to-amber-600 text-white">Prediction</span>
          <span class="text-xs text-green-400 font-medium">🟢 Live</span>
        </div>
        ${createLeagueMultiChart(marketId, market.outcomes)}
        <h3 class="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors duration-200">${market.title}</h3>
        <p class="text-sm text-slate-400 line-clamp-2">${description}</p>
        <div class="flex gap-2">
          ${(() => {
            const isBinary = isLeagueBinaryMarket(market.outcomes);
            const colors = isBinary ? LEAGUE_BINARY_COLORS : LEAGUE_MULTI_COLORS;
            // Button style classes for each color
            const buttonStyles = isBinary 
              ? ['bg-green-500/10 border-green-500/50 hover:border-green-500 hover:bg-green-500/20', 'bg-red-500/10 border-red-500/50 hover:border-red-500 hover:bg-red-500/20']
              : ['bg-blue-500/10 border-blue-500/50 hover:border-blue-500 hover:bg-blue-500/20', 'bg-purple-500/10 border-purple-500/50 hover:border-purple-500 hover:bg-purple-500/20', 'bg-amber-500/10 border-amber-500/50 hover:border-amber-500 hover:bg-amber-500/20', 'bg-cyan-500/10 border-cyan-500/50 hover:border-cyan-500 hover:bg-cyan-500/20'];
            const textColors = isBinary 
              ? ['text-green-400', 'text-red-400']
              : ['text-blue-400', 'text-purple-400', 'text-amber-400', 'text-cyan-400'];
            return market.outcomes.map((outcome, idx) => `
              <button class="flex-1 relative overflow-hidden rounded-lg px-3 py-2 transition-all duration-200 border ${buttonStyles[idx % buttonStyles.length]} active:scale-95"
                onclick="event.stopPropagation(); openLeaguePredictionForm('${marketId}', ${idx}, '${outcome.name.replace(/'/g, "\\'")}', ${outcome.odds})">
                <div class="flex flex-col gap-1">
                  <span class="text-white font-medium text-xs text-center">${normalizeLeagueOutcomeName(outcome.name)}</span>
                  <span class="text-lg font-bold text-center ${textColors[idx % textColors.length]}">${(outcome.odds / 100).toFixed(2)}</span>
                </div>
              </button>
            `).join('');
          })()}
        </div>
      </div>
    </div>
  `;
}

// ========================================
// LEAGUE MARKET DETAIL & PREDICTION FORM
// ========================================

// Platform fee - use LMSR engine constant if available
const LEAGUE_PLATFORM_FEE = window.LMSR ? window.LMSR.PLATFORM_FEE : 0.01;

/**
 * Show league market detail view
 */
function showLeagueMarketDetail(marketId, marketDataStr) {
  const market = JSON.parse(marketDataStr);

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  const histories = generateLeagueMarketHistories(marketId, market.outcomes);
  const colorPalette = getLeagueColors(market.outcomes);

  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-start mb-6">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
              <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              Live
            </span>
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">${market.title}</h2>
          <p class="text-slate-400 text-sm">Closes: ${market.closes}</p>
        </div>
        <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-2xl ml-4">✕</button>
      </div>
      
      <!-- Large Chart -->
      <div class="bg-slate-800/30 rounded-2xl p-4 mb-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-white flex items-center gap-2">
            <span>📈</span> Price History
          </h3>
          <div class="flex gap-2">
            <button class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-300">7D</button>
            <button class="px-3 py-1 text-xs rounded-lg bg-yellow-500/20 text-yellow-400">30D</button>
            <button class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-300">ALL</button>
          </div>
        </div>
        ${createLeagueDetailChart(marketId, market.outcomes, 550, 180)}
      </div>
      
      <!-- Trading Options -->
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span style="color: rgb(212, 175, 55);"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg></span> Trading Options
      </h3>
      <div class="space-y-3 mb-6">
        ${market.outcomes.map((outcome, idx) => {
    const color = colorPalette[idx] || colorPalette[0];
    const history = histories[idx];
    const change = history[history.length - 1] - history[0];
    const changeSign = change >= 0 ? '+' : '';

    return `
            <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-yellow-500/50 transition-all"
              style="border-left: 4px solid ${color.line}">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="w-3 h-3 rounded-full" style="background: ${color.line}"></span>
                  <div>
                    <h4 class="text-white font-semibold">${normalizeLeagueOutcomeName(outcome.name)}</h4>
                    <span class="text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}">${changeSign}${change.toFixed(0)}¢ 30d</span>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-2xl font-bold" style="color: ${color.line}">${outcome.odds}¢</span>
                  <button onclick="event.stopPropagation(); this.closest('.fixed').remove(); openLeaguePredictionForm('${marketId}', ${idx}, '${outcome.name.replace(/'/g, "\\'")}', ${outcome.odds})"
                    class="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-950 font-semibold px-4 py-2 rounded-lg transition-all">
                    Trade
                  </button>
                </div>
              </div>
              <div class="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all" style="width: ${outcome.odds}%; background: ${color.line}"></div>
              </div>
            </div>
          `;
  }).join('')}
      </div>
      
      <!-- Comparison Bar -->
      <div class="bg-slate-800/30 rounded-xl p-4">
        <h4 class="text-sm font-semibold text-slate-400 mb-3">Outcome Distribution</h4>
        <div class="h-4 rounded-full overflow-hidden flex">
          ${market.outcomes.map((outcome, idx) => {
    const color = colorPalette[idx] || colorPalette[0];
    return `<div class="h-full transition-all relative group" style="width: ${outcome.odds}%; background: ${color.line}">
              <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100">${outcome.odds}¢</span>
            </div>`;
  }).join('')}
        </div>
        <div class="flex justify-between mt-2">
          ${market.outcomes.map((outcome, idx) => {
    const color = colorPalette[idx] || colorPalette[0];
    return `<span class="text-xs" style="color: ${color.line}">${normalizeLeagueOutcomeName(outcome.name)}</span>`;
  }).join('')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

/**
 * Create larger chart for detail view
 * Uses binary colors for Yes/No, multi colors otherwise
 */
function createLeagueDetailChart(marketId, outcomes, width, height) {
  const histories = generateLeagueMarketHistories(marketId, outcomes);
  const colorPalette = getLeagueColors(outcomes);
  const gradientDefs = [];
  const areaPaths = [];
  const linePaths = [];
  const dots = [];
  const legend = [];

  outcomes.forEach((outcome, idx) => {
    const history = histories[idx];
    const color = colorPalette[idx] || colorPalette[0];
    const gradientId = `detail-grad-${marketId}-${idx}`;
    const currentY = 4 + (height - 8) - (outcome.odds / 100) * (height - 8);

    gradientDefs.push(`
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${color.line};stop-opacity:0.15" />
        <stop offset="100%" style="stop-color:${color.line};stop-opacity:0" />
      </linearGradient>
    `);

    areaPaths.push(`<path d="${generateLeagueAreaPath(history, width, height)}" fill="url(#${gradientId})" />`);
    linePaths.push(`<path d="${generateLeaguePath(history, width, height)}" fill="none" stroke="${color.line}" stroke-width="2.5" stroke-linecap="round" />`);

    dots.push(`
      <circle cx="${width - 4}" cy="${currentY}" r="4" fill="${color.line}" />
      <circle cx="${width - 4}" cy="${currentY}" r="6" fill="${color.line}" opacity="0.3">
        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" begin="${idx * 0.3}s" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" begin="${idx * 0.3}s" />
      </circle>
    `);

    const startProb = history[0];
    const endProb = history[history.length - 1];
    const change = endProb - startProb;
    const changeSign = change >= 0 ? '+' : '';

    legend.push(`
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full" style="background: ${color.line}"></span>
        <span class="text-xs text-white font-medium">${normalizeLeagueOutcomeName(outcome.name)}</span>
        <span class="text-xs font-bold" style="color: ${color.line}">${outcome.odds}¢</span>
        <span class="text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}">${changeSign}${change.toFixed(0)}</span>
      </div>
    `);
  });

  return `
    <div class="relative">
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" class="rounded-xl">
        <defs>${gradientDefs.join('')}</defs>
        <line x1="0" y1="${height * 0.25}" x2="${width}" y2="${height * 0.25}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" />
        <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" />
        <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}" stroke="#334155" stroke-width="0.5" stroke-dasharray="4,4" />
        ${areaPaths.join('')}
        ${linePaths.join('')}
        ${dots.join('')}
      </svg>
      <div class="absolute left-1 top-1 text-[10px] text-slate-500">100%</div>
      <div class="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">50%</div>
      <div class="absolute left-1 bottom-1 text-[10px] text-slate-500">0%</div>
      <div class="flex flex-wrap gap-4 mt-3 justify-center">
        ${legend.join('')}
      </div>
    </div>
  `;
}

/**
 * Open prediction form for league market
 */
function openLeaguePredictionForm(marketId, outcomeIdx, outcomeName, probability) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-white">Place Trade</h3>
        <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-xl">✕</button>
      </div>
      
      <!-- Market Info -->
      <div class="bg-slate-800/50 rounded-xl p-4 mb-6">
        <p class="text-slate-400 text-sm mb-1">Trading on</p>
        <p class="text-white font-semibold text-lg">${outcomeName}</p>
        <div class="flex items-center gap-4 mt-3">
          <div>
            <p class="text-slate-500 text-xs">Price</p>
            <p class="text-yellow-400 text-2xl font-bold">${probability}¢</p>
          </div>
          <div>
            <p class="text-slate-500 text-xs">Platform Fee</p>
            <p class="text-slate-300 text-lg font-semibold">${LEAGUE_PLATFORM_FEE * 100}%</p>
          </div>
        </div>
      </div>
      
      <!-- Investment Input -->
      <div class="space-y-4">
        <div>
          <label class="text-white font-medium mb-2 block">Investment Amount ($)</label>
          <input type="number" id="leagueStakeAmount" min="1" step="0.01" placeholder="Enter amount" 
            class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 text-lg" />
        </div>
        
        <!-- Trade Outcomes -->
        <div class="grid grid-cols-2 gap-4">
          <!-- If Win -->
          <div class="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-green-400 text-lg">✓</span>
              <p class="text-green-400 font-semibold">If You Win</p>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-slate-400 text-sm">Return</span>
                <span class="text-green-400 font-bold" id="leagueWinReturn">$0.00</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400 text-sm">Profit</span>
                <span class="text-green-400 font-semibold" id="leagueWinProfit">+$0.00</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 text-xs">You return</span>
                <span class="text-green-400 text-xs font-medium" id="leagueWinReturnPercent">0%</span>
              </div>
            </div>
          </div>
          
          <!-- If Lose -->
          <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-red-400 text-lg">✗</span>
              <p class="text-red-400 font-semibold">If You Lose</p>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-slate-400 text-sm">Return</span>
                <span class="text-yellow-400 font-bold" id="leagueLoseReturn">$0.00</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400 text-sm">Loss</span>
                <span class="text-red-400 font-semibold" id="leagueLossAmount">-$0.00</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 text-xs">You return</span>
                <span class="text-yellow-400 text-xs font-medium" id="leagueLoseReturnPercent">0%</span>
              </div>
            </div>
          </div>
        </div>
        
        <button onclick="submitLeaguePrediction('${marketId}', ${outcomeIdx}, '${outcomeName.replace(/'/g, "\\'")}', ${probability})" 
          class="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-950 font-bold py-3 rounded-lg transition-all">
          Confirm Trade
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Add input listener for real-time calculations
  document.getElementById('leagueStakeAmount').addEventListener('input', function (e) {
    updateLeagueTradeCalculations(parseFloat(e.target.value) || 0, probability);
  });

  // Focus the input
  setTimeout(() => document.getElementById('leagueStakeAmount').focus(), 100);
}

/**
 * Update trade calculations in real-time using LMSR engine
 */
function updateLeagueTradeCalculations(stake, probability) {
  // Use LMSR engine if available
  if (window.LMSR) {
    const breakdown = window.LMSR.getTradeBreakdown(stake, probability);
    document.getElementById('leagueWinReturn').textContent = '$' + breakdown.win.totalReturn.toFixed(2);
    document.getElementById('leagueWinProfit').textContent = '+$' + breakdown.win.profit.toFixed(2);
    document.getElementById('leagueWinReturnPercent').textContent = breakdown.win.returnPercent.toFixed(0) + '%';
    document.getElementById('leagueLoseReturn').textContent = '$' + breakdown.lose.refund.toFixed(2);
    document.getElementById('leagueLossAmount').textContent = '-$' + breakdown.lose.loss.toFixed(2);
    document.getElementById('leagueLoseReturnPercent').textContent = breakdown.lose.returnPercent.toFixed(0) + '%';
    return;
  }

  // Fallback calculations
  const p = probability / 100;
  const f = LEAGUE_PLATFORM_FEE;
  const winProfit = stake * (1 - p) * (1 - f);
  const winReturn = stake + winProfit;
  const lossAmount = stake * (1 - p);
  const loseReturn = stake * p;
  const winReturnPercent = stake > 0 ? ((winReturn / stake) * 100).toFixed(0) : 0;
  const loseReturnPercent = stake > 0 ? ((loseReturn / stake) * 100).toFixed(0) : probability;

  document.getElementById('leagueWinReturn').textContent = '$' + winReturn.toFixed(2);
  document.getElementById('leagueWinProfit').textContent = '+$' + winProfit.toFixed(2);
  document.getElementById('leagueWinReturnPercent').textContent = winReturnPercent + '%';
  document.getElementById('leagueLoseReturn').textContent = '$' + loseReturn.toFixed(2);
  document.getElementById('leagueLossAmount').textContent = '-$' + lossAmount.toFixed(2);
  document.getElementById('leagueLoseReturnPercent').textContent = loseReturnPercent + '%';
}

/**
 * Submit league prediction using LMSR engine
 */
function submitLeaguePrediction(marketId, outcomeIdx, outcomeName, probability) {
  const stake = parseFloat(document.getElementById('leagueStakeAmount').value) || 0;

  if (stake <= 0) {
    alert('Please enter a valid investment amount');
    return;
  }

  // Get breakdown from LMSR engine
  const breakdown = window.LMSR ? window.LMSR.getTradeBreakdown(stake, probability) : null;
  const winProfit = breakdown ? breakdown.win.profit : stake * (1 - probability / 100) * (1 - LEAGUE_PLATFORM_FEE);
  const loseReturn = breakdown ? breakdown.lose.refund : stake * (probability / 100);

  // Update LMSR market state if available
  if (window.lmsrManager) {
    try {
      const side = outcomeIdx === 0 ? 'YES' : 'NO';
      window.lmsrManager.invest(String(marketId), side, stake);
      console.log('LMSR market updated for league trade');
    } catch (e) {
      const market = window.lmsrManager.getOrCreateMarket(String(marketId), 100, probability / 100);
      const side = outcomeIdx === 0 ? 'YES' : 'NO';
      market.invest(side, stake);
    }
  }

  console.log('League trade submitted:', { marketId, outcomeIdx, outcomeName, probability, stake, winProfit, loseReturn });

  // Show confirmation
  const modal = document.querySelector('.fixed');
  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-center">
      <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <span class="text-green-400 text-3xl">✓</span>
      </div>
      <h3 class="text-xl font-bold text-white mb-2">Trade Placed!</h3>
      <p class="text-slate-400 mb-4">Your $${stake.toFixed(2)} trade on "${outcomeName}" has been submitted.</p>
      <div class="bg-slate-800/50 rounded-xl p-4 mb-4 text-left">
        <div class="flex justify-between mb-2">
          <span class="text-slate-400">If you win:</span>
          <span class="text-green-400 font-semibold">+$${winProfit.toFixed(2)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">If you lose:</span>
          <span class="text-yellow-400 font-semibold">Keep $${loseReturn.toFixed(2)}</span>
        </div>
      </div>
      <button onclick="this.closest('.fixed').remove()" 
        class="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-950 font-bold py-3 rounded-lg">
        Done
      </button>
    </div>
  `;
}
