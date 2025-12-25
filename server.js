try { require('dotenv').config(); } catch (e) {}
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { nanoid } = require('nanoid');
const { readJson, writeJson, addTransaction, findTransactionByExternalId, updateTransaction } = require('./lib/datastore');
const { computeMarketMetrics } = require('./lib/metrics');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3001;
const Stripe = require('stripe');
const stripeSecret = (process.env.STRIPE_SECRET_KEY || '').trim();
const stripe = stripeSecret ? Stripe(stripeSecret) : null;
const METRICS_OBS = { recompute_count: 0, recompute_total_ms: 0, provider_errors: 0 };

const DATA_DIR = path.join(__dirname, 'data');
const MARKETS_PATH = path.join(DATA_DIR, 'markets.json');
const PREDICTIONS_PATH = path.join(DATA_DIR, 'predictions.json');
const INTRADAY_CACHE_PATH = path.join(DATA_DIR, 'market_intraday_cache.json');
const USERS_PATH = path.join(DATA_DIR, 'users.json');
const TRANSACTIONS_PATH = path.join(DATA_DIR, 'transactions.json');

app.use(cors());
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] || '';
  const secret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message || 'Invalid signature'}`);
  }
  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const transactions = await readJson(TRANSACTIONS_PATH);
      const existing = transactions.find((t) => t.external_id === pi.id && t.type === 'deposit');
      if (existing && existing.status !== 'completed') {
        await writeJson(TRANSACTIONS_PATH, transactions.map((t) => t.id === existing.id ? { ...t, status: 'completed', updated_at: new Date().toISOString() } : t));
      } else if (!existing) {
        const userId = pi.metadata && pi.metadata.userId ? pi.metadata.userId : null;
        if (userId) {
          const tx = {
            id: nanoid(12),
            user_id: userId,
            type: 'deposit',
            amount: Math.round((pi.amount_received || 0) / 100),
            payment_method: 'card',
            status: 'completed',
            external_id: pi.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          await addTransaction(TRANSACTIONS_PATH, tx);
        }
      }
    }
    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      const transactions = await readJson(TRANSACTIONS_PATH);
      const existing = transactions.find((t) => t.external_id === pi.id && t.type === 'deposit');
      if (existing && existing.status !== 'failed') {
        await writeJson(TRANSACTIONS_PATH, transactions.map((t) => t.id === existing.id ? { ...t, status: 'failed', failure_reason: pi.last_payment_error && pi.last_payment_error.message ? pi.last_payment_error.message : 'Payment failed', updated_at: new Date().toISOString() } : t));
      }
    }
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const sub = invoice.subscription;
      const userId = invoice.metadata && invoice.metadata.userId ? invoice.metadata.userId : null;
      if (userId) {
        const tx = {
          id: nanoid(12),
          user_id: userId,
          type: 'deposit',
          amount: Math.round((invoice.amount_paid || 0) / 100),
          payment_method: 'card',
          status: 'completed',
          external_id: invoice.id,
          subscription_id: sub || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await addTransaction(TRANSACTIONS_PATH, tx);
      }
    }
    res.json({ received: true });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Webhook handler error' });
  }
});
app.use(express.json());
app.use(morgan('dev'));

// Serve the frontend bundle from root
app.use(express.static(__dirname));

// Root route to load the app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/config/supabase.js', (req, res) => {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';
  res.type('application/javascript').send(`window.SUPABASE_CONFIG = { url: ${JSON.stringify(url)}, anonKey: ${JSON.stringify(anonKey)} };`);
});
app.get('/config/stripe.js', (req, res) => {
  const publishableKey =
    process.env.STRIPE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    '';
  const defaultPriceId =
    process.env.STRIPE_DEFAULT_PRICE_ID ||
    process.env.NEXT_PUBLIC_STRIPE_DEFAULT_PRICE_ID ||
    process.env.VITE_STRIPE_DEFAULT_PRICE_ID ||
    '';
  res
    .type('application/javascript')
    .send(`window.STRIPE_CONFIG = { publishableKey: ${JSON.stringify(publishableKey)}, defaultPriceId: ${JSON.stringify(defaultPriceId)} };`);
});
function recomputeMarketStats(market) {
  const totalStake = market.outcomes.reduce((sum, o) => sum + (o.total_stake || 0), 0);
  market.total_volume = totalStake;
  if (totalStake > 0) {
    market.outcomes.forEach((o) => {
      o.probability = Math.round(((o.total_stake || 0) / totalStake) * 100);
    });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'samsa-api' });
});

// ============================================================================
// LEAGUE STATS
// ============================================================================

// Get stats for a specific league (active markets, volume, predictions)
app.get('/api/leagues/:leagueId/stats', async (req, res) => {
  const { leagueId } = req.params;
  const markets = await readJson(MARKETS_PATH);
  const predictions = await readJson(PREDICTIONS_PATH);
  
  // Filter markets that belong to this league (by matching league ID in market data)
  // For now, markets don't have league_id, so we return aggregated defaults
  // When markets have league associations, filter by: m.league_id === leagueId
  const leagueMarkets = markets.filter(m => m.league_id === leagueId && m.status === 'active');
  
  // Calculate stats
  const activeMarkets = leagueMarkets.length;
  const totalVolume = leagueMarkets.reduce((sum, m) => sum + (m.total_volume || 0), 0);
  
  // Count predictions for league markets
  const leagueMarketIds = leagueMarkets.map(m => m.id);
  const leaguePredictions = predictions.filter(p => leagueMarketIds.includes(p.market_id)).length;
  
  res.json({
    league_id: leagueId,
    active_markets: activeMarkets,
    total_volume: totalVolume,
    predictions: leaguePredictions
  });
});

// ============================================================================
// CURRENT EVENTS / TRENDING MARKETS
// ============================================================================

// Get markets based on current events (closing soon, high volume, trending topics)
app.get('/api/markets/current-events', async (req, res) => {
  const markets = await readJson(MARKETS_PATH);
  const now = new Date();
  const sixMonthsFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
  
  // Filter markets that are:
  // 1. Active
  // 2. Closing within the next 6 months (timely)
  // 3. Have significant volume or are newly created
  const currentEventMarkets = markets
    .filter(m => m.status === 'active')
    .filter(m => {
      if (!m.close_date) return true;
      const closeDate = new Date(m.close_date);
      return closeDate <= sixMonthsFromNow && closeDate > now;
    })
    .sort((a, b) => {
      // Sort by a combination of volume and how soon they close
      const aClose = new Date(a.close_date || '2099-12-31');
      const bClose = new Date(b.close_date || '2099-12-31');
      const aUrgency = (aClose - now) / (1000 * 60 * 60 * 24); // days until close
      const bUrgency = (bClose - now) / (1000 * 60 * 60 * 24);
      
      // Score: higher volume + sooner closing = higher score
      const aScore = (a.total_volume || 0) / 1000 - aUrgency / 10;
      const bScore = (b.total_volume || 0) / 1000 - bUrgency / 10;
      return bScore - aScore;
    });
  
  res.json(currentEventMarkets);
});

// Get trending markets (highest 24h volume)
app.get('/api/markets/trending', async (req, res) => {
  const markets = await readJson(MARKETS_PATH);
  const limit = parseInt(req.query.limit) || 10;
  const active = markets.filter((m) => m.status === 'active');
  const withMetrics = await Promise.all(active.map(async (m) => {
    const t0 = Date.now();
    const metrics = await computeMarketMetrics(m);
    METRICS_OBS.recompute_count += 1;
    METRICS_OBS.recompute_total_ms += Date.now() - t0;
    return { ...m, metrics };
  }));
  withMetrics.sort((a, b) => (b.metrics?.trend?.score || 0) - (a.metrics?.trend?.score || 0));
  res.json(withMetrics.slice(0, limit));
});

// Get markets by category
app.get('/api/markets/category/:category', async (req, res) => {
  const markets = await readJson(MARKETS_PATH);
  const { category } = req.params;
  
  const categoryMarkets = markets.filter(m => 
    m.status === 'active' && 
    m.category.toLowerCase() === category.toLowerCase()
  );
  
  res.json(categoryMarkets);
});

// Generate suggested markets based on current news topics
app.get('/api/markets/suggestions', async (req, res) => {
  // This returns template suggestions for new markets based on trending topics
  const suggestions = [
    {
      topic: "Technology",
      suggestions: [
        { title: "Will OpenAI release GPT-5 by Q2 2025?", category: "technology" },
        { title: "Will Apple's Vision Pro 2 launch in 2025?", category: "technology" },
        { title: "Will TikTok be banned in the US?", category: "technology" }
      ]
    },
    {
      topic: "Politics",
      suggestions: [
        { title: "Will there be a government shutdown in Q1 2025?", category: "politics" },
        { title: "Will immigration reform pass in 2025?", category: "politics" },
        { title: "Will the debt ceiling be raised without crisis?", category: "politics" }
      ]
    },
    {
      topic: "Sports",
      suggestions: [
        { title: "Super Bowl LIX predictions", category: "sports" },
        { title: "2025 NBA All-Star Game MVP", category: "sports" },
        { title: "College Football Playoff Champion", category: "sports" }
      ]
    },
    {
      topic: "Entertainment", 
      suggestions: [
        { title: "2025 Grammy Awards predictions", category: "entertainment" },
        { title: "Golden Globes Best Picture", category: "entertainment" },
        { title: "2025 Oscar Best Picture", category: "entertainment" }
      ]
    },
    {
      topic: "Finance",
      suggestions: [
        { title: "Fed interest rate decisions", category: "finance" },
        { title: "S&P 500 performance predictions", category: "finance" },
        { title: "Cryptocurrency price predictions", category: "crypto" }
      ]
    },
    {
      topic: "International",
      suggestions: [
        { title: "Ukraine-Russia conflict resolution", category: "international" },
        { title: "Middle East developments", category: "international" },
        { title: "Global trade agreements", category: "international" }
      ]
    }
  ];
  
  res.json(suggestions);
});

app.get('/api/markets', async (req, res) => {
  const markets = await readJson(MARKETS_PATH);
  const enriched = await Promise.all(markets.map(async (m) => {
    const t0 = Date.now();
    const metrics = await computeMarketMetrics(m);
    METRICS_OBS.recompute_count += 1;
    METRICS_OBS.recompute_total_ms += Date.now() - t0;
    return { ...m, metrics };
  }));
  res.json(enriched);
});

app.get('/api/markets/:id', async (req, res) => {
  const markets = await readJson(MARKETS_PATH);
  const market = markets.find((m) => m.id === req.params.id);
  if (!market) return res.status(404).json({ error: 'Market not found' });
  const t0 = Date.now();
  const metrics = await computeMarketMetrics(market);
  METRICS_OBS.recompute_count += 1;
  METRICS_OBS.recompute_total_ms += Date.now() - t0;
  res.json({ ...market, metrics });
});

app.post('/api/markets', async (req, res) => {
  const {
    title,
    description,
    category,
    outcomes = [],
    image_url = '',
    search_keywords = '',
    close_date = null,
    resolution_date = null
  } = req.body;

  if (!title || !description || !category || !Array.isArray(outcomes) || outcomes.length < 2) {
    return res.status(400).json({ error: 'Invalid market payload' });
  }

  const markets = await readJson(MARKETS_PATH);

  const normalizedOutcomes = outcomes.map((o) => ({
    id: o.id || nanoid(8),
    title: o.title,
    probability: typeof o.probability === 'number' ? o.probability : Math.round(100 / outcomes.length),
    total_stake: typeof o.total_stake === 'number' ? o.total_stake : 0
  }));

  const market = {
    id: nanoid(12),
    title,
    description,
    category,
    status: 'active',
    close_date,
    resolution_date,
    outcomes: normalizedOutcomes,
    total_volume: 0,
    image_url,
    winning_outcome_id: null,
    search_keywords
  };

  recomputeMarketStats(market);
  markets.push(market);
  await writeJson(MARKETS_PATH, markets);
  res.status(201).json(market);
});

app.get('/api/predictions', async (req, res) => {
  const predictions = await readJson(PREDICTIONS_PATH);
  const { market_id } = req.query;
  if (market_id) {
    return res.json(predictions.filter((p) => p.market_id === market_id));
  }
  res.json(predictions);
});

app.post('/api/predictions', async (req, res) => {
  const {
    market_id,
    outcome_id,
    stake_amount,
    odds_at_prediction,
    user_id = null
  } = req.body;

  if (!market_id || !outcome_id || typeof stake_amount !== 'number' || typeof odds_at_prediction !== 'number') {
    return res.status(400).json({ error: 'Invalid prediction payload' });
  }

  const markets = await readJson(MARKETS_PATH);
  const predictions = await readJson(PREDICTIONS_PATH);

  const market = markets.find((m) => m.id === market_id);
  if (!market) return res.status(404).json({ error: 'Market not found' });

  if (market.status !== 'active') return res.status(400).json({ error: 'Market is not active' });

  const outcome = market.outcomes.find((o) => o.id === outcome_id);
  if (!outcome) return res.status(404).json({ error: 'Outcome not found' });

  const potential_return = Number((stake_amount * (100 / Math.max(odds_at_prediction, 1))).toFixed(2));

  const prediction = {
    id: nanoid(12),
    market_id,
    outcome_id,
    stake_amount,
    odds_at_prediction,
    potential_return,
    status: 'active',
    actual_return: 0,
    user_id,
    created_at: new Date().toISOString()
  };

  predictions.push(prediction);

  outcome.total_stake = (outcome.total_stake || 0) + stake_amount;
  recomputeMarketStats(market);

  try {
    let intraday = {};
    try { intraday = await readJson(INTRADAY_CACHE_PATH); } catch (e) { intraday = {}; }
    const titles = (market.outcomes || []).map((o) => (o.title || '').trim().toLowerCase());
    const yesIdx = titles.indexOf('yes');
    const primaryIdx = yesIdx !== -1 ? yesIdx : 0;
    const primaryOutcome = market.outcomes[primaryIdx];
    const p = typeof primaryOutcome.probability === 'number' ? (primaryOutcome.probability > 1 ? primaryOutcome.probability / 100 : primaryOutcome.probability) : 0.5;
    const entry = { t: new Date().toISOString(), p };
    const existing = intraday[market_id] && Array.isArray(intraday[market_id].sparkline) ? intraday[market_id].sparkline : [];
    const updated = [...existing, entry].slice(-300);
    intraday[market_id] = { sparkline: updated };
    intraday.__meta = { cached_at: new Date().toISOString() };
    await writeJson(INTRADAY_CACHE_PATH, intraday);
  } catch (e) {}

  await writeJson(PREDICTIONS_PATH, predictions);
  await writeJson(MARKETS_PATH, markets);

  res.status(201).json(prediction);
});

app.post('/api/markets/:id/resolve', async (req, res) => {
  const { winning_outcome_id } = req.body;
  const markets = await readJson(MARKETS_PATH);
  const predictions = await readJson(PREDICTIONS_PATH);

  const market = markets.find((m) => m.id === req.params.id);
  if (!market) return res.status(404).json({ error: 'Market not found' });

  const winOutcome = market.outcomes.find((o) => o.id === winning_outcome_id);
  if (!winOutcome) return res.status(400).json({ error: 'Invalid winning_outcome_id' });

  market.status = 'resolved';
  market.winning_outcome_id = winning_outcome_id;
  market.resolution_date = new Date().toISOString();

  const updated = predictions.map((p) => {
    if (p.market_id !== market.id) return p;
    const won = p.outcome_id === winning_outcome_id;
    return {
      ...p,
      status: won ? 'won' : 'lost',
      actual_return: won ? p.potential_return : 0
    };
  });

  await writeJson(PREDICTIONS_PATH, updated);
  await writeJson(MARKETS_PATH, markets);

  res.json({ ok: true, market });
});

// ============================================================================
// WALLET / USER ENDPOINTS
// ============================================================================

/**
 * Calculate user balance from transactions
 * Balance = sum of deposits - sum of withdrawals - sum of active predictions
 */
async function calculateBalanceFromTransactions(userId) {
  let transactions = [];
  let predictions = [];
  
  try {
    transactions = await readJson(TRANSACTIONS_PATH);
  } catch (e) {
    transactions = [];
  }
  
  try {
    predictions = await readJson(PREDICTIONS_PATH);
  } catch (e) {
    predictions = [];
  }
  
  // Filter transactions for this user
  const userTransactions = transactions.filter(t => t.user_id === userId);
  
  // Sum deposits (completed only)
  const totalDeposits = userTransactions
    .filter(t => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  // Sum withdrawals (completed only)
  const totalWithdrawals = userTransactions
    .filter(t => t.type === 'withdrawal' && t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  // Sum active prediction stakes (money locked in trades)
  const activePredictionStakes = predictions
    .filter(p => p.user_id === userId && p.status === 'active')
    .reduce((sum, p) => sum + (p.stake_amount || 0), 0);
  
  // Balance = deposits - withdrawals - active stakes
  const balance = totalDeposits - totalWithdrawals - activePredictionStakes;
  
  return {
    balance: Math.max(0, balance), // Never negative
    totalDeposits,
    totalWithdrawals,
    activePredictionStakes
  };
}

// Get user balance (calculated from transactions)
app.get('/api/users/:id/balance', async (req, res) => {
  const users = await readJson(USERS_PATH);
  let user = users.find((u) => u.id === req.params.id);
  
  if (!user) {
    // Create default user if not found
    user = {
      id: req.params.id,
      username: 'user',
      email: '',
      created_at: new Date().toISOString()
    };
    users.push(user);
    await writeJson(USERS_PATH, users);
  }
  
  // Calculate balance from transactions (not stored value)
  const balanceInfo = await calculateBalanceFromTransactions(req.params.id);
  
  res.json({ 
    balance: balanceInfo.balance, 
    total_deposited: balanceInfo.totalDeposits,
    total_withdrawn: balanceInfo.totalWithdrawals,
    active_stakes: balanceInfo.activePredictionStakes,
    user 
  });
});

// Deposit funds
app.post('/api/users/:id/deposit', async (req, res) => {
  const { amount, payment_method = 'card' } = req.body;

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }

  if (amount > 10000) {
    return res.status(400).json({ error: 'Maximum deposit is $10,000' });
  }

  const users = await readJson(USERS_PATH);
  let user = users.find((u) => u.id === req.params.id);

  if (!user) {
    // Create user if doesn't exist
    user = {
      id: req.params.id,
      username: 'user',
      email: '',
      created_at: new Date().toISOString()
    };
    users.push(user);
    await writeJson(USERS_PATH, users);
  }

  // Record transaction (balance is calculated from transactions, not stored)
  let transactions = [];
  try {
    transactions = await readJson(TRANSACTIONS_PATH);
  } catch (e) {
    transactions = [];
  }

  const transaction = {
    id: nanoid(12),
    user_id: req.params.id,
    type: 'deposit',
    amount,
    payment_method,
    status: 'completed',
    created_at: new Date().toISOString()
  };

  transactions.push(transaction);
  await writeJson(TRANSACTIONS_PATH, transactions);

  // Calculate new balance from all transactions
  const balanceInfo = await calculateBalanceFromTransactions(req.params.id);

  res.status(201).json({
    success: true,
    transaction,
    new_balance: balanceInfo.balance
  });
});
app.post('/api/payments/create-intent', async (req, res) => {
  const { userId, amount, currency = 'usd' } = req.body;
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid userId' });
  }
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }
  const cents = Math.round(amount * 100);
  if (cents > 100000000) {
    return res.status(400).json({ error: 'Amount too large' });
  }
  let pi;
  try {
    pi = await stripe.paymentIntents.create({
      amount: cents,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { userId },
      description: 'Wallet deposit'
    });
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Failed to create intent' });
  }
  const tx = {
    id: nanoid(12),
    user_id: userId,
    type: 'deposit',
    amount,
    payment_method: 'card',
    status: 'pending',
    external_id: pi.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  await addTransaction(TRANSACTIONS_PATH, tx);
  res.json({ client_secret: pi.client_secret, intent_id: pi.id });
});
app.post('/api/payments/create-checkout-session', async (req, res) => {
  const { userId, priceId, quantity = 1 } = req.body;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid userId' });
  }
  if (!priceId || typeof priceId !== 'string') {
    return res.status(400).json({ error: 'Invalid priceId' });
  }
  const origin = `${req.protocol}://${req.get('host')}`;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity }],
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=canceled`,
      subscription_data: { metadata: { userId } }
    });
    res.json({ id: session.id, url: session.url || null });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Failed to create checkout session' });
  }
});

// Withdraw funds
app.post('/api/users/:id/withdraw', async (req, res) => {
  const { amount, withdrawal_method = 'bank' } = req.body;

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }

  // Calculate current balance from transactions
  const currentBalanceInfo = await calculateBalanceFromTransactions(req.params.id);

  if (currentBalanceInfo.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  // Ensure user exists
  const users = await readJson(USERS_PATH);
  let user = users.find((u) => u.id === req.params.id);

  if (!user) {
    user = {
      id: req.params.id,
      username: 'user',
      email: '',
      created_at: new Date().toISOString()
    };
    users.push(user);
    await writeJson(USERS_PATH, users);
  }

  // Record transaction (balance is calculated from transactions, not stored)
  let transactions = [];
  try {
    transactions = await readJson(TRANSACTIONS_PATH);
  } catch (e) {
    transactions = [];
  }

  const transaction = {
    id: nanoid(12),
    user_id: req.params.id,
    type: 'withdrawal',
    amount,
    withdrawal_method,
    status: 'completed', // For demo, mark as completed immediately
    created_at: new Date().toISOString()
  };

  transactions.push(transaction);
  await writeJson(TRANSACTIONS_PATH, transactions);

  // Calculate new balance from all transactions
  const balanceInfo = await calculateBalanceFromTransactions(req.params.id);

  res.status(201).json({
    success: true,
    transaction,
    new_balance: balanceInfo.balance
  });
});

// Get transaction history
app.get('/api/users/:id/transactions', async (req, res) => {
  let transactions = [];
  try {
    transactions = await readJson(TRANSACTIONS_PATH);
  } catch (e) {
    transactions = [];
  }
  
  const userTransactions = transactions.filter((t) => t.user_id === req.params.id);
  res.json(userTransactions);
});

async function httpsJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
  });
}

function toQuestion(title) {
  const t = (title || '').trim();
  if (!t) return '';
  return t.endsWith('?') ? t : `${t}?`;
}

function inferCategoryFromTitle(title, fallback = 'technology') {
  const t = (title || '').toLowerCase();
  if (t.includes('election') || t.includes('congress') || t.includes('white house') || t.includes('bill') || t.includes('policy')) return 'politics';
  if (t.includes('stock') || t.includes('market') || t.includes('interest rate') || t.includes('fed') || t.includes('economy') || t.includes('inflation')) return 'finance';
  if (t.includes('bitcoin') || t.includes('crypto') || t.includes('ethereum')) return 'crypto';
  if (t.includes('nba') || t.includes('nfl') || t.includes('mlb') || t.includes('soccer') || t.includes('goal') || t.includes('tournament')) return 'sports';
  if (t.includes('movie') || t.includes('film') || t.includes('oscar') || t.includes('grammy') || t.includes('celebrity')) return 'entertainment';
  if (t.includes('ai') || t.includes('openai') || t.includes('gpt') || t.includes('google') || t.includes('apple') || t.includes('microsoft') || t.includes('technology')) return 'technology';
  if (t.includes('climate') || t.includes('emissions') || t.includes('environment')) return 'environment';
  if (t.includes('covid') || t.includes('vaccine') || t.includes('health')) return 'health';
  return fallback;
}

function articleToMarket(article, defaultCategory) {
  const title = toQuestion(article.title || '');
  const desc = article.description || article.content || `News-based market from ${article?.source?.name || 'source'}`;
  const image = article.urlToImage || '';
  const published = article.publishedAt ? new Date(article.publishedAt) : new Date();
  const close = new Date(published.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();
  const category = inferCategoryFromTitle(title, defaultCategory);
  return {
    id: nanoid(12),
    title,
    description: desc,
    category,
    status: 'active',
    close_date: close,
    resolution_date: null,
    outcomes: [
      { id: 'yes', title: 'Yes', probability: 50, total_stake: 0 },
      { id: 'no', title: 'No', probability: 50, total_stake: 0 }
    ],
    total_volume: 0,
    image_url: image,
    winning_outcome_id: null,
    search_keywords: `${article?.source?.name || ''} ${title}`.trim()
  };
}

async function ingestNews({ category = 'technology', q = '', language = 'en', pageSize = 20 } = {}) {
  const apiKey = (process.env.NEWS_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  if (!apiKey) {
    throw new Error('NEWS_API_KEY not configured');
  }
  const base = 'https://newsapi.org/v2/top-headlines';
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (q) params.set('q', q);
  params.set('language', language);
  // Top headlines work best with a country specified when using category
  if (!params.has('country')) params.set('country', 'us');
  params.set('pageSize', String(pageSize));
  params.set('apiKey', apiKey);
  const url = `${base}?${params.toString()}`;
  let json;
  try {
    json = await httpsJson(url);
  } catch (e) {
    json = null;
  }
  let articles = Array.isArray(json?.articles) ? json.articles : [];
  if (!json || json.status !== 'ok' || articles.length === 0) {
    articles = [
      { title: 'Will OpenAI release GPT-5 by Q2 2025?', description: 'Tech forecast', source: { name: 'Sample' }, publishedAt: new Date().toISOString(), urlToImage: '' },
      { title: 'Will Apple unveil a major AI feature at WWDC 2025?', description: 'Apple rumors', source: { name: 'Sample' }, publishedAt: new Date().toISOString(), urlToImage: '' },
      { title: 'Will a US interest rate cut happen in Q1 2025?', description: 'Finance outlook', source: { name: 'Sample' }, publishedAt: new Date().toISOString(), urlToImage: '' },
      { title: 'Will Bitcoin exceed $100k in 2025?', description: 'Crypto prospects', source: { name: 'Sample' }, publishedAt: new Date().toISOString(), urlToImage: '' },
      { title: 'Will the Lakers reach the NBA Finals in 2025?', description: 'Sports talk', source: { name: 'Sample' }, publishedAt: new Date().toISOString(), urlToImage: '' },
      { title: 'Will 2025 Oscars Best Picture be a streaming original?', description: 'Entertainment buzz', source: { name: 'Sample' }, publishedAt: new Date().toISOString(), urlToImage: '' }
    ];
  }
  const markets = await readJson(MARKETS_PATH);
  const existingTitles = new Set((markets || []).map((m) => (m.title || '').trim().toLowerCase()));
  const newMarkets = [];
  for (const a of articles) {
    const titleQ = toQuestion(a.title || '');
    if (!titleQ) continue;
    const normTitle = titleQ.trim().toLowerCase();
    if (existingTitles.has(normTitle)) continue;
    const mkt = articleToMarket(a, category || 'technology');
    recomputeMarketStats(mkt);
    markets.push(mkt);
    newMarkets.push(mkt);
    existingTitles.add(normTitle);
  }
  if (newMarkets.length > 0) {
    await writeJson(MARKETS_PATH, markets);
  }
  return { created: newMarkets.length, markets: newMarkets };
}

app.post('/api/markets/ingest/news', async (req, res) => {
  try {
    const category = (req.query.category || '').toString();
    const q = (req.query.q || '').toString();
    const language = (req.query.language || 'en').toString();
    const pageSize = parseInt(req.query.pageSize || '20', 10);
    const result = await ingestNews({ category, q, language, pageSize });
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Failed to ingest news' });
  }
});

app.get('/api/markets/:id/stats', async (req, res) => {
  const markets = await readJson(MARKETS_PATH);
  const market = markets.find((m) => m.id === req.params.id);
  if (!market) return res.status(404).json({ error: 'Market not found' });
  const t0 = Date.now();
  const metrics = await computeMarketMetrics(market);
  METRICS_OBS.recompute_count += 1;
  METRICS_OBS.recompute_total_ms += Date.now() - t0;
  res.json({ market_id: market.id, metrics });
});

app.get('/api/health/metrics-trends', async (req, res) => {
  const avg = METRICS_OBS.recompute_count > 0 ? METRICS_OBS.recompute_total_ms / METRICS_OBS.recompute_count : 0;
  res.json({ counters: METRICS_OBS, avg_recompute_ms: Math.round(avg) });
});

app.listen(PORT, () => {
  console.log(`Samsa API listening on http://localhost:${PORT}`);
  const hasKey = !!process.env.NEWS_API_KEY;
  if (hasKey) {
    ingestNews({ category: 'technology', pageSize: 10 })
      .then((r) => {
        console.log(`News ingest created ${r.created} markets`);
      })
      .catch((e) => {
        console.log(`News ingest skipped: ${e.message}`);
      });
  }
});
