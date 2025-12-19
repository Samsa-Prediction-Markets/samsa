// ========================================
// SAMSA - WALLET
// Handles wallet, deposits, and withdrawals
// ========================================

// Default user ID (in production, this would come from auth)
const DEFAULT_USER_ID = 'user_default';

// Wallet state
let walletState = {
  userId: DEFAULT_USER_ID,
  balance: 0,
  totalDeposited: 0,
  totalWithdrawn: 0,
  activeStakes: 0,
  isLoading: false,
  transactions: []
};

/**
 * Initialize wallet - fetch balance from API
 */
async function initializeWallet() {
  walletState.isLoading = true;
  updateWalletUI();
  
  try {
    const response = await fetch(`/api/users/${walletState.userId}/balance`);
    if (response.ok) {
      const data = await response.json();
      walletState.balance = data.balance || 0;
      walletState.totalDeposited = data.total_deposited || 0;
      walletState.totalWithdrawn = data.total_withdrawn || 0;
      walletState.activeStakes = data.active_stakes || 0;
      console.log('✅ Wallet initialized:', {
        balance: walletState.balance,
        totalDeposited: walletState.totalDeposited,
        totalWithdrawn: walletState.totalWithdrawn
      });
    } else {
      // API returned error, start with $0
      walletState.balance = 0;
      walletState.totalDeposited = 0;
      walletState.totalWithdrawn = 0;
    }
  } catch (error) {
    console.log('⚠️ Could not fetch wallet balance:', error.message);
    walletState.balance = 0;
    walletState.totalDeposited = 0;
    walletState.totalWithdrawn = 0;
  }
  
  walletState.isLoading = false;
  updateWalletUI();
}

/**
 * Update wallet UI elements
 */
