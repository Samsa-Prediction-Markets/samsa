// ========================================
// SAMSA - NAVIGATION
// Handles navigation between views
// ========================================

/**
 * Hide all views
 */
function hideAllViews() {
  const views = [
    'marketsView',
    'detailView', 
    'interestsView',
    'subcategoryView',
    'leagueDetailView',
    'portfolioView',
    'activityView',
    'leaderboardView',
    'notificationsView',
    'settingsView',
    'dashboardView'
  ];
  
  views.forEach(viewId => {
    const el = document.getElementById(viewId);
    if (el) el.classList.add('hidden');
  });
}

/**
 * Navigate to a specific page/view
 * @param {string} page - Page name to navigate to
 */
function navigateTo(page) {
  switch (page) {
    case 'markets':
      showMarkets();
      break;
    case 'interests':
      showInterests();
      break;
    case 'portfolio':
      showPortfolio();
      break;
    case 'activity':
      showActivity();
      break;
    case 'leaderboard':
      showLeaderboard();
      break;
    case 'notifications':
      showNotifications();
      break;
    case 'settings':
      showSettings();
      break;
    case 'dashboard':
      showDashboard();
      break;
    default:
      showMarkets();
  }
  
  updateActiveNavItem(page);
}

/**
 * Show Activity view (now redirects to combined dashboard)
 */
function showActivity() {
  // Activity is now combined with dashboard
  showDashboard();
}

/**
 * Show Leaderboard view
 */
function showLeaderboard() {
  hideAllViews();
  const el = document.getElementById('leaderboardView');
  if (el) el.classList.remove('hidden');
}

// Track unread notifications count
let unreadNotificationsCount = 3;

/**
 * Show Notifications view (legacy - now uses dropdown)
 */
function showNotifications() {
  toggleNotificationsDropdown();
}

/**
 * Toggle the notifications sidebar panel on click
 */
function toggleNotificationsDropdown(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  const sidebar = document.getElementById('notificationsSidebar');
  const overlay = document.getElementById('notificationsOverlay');
  if (!sidebar) return;
  
  const isVisible = !sidebar.classList.contains('-translate-x-full');
  
  if (isVisible) {
    closeNotificationsSidebar();
  } else {
    openNotificationsSidebar();
  }
}

/**
 * Open the notifications sidebar
 */
function openNotificationsSidebar() {
  const sidebar = document.getElementById('notificationsSidebar');
  const overlay = document.getElementById('notificationsOverlay');
  
  if (sidebar) {
    sidebar.classList.remove('-translate-x-full');
  }
  if (overlay) {
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100', 'pointer-events-auto');
  }
}

/**
 * Close the notifications sidebar
 */
function closeNotificationsSidebar() {
  const sidebar = document.getElementById('notificationsSidebar');
  const overlay = document.getElementById('notificationsOverlay');
  
  if (sidebar) {
    sidebar.classList.add('-translate-x-full');
  }
  if (overlay) {
    overlay.classList.remove('opacity-100', 'pointer-events-auto');
    overlay.classList.add('opacity-0', 'pointer-events-none');
  }
}

/**
 * Update notification badge
 * @param {number} count - Number of unread notifications
 */
function updateNotificationBadge(count) {
  unreadNotificationsCount = count;
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

/**
 * Mark all notifications as read
 */
function markAllNotificationsRead() {
  updateNotificationBadge(0);
  
  // Update the notification items UI in sidebar
  const sidebar = document.getElementById('notificationsSidebar');
  if (sidebar) {
    // Remove unread dots
    sidebar.querySelectorAll('.notification-item.unread .bg-yellow-500').forEach(dot => {
      dot.remove();
    });
    
    // Mark all items as read (add opacity)
    sidebar.querySelectorAll('.notification-item.unread').forEach(item => {
      item.classList.remove('unread');
      item.classList.add('opacity-60');
    });
  }
}

/**
 * Add a new notification
 * @param {string} type - Notification type (win, update, new, etc.)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
function addNotification(type, title, message) {
  updateNotificationBadge(unreadNotificationsCount + 1);
}

/**
 * Show Settings view (includes Profile)
 */
function showSettings() {
  hideAllViews();
  const el = document.getElementById('settingsView');
  if (el) el.classList.remove('hidden');
}

/**
 * Show Dashboard view
 */
function showDashboard() {
  hideAllViews();
  const el = document.getElementById('dashboardView');
  if (el) el.classList.remove('hidden');
}

/**
 * Update the active navigation item styling
 * @param {string} activePage - Currently active page
 */
function updateActiveNavItem(activePage) {
  // Remove active state from all sidebar items
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Map page names to their sidebar item text
  const pageToText = {
    'markets': 'Explore',
    'interests': 'Interests',
    'portfolio': 'Dashboard',
    'dashboard': 'Dashboard',
    'leaderboard': 'Leaderboard',
    'notifications': 'Notifications',
    'settings': 'Settings'
  };
  
  const targetText = pageToText[activePage];
  if (targetText) {
    document.querySelectorAll('.sidebar-item').forEach(item => {
      const textEl = item.querySelector('.sidebar-item-text');
      if (textEl && textEl.textContent === targetText) {
        item.classList.add('active');
      }
    });
  }
}

/**
 * Go back to previous view
 */
function goBack() {
  showMarkets();
}

/**
 * Create page URL for navigation
 * @param {string} pageName - Name of the page
 * @returns {string} URL for the page
 */
function createPageUrl(pageName) {
  return `#${pageName.toLowerCase()}`;
}
