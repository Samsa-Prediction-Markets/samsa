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
  document.querySelectorAll('.interests-category-btn').forEach(btn => {
    btn.classList.remove('bg-yellow-500/20', 'text-yellow-400', 'border-yellow-500/50');
    btn.classList.add('text-slate-400', 'border-slate-700');
  });
  if (event && event.target) {
    event.target.classList.remove('text-slate-400', 'border-slate-700');
    event.target.classList.add('bg-yellow-500/20', 'text-yellow-400', 'border-yellow-500/50');
  }
  const searchInput = document.getElementById('interestsSearchInput');
  renderInterests(searchInput ? searchInput.value : '');
}

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
}

