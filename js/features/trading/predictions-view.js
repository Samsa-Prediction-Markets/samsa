// ========================================
// SAMSA - PREDICTIONS
// Handles prediction form modal with LMSR trading model
// Uses the LMSR engine for all calculations
// ========================================

// Use LMSR engine constants and functions
const PLATFORM_FEE = window.LMSR ? window.LMSR.PLATFORM_FEE : 0.01;

/**
 * Normalize outcome title - converts "Yes, Banned" → "Yes", "No, Still Operating" → "No"
 */
function normalizePredictionOutcomeTitle(title) {
  const lower = (title || '').toLowerCase().trim();
  if (lower === 'yes' || lower.startsWith('yes,') || lower.startsWith('yes ')) {
    return 'Yes';
  }
  if (lower === 'no' || lower.startsWith('no,') || lower.startsWith('no ')) {
    return 'No';
  }
  return title;
}

// Wrapper functions that delegate to LMSR engine
function calcWinProfit(stake, probability, fee = PLATFORM_FEE) {
  return window.LMSR ? window.LMSR.calcWinProfit(stake, probability, fee) : stake * (1 - (probability > 1 ? probability / 100 : probability)) * (1 - fee);
}

function calcWinReturn(stake, probability, fee = PLATFORM_FEE) {
  return window.LMSR ? window.LMSR.calcWinReturn(stake, probability, fee) : stake + calcWinProfit(stake, probability, fee);
}

function calcLossAmount(stake, probability) {
  return window.LMSR ? window.LMSR.calcLossAmount(stake, probability) : stake * (1 - (probability > 1 ? probability / 100 : probability));
}

function calcLoseReturn(stake, probability) {
  return window.LMSR ? window.LMSR.calcLoseReturn(stake, probability) : stake * (probability > 1 ? probability / 100 : probability);
}

// Track currently selected outcome for inline form
let currentInlineSelection = null;

/**
 * Show inline trading form in the sidebar (replaces stats card temporarily)
 */