function updateWalletUI() {
  // Update buying power display
  const buyingPowerEl = document.getElementById('buyingPowerAmount');
  if (buyingPowerEl) {
    buyingPowerEl.textContent = `$${walletState.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  // Update portfolio value (balance + predictions value)
  const portfolioValueEl = document.getElementById('portfolioValue');
  if (portfolioValueEl) {
    // Calculate total portfolio value = cash balance + active predictions value
    const activePredictionsValue = (predictions || [])
      .filter(p => p.status === 'active')
      .reduce((sum, p) => sum + (p.stake || p.stake_amount || 0), 0);
    const totalValue = walletState.balance + activePredictionsValue;
    portfolioValueEl.textContent = `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  // Update deposit modal if open
  const depositBalanceEl = document.getElementById('depositCurrentBalance');
  if (depositBalanceEl) {
    depositBalanceEl.textContent = `$${walletState.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  // Update portfolio chart to sync with new values
  if (typeof updatePortfolioChart === 'function') {
    updatePortfolioChart();
  }
}

/**
 * Get current balance
 */
function getBalance() {
  return walletState.balance;
}

/**
 * Check if user has sufficient balance
 */
function hasSufficientBalance(amount) {
  return walletState.balance >= amount;
}

/**
 * Open deposit modal
 */
function openDepositModal() {
  const modal = document.createElement('div');
  modal.id = 'depositModal';
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <span style="color: rgb(212, 175, 55);">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6" />
            </svg>
          </span>
          Deposit Funds
        </h3>
        <button onclick="closeDepositModal()" class="text-slate-400 hover:text-white text-xl">✕</button>
      </div>
      
      <!-- Current Balance -->
      <div class="bg-slate-800/50 rounded-xl p-4 mb-6">
        <p class="text-slate-400 text-sm mb-1">Current Balance</p>
        <p id="depositCurrentBalance" class="text-2xl font-bold text-white">$${walletState.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      
      <!-- Amount Input -->
      <div class="space-y-4">
        <div>
          <label class="text-white font-medium mb-2 block">Deposit Amount ($)</label>
          <input type="number" id="depositAmount" min="1" max="10000" step="0.01" placeholder="Enter amount" 
            class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 text-lg" />
        </div>
        
        <!-- Quick Amount Buttons -->
        <div class="grid grid-cols-4 gap-2">
          <button onclick="setDepositAmount(25)" class="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg hover:border-yellow-500/50 transition-all text-sm font-medium">$25</button>
          <button onclick="setDepositAmount(50)" class="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg hover:border-yellow-500/50 transition-all text-sm font-medium">$50</button>
          <button onclick="setDepositAmount(100)" class="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg hover:border-yellow-500/50 transition-all text-sm font-medium">$100</button>
          <button onclick="setDepositAmount(500)" class="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg hover:border-yellow-500/50 transition-all text-sm font-medium">$500</button>
        </div>
        
        <!-- Payment Method -->
        <div>
          <label class="text-white font-medium mb-2 block">Payment Method</label>
          <div class="grid grid-cols-2 gap-3">
            <button id="paymentCard" onclick="selectPaymentMethod('card')" class="payment-method-btn selected p-4 bg-slate-800 border-2 border-yellow-500/50 rounded-xl text-left transition-all">
              <div class="flex items-center gap-3">
                <span class="text-yellow-400">💳</span>
                <div>
                  <p class="text-white font-medium">Card</p>
                  <p class="text-slate-400 text-xs">Instant</p>
                </div>
              </div>
            </button>
            <button id="paymentBank" onclick="selectPaymentMethod('bank')" class="payment-method-btn p-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-left transition-all hover:border-slate-600">
              <div class="flex items-center gap-3">
                <span class="text-slate-400">🏦</span>
                <div>
                  <p class="text-white font-medium">Bank</p>
                  <p class="text-slate-400 text-xs">1-3 days</p>
                </div>
              </div>
            </button>
          </div>
        </div>
        
        <!-- New Balance Preview -->
        <div id="newBalancePreview" class="hidden bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div class="flex justify-between">
            <span class="text-slate-400">New Balance</span>
            <span id="newBalanceAmount" class="text-green-400 font-bold">$0.00</span>
          </div>
        </div>
        
        <button id="confirmDepositBtn" onclick="confirmDeposit()" 
          class="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-950 font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled>
          Deposit Funds
        </button>
        
        <p class="text-slate-500 text-xs text-center">
          Demo mode: No real payment required. Funds are added instantly.
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Add input listener
  document.getElementById('depositAmount').addEventListener('input', function(e) {
    updateDepositPreview(parseFloat(e.target.value) || 0);
  });
  
  setTimeout(() => document.getElementById('depositAmount').focus(), 100);
}

/**
 * Set deposit amount from quick buttons
 */
function setDepositAmount(amount) {
  document.getElementById('depositAmount').value = amount;
  updateDepositPreview(amount);
}

/**
 * Select payment method
 */
let selectedPaymentMethod = 'card';
function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  document.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.classList.remove('selected', 'border-yellow-500/50');
    btn.classList.add('border-slate-700');
  });
  const selectedBtn = document.getElementById(method === 'card' ? 'paymentCard' : 'paymentBank');
  selectedBtn.classList.add('selected', 'border-yellow-500/50');
  selectedBtn.classList.remove('border-slate-700');
}

/**
 * Update deposit preview
 */
function updateDepositPreview(amount) {
  const preview = document.getElementById('newBalancePreview');
  const newBalanceEl = document.getElementById('newBalanceAmount');
  const confirmBtn = document.getElementById('confirmDepositBtn');
  
  if (amount > 0 && amount <= 10000) {
    const newBalance = walletState.balance + amount;
    newBalanceEl.textContent = `$${newBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    preview.classList.remove('hidden');
    confirmBtn.disabled = false;
  } else {
    preview.classList.add('hidden');
    confirmBtn.disabled = true;
  }
}

/**
 * Confirm deposit
 */
async function confirmDeposit() {
  const amount = parseFloat(document.getElementById('depositAmount').value) || 0;
  
  if (amount <= 0 || amount > 10000) {
    alert('Please enter a valid amount between $1 and $10,000');
    return;
  }
  
  const confirmBtn = document.getElementById('confirmDepositBtn');
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<span class="animate-pulse">Processing...</span>';
  
  try {
    const response = await fetch(`/api/users/${walletState.userId}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        payment_method: selectedPaymentMethod
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      walletState.balance = data.new_balance;
      walletState.totalDeposited += amount; // Track total deposited
      updateWalletUI();
      
      // Show success
      const modal = document.getElementById('depositModal');
      modal.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-center">
          <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-green-400 text-3xl">✓</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Deposit Successful!</h3>
          <p class="text-slate-400 mb-4">$${amount.toFixed(2)} has been added to your account.</p>
          <div class="bg-slate-800/50 rounded-xl p-4 mb-4">
            <p class="text-slate-400 text-sm">New Balance</p>
            <p class="text-2xl font-bold text-green-400">$${walletState.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <button onclick="closeDepositModal()" 
            class="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-950 font-bold py-3 rounded-lg">
            Done
          </button>
        </div>
      `;
    } else {
      const error = await response.json();
      alert('Deposit failed: ' + (error.error || 'Unknown error'));
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = 'Deposit Funds';
    }
  } catch (error) {
    // Demo mode fallback - just add the balance locally
    walletState.balance += amount;
    walletState.totalDeposited += amount; // Track total deposited
    updateWalletUI();
    
    const modal = document.getElementById('depositModal');
    modal.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-center">
        <div class="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-yellow-400 text-3xl">✓</span>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Demo Deposit Added!</h3>
        <p class="text-slate-400 mb-4">$${amount.toFixed(2)} has been added to your demo account.</p>
        <div class="bg-slate-800/50 rounded-xl p-4 mb-4">
          <p class="text-slate-400 text-sm">New Balance</p>
          <p class="text-2xl font-bold text-yellow-400">$${walletState.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <button onclick="closeDepositModal()" 
          class="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-950 font-bold py-3 rounded-lg">
          Done
        </button>
      </div>
    `;
  }
}

/**
 * Close deposit modal
 */
function closeDepositModal() {
  const modal = document.getElementById('depositModal');
  if (modal) modal.remove();
}

/**
 * Open withdraw modal
 */
function openWithdrawModal() {
  const modal = document.createElement('div');
  modal.id = 'withdrawModal';
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <span style="color: rgb(212, 175, 55);">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </span>
          Withdraw Funds
        </h3>
        <button onclick="closeWithdrawModal()" class="text-slate-400 hover:text-white text-xl">✕</button>
      </div>
      
      <!-- Available Balance -->
      <div class="bg-slate-800/50 rounded-xl p-4 mb-6">
        <p class="text-slate-400 text-sm mb-1">Available Balance</p>
        <p class="text-2xl font-bold text-white">$${walletState.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      
      <!-- Amount Input -->
      <div class="space-y-4">
        <div>
          <label class="text-white font-medium mb-2 block">Withdraw Amount ($)</label>
          <input type="number" id="withdrawAmount" min="1" max="${walletState.balance}" step="0.01" placeholder="Enter amount" 
            class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 text-lg" />
        </div>
        
        <!-- Withdraw All Button -->
        <button onclick="setWithdrawAmount(${walletState.balance})" 
          class="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:border-yellow-500/50 transition-all text-sm font-medium">
          Withdraw All ($${walletState.balance.toFixed(2)})
        </button>
        
        <button id="confirmWithdrawBtn" onclick="confirmWithdraw()" 
          class="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-950 font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled>
          Withdraw Funds
        </button>
        
        <p class="text-slate-500 text-xs text-center">
          Withdrawals typically process in 1-3 business days.
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Add input listener
  document.getElementById('withdrawAmount').addEventListener('input', function(e) {
    const amount = parseFloat(e.target.value) || 0;
    document.getElementById('confirmWithdrawBtn').disabled = amount <= 0 || amount > walletState.balance;
  });
  
  setTimeout(() => document.getElementById('withdrawAmount').focus(), 100);
}

/**
 * Set withdraw amount
 */
function setWithdrawAmount(amount) {
  document.getElementById('withdrawAmount').value = amount;
  document.getElementById('confirmWithdrawBtn').disabled = false;
}

/**
 * Confirm withdraw
 */
async function confirmWithdraw() {
  const amount = parseFloat(document.getElementById('withdrawAmount').value) || 0;
  
  if (amount <= 0 || amount > walletState.balance) {
    alert('Please enter a valid amount');
    return;
  }
  
  const confirmBtn = document.getElementById('confirmWithdrawBtn');
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<span class="animate-pulse">Processing...</span>';
  
  try {
    const response = await fetch(`/api/users/${walletState.userId}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, withdrawal_method: 'bank' })
    });
    
    if (response.ok) {
      const data = await response.json();
      walletState.balance = data.new_balance;
      walletState.totalWithdrawn += amount; // Track total withdrawn
      updateWalletUI();
      closeWithdrawModal();
      alert(`Withdrawal of $${amount.toFixed(2)} initiated. It will be processed in 1-3 business days.`);
    } else {
      const error = await response.json();
      alert('Withdrawal failed: ' + (error.error || 'Unknown error'));
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = 'Withdraw Funds';
    }
  } catch (error) {
    // Demo mode fallback
    walletState.balance -= amount;
    walletState.totalWithdrawn += amount; // Track total withdrawn
    updateWalletUI();
    closeWithdrawModal();
    alert(`Demo withdrawal of $${amount.toFixed(2)} processed.`);
  }
}

