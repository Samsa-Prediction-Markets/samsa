// ========================================
// SAMSA - INTERESTS
// Handles interests page rendering and filtering
// ========================================

function showInterests() {
  hideAllViews();
  const el = document.getElementById('interestsView');
  if (el) { el.classList.remove('hidden'); renderInterests(); }
}

async function renderInterests(searchQuery = '') {
  const container = document.getElementById('interestsGrid');
  if (!container) return;

  container.innerHTML = '<div class="col-span-full text-center text-slate-400 py-8">Loading interests...</div>';

  if (Object.values(INTERESTS_DATA).every(arr => arr.length === 0)) {
    await loadAllInterestsData();
  }

  let filteredInterests = [];
  for (const [category, interests] of Object.entries(INTERESTS_DATA)) {
    if (currentInterestsCategory === 'all' || currentInterestsCategory === category) {
      interests.forEach(interest => {
        if (!searchQuery || interest.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          filteredInterests.push({ ...interest, category });
        }
      });
    }
  }

  if (filteredInterests.length === 0) {
    container.innerHTML = '<div class="col-span-full text-center text-slate-400 py-8">No interests found</div>';
    return;
  }

  container.innerHTML = filteredInterests.map(interest => {
    const isFollowing = isFavorited(interest.id);
    return createInterestCardHTML(interest, isFollowing);
  }).join('');
}

function createInterestCardHTML(interest, isFollowing) {
  const categories = interest.categories || [interest.category];
  const categoryBadges = categories.map(cat => {
    const displayName = cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const color = CATEGORY_COLORS[cat] || 'from-slate-500 to-slate-600';
    return `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${color} text-white">${displayName}</span>`;
  }).join('');

  // Get gold SVG icon from utility
  const icon = window.SamsaIcons ? window.SamsaIcons.getIcon(interest.name, 'w-10 h-10') : interest.image;

  return `
    <div class="interest-card bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-yellow-500/50 transition-all duration-300 rounded-2xl p-6 group">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3 flex-1">
          <div class="flex-shrink-0 w-12 h-12 flex items-center justify-center">${icon}</div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors mb-2">${interest.name}</h3>
            <div class="flex flex-wrap gap-1">${categoryBadges}</div>
          </div>
        </div>
      </div>
      <div class="flex gap-3">
        <button id="follow-btn-${interest.id}" onclick="event.stopPropagation(); handleFollowClick('${interest.id}', '${interest.name.replace(/'/g, "\\'")}', 'interest', '${interest.category}', this)"
          class="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${isFollowing
      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30'
      : 'bg-slate-800/50 text-slate-300 border border-slate-700 hover:bg-slate-700/50 hover:text-white hover:border-yellow-500/50'}">
          ${isFollowing ? '✓ Following' : '+ Follow'}
        </button>
        <button onclick="showInterestSubcategories('${interest.wikidataId}', '${interest.name.replace(/'/g, "\\'")}')"
          class="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 hover:from-yellow-400 hover:to-amber-400">
          View →
        </button>
      </div>
    </div>
  `;
}

function filterInterestsByCategory(category) {
  currentInterestsCategory = category;

  // Update all category buttons
  document.querySelectorAll('.interests-category-btn').forEach(btn => {
    const btnText = btn.textContent.toLowerCase().trim();
    const isMatch = btnText.includes(category.toLowerCase()) ||
      (category === 'all' && btnText === 'all interests');

    if (isMatch) {
      btn.classList.remove('text-slate-400', 'border-slate-700');
      btn.classList.add('bg-yellow-500/20', 'text-yellow-400', 'border-yellow-500/50');
    } else {
      btn.classList.remove('bg-yellow-500/20', 'text-yellow-400', 'border-yellow-500/50');
      btn.classList.add('text-slate-400', 'border-slate-700');
    }
  });

  const searchInput = document.getElementById('interestsSearchInput');
  renderInterests(searchInput ? searchInput.value : '');
}

// Make globally available for sidebar
window.filterInterestsByCategory = filterInterestsByCategory;

async function handleFollowClick(itemId, itemName, itemType, category, buttonElement) {
  buttonElement.disabled = true;
  buttonElement.innerHTML = '<span class="animate-pulse">...</span>';

  const isNowFollowing = await toggleFavorite(itemId, itemName, itemType, category);

  buttonElement.disabled = false;
  if (isNowFollowing) {
    buttonElement.innerHTML = '✓ Following';
    buttonElement.classList.remove('bg-slate-800/50', 'text-slate-300', 'border-slate-700');
    buttonElement.classList.add('bg-yellow-500/20', 'text-yellow-400', 'border-yellow-500/50');
  } else {
    buttonElement.innerHTML = '+ Follow';
    buttonElement.classList.remove('bg-yellow-500/20', 'text-yellow-400', 'border-yellow-500/50');
    buttonElement.classList.add('bg-slate-800/50', 'text-slate-300', 'border-slate-700');
  }

  // Update sidebar following section
  if (typeof updateSidebarFollowing === 'function') {
    updateSidebarFollowing();
  }
}

