// ============================================================================
// SAMSA - APP INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async function () {
  const authReady = Auth.init();
  if (authReady) {
    try { await Auth.logout(); } catch (e) {}
  }
  if (!Auth.session()) {
    document.getElementById('authView')?.classList.remove('hidden');
  }
  await API.init();
  if (Auth.session()) {
    if (typeof initializeWallet === 'function') {
      await initializeWallet();
    }
    loadLocalFavorites();
    await renderMarkets();
    document.getElementById('searchInput')?.addEventListener('input', filterMarkets);
    document.getElementById('interestsSearchInput')?.addEventListener('input', function() {
      renderInterests(this.value);
    });
    setupActivityFilters();
    loadAllInterestsData().catch(e => console.log('Background load:', e));
    showDashboard();
    updateActiveNavItem('dashboard');
    if (typeof initPortfolioChart === 'function') {
      initPortfolioChart();
    }
  }
  attachAuthHandlers();
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

function attachAuthHandlers() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const resetForm = document.getElementById('resetForm');
  const switchToSignupBtn = document.getElementById('switchToSignupBtn');
  const switchToLoginBtn = document.getElementById('switchToLoginBtn');
  const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
  const backToLoginBtn = document.getElementById('backToLoginBtn');
  const setPwToggle = (btnId, inputId) => {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (btn && input) {
      btn.addEventListener('click', () => {
        const isPassword = input.getAttribute('type') === 'password';
        input.setAttribute('type', isPassword ? 'text' : 'password');
        btn.textContent = isPassword ? 'Hide' : 'Show';
        btn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
      });
    }
  };
  setPwToggle('loginPasswordToggle', 'loginPassword');
  setPwToggle('signupPasswordToggle', 'signupPassword');
  setPwToggle('signupConfirmToggle', 'signupConfirm');
  if (switchToSignupBtn) switchToSignupBtn.addEventListener('click', () => {
    document.getElementById('authError')?.classList.add('hidden');
    document.getElementById('signupError')?.classList.add('hidden');
    document.getElementById('resetError')?.classList.add('hidden');
    document.getElementById('loginCard')?.classList.add('hidden');
    document.getElementById('resetCard')?.classList.add('hidden');
    document.getElementById('signupCard')?.classList.remove('hidden');
    document.getElementById('signupEmail')?.focus();
  });
  if (switchToLoginBtn) switchToLoginBtn.addEventListener('click', () => {
    document.getElementById('signupError')?.classList.add('hidden');
    document.getElementById('resetError')?.classList.add('hidden');
    document.getElementById('signupCard')?.classList.add('hidden');
    document.getElementById('resetCard')?.classList.add('hidden');
    document.getElementById('loginCard')?.classList.remove('hidden');
    document.getElementById('loginEmail')?.focus();
  });
  if (forgotPasswordBtn) forgotPasswordBtn.addEventListener('click', () => {
    document.getElementById('authError')?.classList.add('hidden');
    document.getElementById('signupError')?.classList.add('hidden');
    document.getElementById('loginCard')?.classList.add('hidden');
    document.getElementById('signupCard')?.classList.add('hidden');
    document.getElementById('resetCard')?.classList.remove('hidden');
    document.getElementById('resetEmail')?.focus();
  });
  if (backToLoginBtn) backToLoginBtn.addEventListener('click', () => {
    document.getElementById('resetError')?.classList.add('hidden');
    document.getElementById('signupCard')?.classList.add('hidden');
    document.getElementById('resetCard')?.classList.add('hidden');
    document.getElementById('loginCard')?.classList.remove('hidden');
    document.getElementById('loginEmail')?.focus();
  });
  if (loginForm) loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = (document.getElementById('loginEmail')?.value || '').trim();
    const password = document.getElementById('loginPassword')?.value || '';
    const errorEl = document.getElementById('authError');
    const btn = document.getElementById('loginSubmit');
    if (!Auth.validateEmail(email)) {
      document.getElementById('loginEmailError')?.classList.remove('hidden');
      document.getElementById('loginEmailError').textContent = 'Enter a valid email';
      return;
    }
    if (!password) {
      document.getElementById('loginPasswordError')?.classList.remove('hidden');
      document.getElementById('loginPasswordError').textContent = 'Enter your password';
      return;
    }
    btn.disabled = true;
    try {
      await Auth.login(email, password);
      document.getElementById('authView')?.classList.add('hidden');
      showDashboard();
      updateActiveNavItem('dashboard');
      loadLocalFavorites();
      await renderMarkets();
    } catch (e) {
      errorEl?.classList.remove('hidden');
      if (errorEl) errorEl.textContent = e.message;
    } finally {
      btn.disabled = false;
    }
  });
  if (signupForm) signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = (document.getElementById('signupEmail')?.value || '').trim();
    const password = document.getElementById('signupPassword')?.value || '';
    const confirm = document.getElementById('signupConfirm')?.value || '';
    const errorEl = document.getElementById('signupError');
    const btn = document.getElementById('signupSubmit');
    if (!Auth.validateEmail(email)) {
      errorEl?.classList.remove('hidden');
      if (errorEl) errorEl.textContent = 'Enter a valid email';
      return;
    }
    if (!Auth.validatePassword(password)) {
      errorEl?.classList.remove('hidden');
      if (errorEl) errorEl.textContent = 'Password must be at least 8 characters';
      return;
    }
    if (password !== confirm) {
      errorEl?.classList.remove('hidden');
      if (errorEl) errorEl.textContent = 'Passwords do not match';
      return;
    }
    btn.disabled = true;
    try {
      await Auth.signup(email, password);
      errorEl?.classList.remove('hidden');
      if (errorEl) errorEl.textContent = 'Check your email to verify your account';
    } catch (e) {
      errorEl?.classList.remove('hidden');
      if (errorEl) errorEl.textContent = e.message;
    } finally {
      btn.disabled = false;
    }
  });
  if (resetForm) resetForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = (document.getElementById('resetEmail')?.value || '').trim();
    const errorEl = document.getElementById('resetError');
    const btn = document.getElementById('resetSubmit');
    if (!Auth.validateEmail(email)) {
      errorEl?.classList.remove('hidden');
      if (errorEl) errorEl.textContent = 'Enter a valid email';
      return;
    }
    btn.disabled = true;
    try {
      const origin = window.location.origin;
      const redirectTo = origin + '/';
      await Auth.resetPassword(email, redirectTo);
      errorEl?.classList.remove('hidden');
      if (errorEl) errorEl.textContent = 'Check your email for a reset link';
    } catch (e) {
      errorEl?.classList.remove('hidden');
      if (errorEl) errorEl.textContent = e.message;
    } finally {
      btn.disabled = false;
    }
  });
}