/**
 * Close withdraw modal
 */
function closeWithdrawModal() {
  const modal = document.getElementById('withdrawModal');
  if (modal) modal.remove();
}

/**
 * Deduct balance when placing a trade
 */
async function deductBalance(amount) {
  if (!hasSufficientBalance(amount)) {
    return false;
  }
  
  walletState.balance -= amount;
  updateWalletUI();
  return true;
}

/**
 * Add balance (for winnings)
 */
function addBalance(amount) {
  walletState.balance += amount;
  updateWalletUI();
}

// Make functions globally available
window.initializeWallet = initializeWallet;
window.getBalance = getBalance;
window.hasSufficientBalance = hasSufficientBalance;
window.openDepositModal = openDepositModal;
window.closeDepositModal = closeDepositModal;
window.openWithdrawModal = openWithdrawModal;
window.closeWithdrawModal = closeWithdrawModal;
window.setDepositAmount = setDepositAmount;
window.selectPaymentMethod = selectPaymentMethod;
window.confirmDeposit = confirmDeposit;
window.setWithdrawAmount = setWithdrawAmount;
window.confirmWithdraw = confirmWithdraw;
window.deductBalance = deductBalance;
window.addBalance = addBalance;
window.updateWalletUI = updateWalletUI;
window.walletState = walletState;