// ========================================
// SIDEBAR INTERESTS SECTION
// ========================================

const SIDEBAR_CATEGORIES = [
  { id: 'sports', name: 'Sports', icon: '🏆' },
  { id: 'politics', name: 'Politics', icon: '🏛️' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'health', name: 'Health', icon: '🏥' },
  { id: 'international', name: 'International', icon: '🌍' },
  { id: 'environment', name: 'Environment', icon: '🌿' },
  { id: 'climate', name: 'Climate', icon: '🌡️' },
  { id: 'arts_and_culture', name: 'Arts & Culture', icon: '🎬' },
  { id: 'social', name: 'Social', icon: '👥' }
];

let expandedSidebarCategory = null;

function initSidebarInterests() {
  const container = document.getElementById('sidebarInterestsContainer');
  if (!container) return;

  renderSidebarCategories();
}

function renderSidebarCategories() {
  const container = document.getElementById('sidebarInterestsContainer');
  if (!container) return;

  container.innerHTML = SIDEBAR_CATEGORIES.map(cat => {
    const isExpanded = expandedSidebarCategory === cat.id;
    return `
      <div class="sidebar-category-item">
        <button onclick="toggleSidebarCategory('${cat.id}')"
          class="w-full flex items-center justify-between py-2.5 hover:bg-slate-800/40 px-3 rounded-xl transition-colors group ${isExpanded ? 'bg-slate-800/40' : ''}">
          <div class="flex items-center gap-3">
            <span class="text-lg">${cat.icon}</span>
            <span class="text-white text-sm group-hover:text-amber-400 transition-colors ${isExpanded ? 'text-amber-400' : ''}">${cat.name}</span>
          </div>
          <span class="text-slate-600 group-hover:text-slate-400 transition-all ${isExpanded ? 'rotate-90 text-amber-400' : ''}" style="font-size: 12px;">▶</span>
        </button>
        <div id="sidebar-sub-${cat.id}" class="subcategories-container ${isExpanded ? '' : 'hidden'} pl-6 mt-1 space-y-0.5">
          ${isExpanded ? getSidebarSubcategories(cat.id) : ''}
        </div>
      </div>
    `;
  }).join('');
}

function toggleSidebarCategory(categoryId) {
  if (expandedSidebarCategory === categoryId) {
    expandedSidebarCategory = null;
  } else {
    expandedSidebarCategory = categoryId;
  }
  renderSidebarCategories();
}

function getSidebarSubcategories(categoryId) {
  // Get subcategories from TOPICS or SPORTS
  let items = [];

  if (categoryId === 'sports' && typeof SPORTS !== 'undefined') {
    items = SPORTS.map(s => ({ id: s.id, name: s.name, icon: s.icon }));
  } else if (typeof TOPICS !== 'undefined' && TOPICS[categoryId]) {
    items = TOPICS[categoryId].map(t => ({ id: t.id, name: t.name, icon: t.icon }));
  }

  if (items.length === 0) {
    return '<div class="text-slate-500 text-xs py-2 px-3">No subcategories</div>';
  }

  return items.map(item => `
    <button onclick="navigateToSubcategory('${item.id}', '${item.name.replace(/'/g, "\\'")}', '${categoryId}')"
      class="w-full flex items-center gap-2 py-2 px-3 hover:bg-slate-800/50 rounded-lg transition-colors group text-left">
      <span class="text-sm">${item.icon || '•'}</span>
      <span class="text-slate-300 text-xs group-hover:text-amber-400 transition-colors truncate">${item.name}</span>
    </button>
  `).join('');
}

function navigateToSubcategory(itemId, itemName, categoryId) {
  // Navigate to the subcategories view for this item
  if (typeof showInterestSubcategories === 'function') {
    showInterestSubcategories(itemId, itemName);
  } else {
    // Fallback: just navigate to interests page with category filter
    navigateTo('interests');
    setTimeout(() => filterInterestsByCategory(categoryId), 100);
  }
}

// ========================================
// SIDEBAR FOLLOWING SECTION
// ========================================

