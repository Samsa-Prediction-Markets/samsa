// ============================================================================
// SAMSA - APP INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async function () {
  // Initialize API
  await API.init();
  
  // Initialize wallet
  if (typeof initializeWallet === 'function') {
    await initializeWallet();
  }
  
  // Load user data
  loadLocalFavorites();

  // Render markets (API first, fallback to sample)
  await renderMarkets();

  // Setup search handlers
  document.getElementById('searchInput')?.addEventListener('input', filterMarkets);
  document.getElementById('interestsSearchInput')?.addEventListener('input', function() {
    renderInterests(this.value);
  });

  // Setup activity filter handlers
  setupActivityFilters();

  // Load interests data in background
  loadAllInterestsData().catch(e => console.log('Background load:', e));

  // Show dashboard/portfolio by default
  showDashboard();
  updateActiveNavItem('dashboard');
  
  // Initialize portfolio chart
  if (typeof initPortfolioChart === 'function') {
    initPortfolioChart();
  }

  console.log('✓ Samsa initialized');
});

/**
 * Setup activity filter button handlers
 */
function setupActivityFilters() {
  document.querySelectorAll('.activity-filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const filter = this.dataset.filter;
      
      // Update button styles
      document.querySelectorAll('.activity-filter-btn').forEach(b => {
        b.classList.remove('bg-slate-800', 'text-white');
        b.classList.add('text-slate-400');
      });
      this.classList.remove('text-slate-400');
      this.classList.add('bg-slate-800', 'text-white');
      
      // Filter activity items
      const items = document.querySelectorAll('#activityList > div[data-type]');
      items.forEach(item => {
        if (filter === 'all' || item.dataset.type === filter) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