function showInlineTradingForm(marketId, outcomeId) {
  const market = markets.find(m => String(m.id) === String(marketId));
  if (!market) {
    console.error('Market not found:', marketId);
    return;
  }
  const outcome = market.outcomes.find(o => String(o.id) === String(outcomeId));
  if (!outcome) {
    console.error('Outcome not found:', outcomeId);
    return;
  }
  
  const probability = outcome.probability;
  const container = document.getElementById('inlineTradingForm');
  const statsCard = document.getElementById('statsCard');
  
  if (!container) {
    // Fallback to modal if container doesn't exist
    openPredictionForm(marketId, outcomeId);
    return;
  }

  // Update button states - highlight selected
  document.querySelectorAll('.outcome-btn').forEach(btn => {
    btn.classList.remove('ring-2', 'ring-yellow-500', 'ring-offset-2', 'ring-offset-slate-950');
  });
  const selectedBtn = document.getElementById(`outcomeBtn-${outcomeId}`);
  if (selectedBtn) {
    selectedBtn.classList.add('ring-2', 'ring-yellow-500', 'ring-offset-2', 'ring-offset-slate-950');
  }

  // Store current selection
  currentInlineSelection = { marketId, outcomeId, probability };

  // Hide stats card and show trading form
  if (statsCard) statsCard.classList.add('hidden');
  container.classList.remove('hidden');

  // Determine colors based on outcome
  const isYes = normalizePredictionOutcomeTitle(outcome.title).toLowerCase() === 'yes';
  const isBinary = market.outcomes.length === 2 && 
    market.outcomes.some(o => normalizePredictionOutcomeTitle(o.title).toLowerCase() === 'yes') &&
    market.outcomes.some(o => normalizePredictionOutcomeTitle(o.title).toLowerCase() === 'no');

  container.innerHTML = `
    <div class="bg-slate-900/80 border border-yellow-500/50 rounded-xl overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-white font-semibold text-sm">Place Trade</span>
          <span class="px-2 py-0.5 rounded text-xs font-medium ${isBinary ? (isYes ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400') : 'bg-yellow-500/20 text-yellow-400'}">${normalizePredictionOutcomeTitle(outcome.title)}</span>
        </div>
        <button onclick="hideInlineTradingForm()" class="text-slate-400 hover:text-white text-sm">✕</button>
      </div>
      
      <div class="p-4 space-y-4">
        <!-- Price Display -->
        <div class="flex items-center justify-between">
          <span class="text-slate-400 text-sm">Current Price</span>
          <span class="text-2xl font-bold ${isBinary ? (isYes ? 'text-green-400' : 'text-red-400') : 'text-yellow-400'}">${probability}¢</span>
        </div>

        <!-- Investment Input -->
        <div>
          <label class="text-slate-400 text-xs mb-1 block">Investment Amount</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
            <input type="number" id="inlineStakeAmount" min="1" step="0.01" placeholder="0.00" 
              class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-7 pr-4 py-2.5 focus:outline-none focus:border-yellow-500/50 text-lg" />
          </div>
        </div>

        <!-- Quick Amounts -->
        <div class="flex gap-2">
          ${['5', '10', '25', '50', '100'].map(amt => `
            <button onclick="document.getElementById('inlineStakeAmount').value='${amt}'; updateInlineTradeCalculations(${amt}, ${probability})" 
              class="flex-1 py-1.5 text-xs rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">$${amt}</button>
          `).join('')}
        </div>

        <!-- Trade Outcomes - Compact -->
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <p class="text-green-400 text-xs font-medium mb-1">If Win</p>
            <p class="text-green-400 font-bold" id="inlineWinReturn">$0.00</p>
            <p class="text-green-400/70 text-xs" id="inlineWinProfit">+$0.00</p>
          </div>
          <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p class="text-red-400 text-xs font-medium mb-1">If Lose</p>
            <p class="text-yellow-400 font-bold" id="inlineLoseReturn">$0.00</p>
            <p class="text-red-400/70 text-xs" id="inlineLossAmount">-$0.00</p>
          </div>
        </div>

        <!-- Balance -->
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-500">Available Balance</span>
          <span class="text-green-400 font-medium">$${typeof getBalance === 'function' ? getBalance().toFixed(2) : '0.00'}</span>
        </div>

        <!-- Confirm Button -->
        <button onclick="submitInlinePrediction('${marketId}', '${outcomeId}', ${probability})" 
          class="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-950 font-bold py-3 rounded-lg transition-all">
          Confirm Trade
        </button>
      </div>
    </div>
  `;

  // Add input listener for real-time calculations
  document.getElementById('inlineStakeAmount').addEventListener('input', function(e) {
    updateInlineTradeCalculations(parseFloat(e.target.value) || 0, probability);
  });
  
  // Focus the input
  setTimeout(() => document.getElementById('inlineStakeAmount').focus(), 100);
}

/**
 * Hide inline trading form and show stats card again
 */
function hideInlineTradingForm() {
  const container = document.getElementById('inlineTradingForm');
  const statsCard = document.getElementById('statsCard');
  
  if (container) container.classList.add('hidden');
  if (statsCard) statsCard.classList.remove('hidden');
  
  // Remove highlight from buttons
  document.querySelectorAll('.outcome-btn').forEach(btn => {
    btn.classList.remove('ring-2', 'ring-yellow-500', 'ring-offset-2', 'ring-offset-slate-950');
  });
  
  currentInlineSelection = null;
}

/**
 * Update inline trade calculations
 */
function updateInlineTradeCalculations(stake, probability) {
  const p = probability / 100;
  
  const winProfit = calcWinProfit(stake, p);
  const winReturn = calcWinReturn(stake, p);
  const lossAmount = calcLossAmount(stake, p);
  const loseReturn = calcLoseReturn(stake, p);
  
  const winReturnEl = document.getElementById('inlineWinReturn');
  const winProfitEl = document.getElementById('inlineWinProfit');
  const loseReturnEl = document.getElementById('inlineLoseReturn');
  const lossAmountEl = document.getElementById('inlineLossAmount');
  
  if (winReturnEl) winReturnEl.textContent = '$' + winReturn.toFixed(2);
  if (winProfitEl) winProfitEl.textContent = '+$' + winProfit.toFixed(2);
  if (loseReturnEl) loseReturnEl.textContent = '$' + loseReturn.toFixed(2);
  if (lossAmountEl) lossAmountEl.textContent = '-$' + lossAmount.toFixed(2);
}