function updateSidebarFollowing() {
  const container = document.getElementById('sidebarFollowingContainer');
  const countEl = document.getElementById('followingCount');
  if (!container) return;

  const favorites = Storage.load('favorites', []);

  if (countEl) {
    countEl.textContent = `${favorites.length} interest${favorites.length !== 1 ? 's' : ''}`;
  }

  if (favorites.length === 0) {
    container.innerHTML = `
      <div class="text-slate-500 text-sm text-center py-4">
        <p>No interests followed yet</p>
        <p class="text-xs mt-1">Follow interests to see them here</p>
      </div>
    `;
    return;
  }

  container.innerHTML = favorites.filter(fav => fav && fav.name).map(fav => {
    const icon = getCategoryIcon(fav.category);
    const safeName = (fav.name || '').replace(/'/g, "\\'");
    return `
      <div class="flex items-center justify-between py-2 hover:bg-slate-800/40 px-3 rounded-xl cursor-pointer transition-colors group"
           onclick="navigateToSubcategory('${fav.id}', '${safeName}', '${fav.category || ''}')">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <span class="text-sm">${icon}</span>
          <span class="text-white text-sm truncate group-hover:text-amber-400 transition-colors">${fav.name}</span>
        </div>
        <button onclick="event.stopPropagation(); unfollowFromSidebar('${fav.id}')"
          class="text-slate-600 hover:text-red-400 transition-colors p-1" title="Unfollow">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');
}

function unfollowFromSidebar(itemId) {
  const favorites = Storage.load('favorites', []);
  const index = favorites.findIndex(f => f.id === itemId);
  if (index >= 0) {
    favorites.splice(index, 1);
    Storage.save('favorites', favorites);
    updateSidebarFollowing();
  }
}

function getCategoryIcon(category) {
  const icons = {
    sports: '🏆', politics: '🏛️', finance: '💰', technology: '💻',
    science: '🔬', health: '🏥', international: '🌍', environment: '🌿',
    climate: '🌡️', arts_and_culture: '🎬', social: '👥'
  };
  return icons[category] || '📌';
}

// ========================================
// SIDEBAR WATCHLIST SECTION
// ========================================

function updateSidebarWatchlist() {
  const container = document.getElementById('sidebarWatchlistContainer');
  const countEl = document.getElementById('watchlistCount');
  if (!container) return;

  const watchlist = Storage.load('watchlist', []);

  if (countEl) {
    countEl.textContent = `${watchlist.length} market${watchlist.length !== 1 ? 's' : ''}`;
  }

  if (watchlist.length === 0) {
    container.innerHTML = `
      <div class="text-slate-500 text-sm text-center py-4">
        <p>No markets watchlisted</p>
        <p class="text-xs mt-1">Add markets to track them here</p>
      </div>
    `;
    return;
  }

  // Get market data to show probabilities
  const marketData = typeof markets !== 'undefined' ? markets : [];

  container.innerHTML = watchlist.map(item => {
    const market = marketData.find(m => m.id === item.id);
    const prob = market && market.outcomes && market.outcomes[0] ? market.outcomes[0].probability : null;
    const probDisplay = prob !== null ? `${prob}¢` : '';
    const categoryIcon = getCategoryIcon(item.category);

    return `
      <div class="flex items-center justify-between py-2 hover:bg-slate-800/40 px-3 rounded-xl cursor-pointer transition-colors group"
           onclick="showDetail('${item.id}')">
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm truncate group-hover:text-amber-400 transition-colors">${item.title}</p>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-xs">${categoryIcon}</span>
            ${probDisplay ? `<span class="text-green-400 text-xs font-medium">${probDisplay}</span>` : ''}
          </div>
        </div>
        <button onclick="event.stopPropagation(); removeFromWatchlist('${item.id}')"
          class="text-slate-600 hover:text-red-400 transition-colors p-1 ml-2" title="Remove from watchlist">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');
}

function removeFromWatchlist(marketId) {
  const watchlist = Storage.load('watchlist', []);
  const index = watchlist.findIndex(w => w.id === marketId);
  if (index >= 0) {
    watchlist.splice(index, 1);
    Storage.save('watchlist', watchlist);
    updateSidebarWatchlist();
    // Update any watchlist buttons on the page
    updateWatchlistButtons(marketId, false);
  }
}

function updateWatchlistButtons(marketId, isWatchlisted) {
  document.querySelectorAll(`[data-watchlist-id="${marketId}"]`).forEach(btn => {
    if (isWatchlisted) {
      btn.innerHTML = '★';
      btn.classList.remove('text-slate-500', 'hover:text-amber-400');
      btn.classList.add('text-amber-400', 'hover:text-amber-300');
      btn.title = 'Remove from watchlist';
    } else {
      btn.innerHTML = '☆';
      btn.classList.remove('text-amber-400', 'hover:text-amber-300');
      btn.classList.add('text-slate-500', 'hover:text-amber-400');
      btn.title = 'Add to watchlist';
    }
  });
}

// Initialize sidebar interests when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  // Small delay to ensure TOPICS/SPORTS are loaded
  setTimeout(() => {
    initSidebarInterests();
    updateSidebarFollowing();
    updateSidebarWatchlist();
    // Initialize dashboard sidebar sections (collapsed by default, expand on click)
    if (typeof initDashboardSections === 'function') {
      initDashboardSections();
    }
  }, 100);
});

// Make functions globally available
window.toggleSidebarCategory = toggleSidebarCategory;
window.navigateToSubcategory = navigateToSubcategory;
window.initSidebarInterests = initSidebarInterests;
window.updateSidebarFollowing = updateSidebarFollowing;
window.updateSidebarWatchlist = updateSidebarWatchlist;
window.unfollowFromSidebar = unfollowFromSidebar;
window.removeFromWatchlist = removeFromWatchlist;
window.updateWatchlistButtons = updateWatchlistButtons;