/**
 * Submit prediction from inline form
 */
async function submitInlinePrediction(marketId, outcomeId, probability) {
  const stake = parseFloat(document.getElementById('inlineStakeAmount').value) || 0;
  
  if (stake <= 0) {
    alert('Please enter a valid investment amount');
    return;
  }
  
  // Check balance
  if (typeof hasSufficientBalance === 'function' && !hasSufficientBalance(stake)) {
    const currentBalance = typeof getBalance === 'function' ? getBalance() : 0;
    alert(`Insufficient balance. You have $${currentBalance.toFixed(2)} available.`);
    return;
  }

  // Use the existing submitPrediction logic
  await submitPrediction(marketId, outcomeId, probability);
  
  // Hide inline form after successful submission
  hideInlineTradingForm();
}

// Make functions globally available
window.showInlineTradingForm = showInlineTradingForm;
window.hideInlineTradingForm = hideInlineTradingForm;
window.updateInlineTradeCalculations = updateInlineTradeCalculations;
window.submitInlinePrediction = submitInlinePrediction;

function openPredictionForm(marketId, outcomeId) {
  // Handle both string and numeric IDs
  const market = markets.find(m => String(m.id) === String(marketId));
  if (!market) {
    console.error('Market not found:', marketId);
    return;
  }
  const outcome = market.outcomes.find(o => String(o.id) === String(outcomeId));
  if (!outcome) {
    console.error('Outcome not found:', outcomeId);
    return;
  }
  const probability = outcome.probability; // Assume this is 0-100

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
        <p class="text-white font-semibold text-lg">${normalizePredictionOutcomeTitle(outcome.title)}</p>
        <div class="flex items-center gap-4 mt-3">
          <div>
            <p class="text-slate-500 text-xs">Price</p>
            <p class="text-yellow-400 text-2xl font-bold">${probability}¢</p>
          </div>
          <div>
            <p class="text-slate-500 text-xs">Platform Fee</p>
            <p class="text-slate-300 text-lg font-semibold">${PLATFORM_FEE * 100}%</p>
          </div>
          <div class="ml-auto">
            <p class="text-slate-500 text-xs">Available Balance</p>
            <p class="text-green-400 text-lg font-semibold">$${typeof getBalance === 'function' ? getBalance().toFixed(2) : '0.00'}</p>
          </div>
        </div>
      </div>
      
      <!-- Investment Input -->
      <div class="space-y-4">
        <div>
          <label class="text-white font-medium mb-2 block">Investment Amount ($)</label>
          <input type="number" id="stakeAmount" min="1" step="0.01" placeholder="Enter amount" 
            class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 text-lg" />
        </div>
        
        <!-- Trade Outcomes -->
        <div class="flex gap-4">
          <!-- If Win -->
          <div class="flex-1 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-green-400 text-lg">✓</span>
              <p class="text-green-400 font-semibold">If You Win</p>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-slate-400 text-sm">Return</span>
                <span class="text-green-400 font-bold" id="winReturn">$0.00</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400 text-sm">Profit</span>
                <span class="text-green-400 font-semibold" id="winProfit">+$0.00</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 text-xs">You return</span>
                <span class="text-green-400 text-xs font-medium" id="winReturnPercent">0%</span>
              </div>
            </div>
          </div>
          
          <!-- If Lose -->
          <div class="flex-1 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-red-400 text-lg">✗</span>
              <p class="text-red-400 font-semibold">If You Lose</p>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-slate-400 text-sm">Return</span>
                <span class="text-yellow-400 font-bold" id="loseReturn">$0.00</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400 text-sm">Loss</span>
                <span class="text-red-400 font-semibold" id="lossAmount">-$0.00</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 text-xs">You return</span>
                <span class="text-yellow-400 text-xs font-medium" id="loseReturnPercent">0%</span>
              </div>
            </div>
          </div>
        </div>
        
        <button onclick="submitPrediction('${marketId}', '${outcomeId}', ${probability})" 
          class="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-950 font-bold py-3 rounded-lg transition-all">
          Confirm Trade
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Add input listener for real-time calculations
  document.getElementById('stakeAmount').addEventListener('input', function(e) {
    updateTradeCalculations(parseFloat(e.target.value) || 0, probability);
  });
  
  // Focus the input
  setTimeout(() => document.getElementById('stakeAmount').focus(), 100);
}

function updateTradeCalculations(stake, probability) {
  const p = probability / 100; // Convert to decimal
  
  // Calculate values using the fair trading model
  const winProfit = calcWinProfit(stake, p);
  const winReturn = calcWinReturn(stake, p);
  const lossAmount = calcLossAmount(stake, p);
  const loseReturn = calcLoseReturn(stake, p);
  
  // Calculate return percentages (how much you get back relative to investment)
  const winReturnPercent = stake > 0 ? ((winReturn / stake) * 100).toFixed(0) : 0;
  const loseReturnPercent = stake > 0 ? ((loseReturn / stake) * 100).toFixed(0) : 0;
  
  // Update UI
  document.getElementById('winReturn').textContent = '$' + winReturn.toFixed(2);
  document.getElementById('winProfit').textContent = '+$' + winProfit.toFixed(2);
  document.getElementById('winReturnPercent').textContent = winReturnPercent + '%';
  document.getElementById('loseReturn').textContent = '$' + loseReturn.toFixed(2);
  document.getElementById('lossAmount').textContent = '-$' + lossAmount.toFixed(2);
  document.getElementById('loseReturnPercent').textContent = loseReturnPercent + '%';
}

async function submitPrediction(marketId, outcomeId, probability) {
  const stake = parseFloat(document.getElementById('stakeAmount').value) || 0;
  
  if (stake <= 0) {
    alert('Please enter a valid investment amount');
    return;
  }
  
  // Check if user has sufficient balance
  if (typeof hasSufficientBalance === 'function' && !hasSufficientBalance(stake)) {
    const currentBalance = typeof getBalance === 'function' ? getBalance() : 0;
    alert(`Insufficient balance. You have $${currentBalance.toFixed(2)} available. Please deposit more funds.`);
    
    // Close prediction modal and open deposit modal
    const modal = document.querySelector('.fixed');
    if (modal) modal.remove();
    if (typeof openDepositModal === 'function') {
      openDepositModal();
    }
    return;
  }
  
  // Get full breakdown from LMSR engine
  const lmsrBreakdown = window.LMSR ? window.LMSR.getTradeBreakdown(stake, probability) : null;
  
  const breakdown = {
    marketId,
    outcomeId,
    stake,
    probability,
    winProfit: lmsrBreakdown ? lmsrBreakdown.win.profit : calcWinProfit(stake, probability),
    winReturn: lmsrBreakdown ? lmsrBreakdown.win.totalReturn : calcWinReturn(stake, probability),
    lossAmount: lmsrBreakdown ? lmsrBreakdown.lose.loss : calcLossAmount(stake, probability),
    loseReturn: lmsrBreakdown ? lmsrBreakdown.lose.refund : calcLoseReturn(stake, probability),
    riskReward: lmsrBreakdown ? lmsrBreakdown.riskReward : null,
    platformRevenue: lmsrBreakdown ? lmsrBreakdown.platformRevenue : null
  };
  
  console.log('Trade submitted:', breakdown);
  
  // Show loading state
  const modal = document.querySelector('.fixed');
  const confirmBtn = modal.querySelector('button[onclick*="submitPrediction"]');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="animate-pulse">Processing...</span>';
  }
  
  let apiSuccess = false;
  
  // Try to save to API
  try {
    const response = await fetch('/api/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        market_id: String(marketId),
        outcome_id: String(outcomeId),
        stake_amount: stake,
        odds_at_prediction: probability
      })
    });
    
    if (response.ok) {
      const prediction = await response.json();
      console.log('Prediction saved to API:', prediction);
      apiSuccess = true;
      
      // Deduct balance from wallet
      if (typeof deductBalance === 'function') {
        deductBalance(stake);
      }
      
      // Update local market data
      const market = markets.find(m => String(m.id) === String(marketId));
      if (market) {
        const outcome = market.outcomes.find(o => String(o.id) === String(outcomeId));
        if (outcome) {
          // Update stake
          outcome.stake = (outcome.stake || 0) + stake;
          
          // Recalculate probabilities based on stakes
          const totalStake = market.outcomes.reduce((sum, o) => sum + (o.stake || 0), 0);
          if (totalStake > 0) {
            market.outcomes.forEach(o => {
              o.probability = Math.round((o.stake / totalStake) * 100);
            });
          }
          
          // Update volume
          market.volume = (market.volume || 0) + stake;
          market.volume24h = (market.volume24h || 0) + stake;
        }
      }
    } else {
      const error = await response.json();
      console.error('API error:', error);
    }
  } catch (error) {
    console.log('API call failed:', error.message);
  }
  
  // Update LMSR market state
  if (window.lmsrManager) {
    try {
      // Determine side - first outcome is typically YES/favorite
      const market = markets.find(m => String(m.id) === String(marketId));
      const outcomeIndex = market ? market.outcomes.findIndex(o => String(o.id) === String(outcomeId)) : -1;
      const side = outcomeIndex === 0 ? 'YES' : 'NO';
      const result = window.lmsrManager.invest(String(marketId), side, stake);
      console.log('LMSR market updated:', result);
    } catch (e) {
      const lmsrMarket = window.lmsrManager.getOrCreateMarket(String(marketId), 100, probability / 100);
      const market = markets.find(m => String(m.id) === String(marketId));
      const outcomeIndex = market ? market.outcomes.findIndex(o => String(o.id) === String(outcomeId)) : -1;
      const side = outcomeIndex === 0 ? 'YES' : 'NO';
      lmsrMarket.invest(side, stake);
      console.log('LMSR market created and updated');
    }
  }
  
  // Store locally
  if (typeof predictions === 'undefined') {
    window.predictions = [];
  }
  predictions.push({
    id: Date.now(),
    ...breakdown,
    timestamp: new Date().toISOString(),
    status: 'active'
  });
  
  // Show confirmation
  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-center">
      <div class="w-16 h-16 ${apiSuccess ? 'bg-green-500/20' : 'bg-yellow-500/20'} rounded-full flex items-center justify-center mx-auto mb-4">
        <span class="${apiSuccess ? 'text-green-400' : 'text-yellow-400'} text-3xl">${apiSuccess ? '✓' : '⚠'}</span>
      </div>
      <h3 class="text-xl font-bold text-white mb-2">${apiSuccess ? 'Trade Placed!' : 'Trade Saved Locally'}</h3>
      <p class="text-slate-400 mb-4">Your $${stake.toFixed(2)} trade has been ${apiSuccess ? 'submitted' : 'saved locally'}.</p>
      <div class="bg-slate-800/50 rounded-xl p-4 mb-4 text-left">
        <div class="flex justify-between mb-2">
          <span class="text-slate-400">If you win:</span>
          <span class="text-green-400 font-semibold">+$${breakdown.winProfit.toFixed(2)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">If you lose:</span>
          <span class="text-yellow-400 font-semibold">Keep $${breakdown.loseReturn.toFixed(2)}</span>
        </div>
      </div>
      <button onclick="closePredictionModal()" 
        class="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-950 font-bold py-3 rounded-lg">
        Done
      </button>
    </div>
  `;
}

/**
 * Close prediction modal and refresh the view
 */
function closePredictionModal() {
  const modal = document.querySelector('.fixed');
  if (modal) modal.remove();
  
  // Refresh markets view if visible
  if (!document.getElementById('marketsView').classList.contains('hidden')) {
    renderMarkets();
  }
  
  // Refresh detail view if visible
  const detailView = document.getElementById('detailView');
  if (detailView && !detailView.classList.contains('hidden')) {
    // Re-render the current market detail
    const detailContent = document.getElementById('detailContent');
    if (detailContent && detailContent.innerHTML) {
      // Get current market ID from the page and re-render
      const marketCards = document.querySelectorAll('[onclick*="showDetail"]');
      // Just close the modal, user can refresh manually
    }
  }
}
