try { require('dotenv').config(); } catch (e) {}
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { nanoid } = require('nanoid');
const { readJson, writeJson, addTransaction, findTransactionByExternalId, updateTransaction } = require('./lib/datastore');
const { computeMarketMetrics } = require('./lib/metrics');
const https = require('https');
const { Op } = require('sequelize');

// Import database models
const {
  sequelize,
  Market,
  Outcome,
  Prediction,
  User,
  Transaction,
  initializeDatabase
} = require('./lib/database/models');

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
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format market with outcomes for API response
 */
function formatMarketResponse(market) {
  const plain = market.toJSON();
  return {
    id: plain.id,
    title: plain.title,
    description: plain.description,
    category: plain.category,
    status: plain.status,
    close_date: plain.close_date,
    resolution_date: plain.resolution_date,
    total_volume: parseFloat(plain.total_volume || 0),
    image_url: plain.image_url,
    winning_outcome_id: plain.winning_outcome_id,
    search_keywords: plain.search_keywords,
    outcomes: (plain.outcomes || []).map(o => ({
      id: o.id,
      title: o.title,
      probability: parseInt(o.probability || 0),
      total_stake: parseFloat(o.total_stake || 0)
    })),
    created_at: plain.created_at,
    updated_at: plain.updated_at
  };
}

/**
 * Recompute market stats based on outcome stakes
 */
function recomputeMarketStats(market) {
  const outcomes = market.outcomes || [];
  const totalStake = outcomes.reduce((sum, o) => sum + parseFloat(o.total_stake || 0), 0);
  
  market.total_volume = totalStake;
  
  if (totalStake > 0) {
    outcomes.forEach((o) => {
      o.probability = Math.round((parseFloat(o.total_stake || 0) / totalStake) * 100);
    });
  }
  
  return market;
}

/**
 * Calculate user balance from transactions
 */
async function calculateBalanceFromTransactions(userId) {
  const transactions = await Transaction.findAll({
    where: { user_id: userId }
  });
  
  const predictions = await Prediction.findAll({
    where: { user_id: userId }
  });
  
  // Sum deposits (completed only)
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  
  // Sum withdrawals (completed only)
  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'completed')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  
  // Sum active prediction stakes (money locked in trades)
  const activePredictionStakes = predictions
    .filter(p => p.status === 'active')
    .reduce((sum, p) => sum + parseFloat(p.stake_amount || 0), 0);
  
  // Balance = deposits - withdrawals - active stakes
  const balance = totalDeposits - totalWithdrawals - activePredictionStakes;
  
  return {
    balance: Math.max(0, balance),
    totalDeposits,
    totalWithdrawals,
    activePredictionStakes
  };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'samsa-api', database: 'postgresql' });
});

// ============================================================================
// LEAGUE STATS
// ============================================================================

app.get('/api/leagues/:leagueId/stats', async (req, res) => {
  try {
    const { leagueId } = req.params;
    
    // Markets don't have league_id field yet, return defaults
    const leagueMarkets = await Market.findAll({
      where: { 
        status: 'active',
        // league_id: leagueId  // Add this when markets have league associations
      }
    });
    
    const activeMarkets = leagueMarkets.length;
    const totalVolume = leagueMarkets.reduce((sum, m) => sum + parseFloat(m.total_volume || 0), 0);
    
    const leagueMarketIds = leagueMarkets.map(m => m.id);
    const predictionCount = await Prediction.count({
      where: { market_id: { [Op.in]: leagueMarketIds } }
    });
    
    res.json({
      league_id: leagueId,
      active_markets: activeMarkets,
      total_volume: totalVolume,
      predictions: predictionCount
    });
  } catch (error) {
    console.error('League stats error:', error);
    res.status(500).json({ error: 'Failed to fetch league stats' });
  }
});

// ============================================================================
// MARKETS - CURRENT EVENTS / TRENDING
// ============================================================================

app.get('/api/markets/current-events', async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    
    const markets = await Market.findAll({
      where: {
        status: 'active',
        [Op.or]: [
          { close_date: null },
          {
            close_date: {
              [Op.lte]: sixMonthsFromNow,
              [Op.gt]: now
            }
          }
        ]
      },
      include: [{ model: Outcome, as: 'outcomes' }],
      order: [['total_volume', 'DESC']]
    });
    
    const formatted = markets.map(formatMarketResponse);
    res.json(formatted);
  } catch (error) {
    console.error('Current events error:', error);
    res.status(500).json({ error: 'Failed to fetch current events' });
  }
});

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
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const markets = await Market.findAll({
      where: { status: 'active' },
      include: [{ model: Outcome, as: 'outcomes' }],
      order: [['total_volume', 'DESC']],
      limit
    });
    
    const formatted = markets.map(formatMarketResponse);
    res.json(formatted);
  } catch (error) {
    console.error('Trending markets error:', error);
    res.status(500).json({ error: 'Failed to fetch trending markets' });
  }
});

app.get('/api/markets/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const markets = await Market.findAll({
      where: {
        status: 'active',
        category: { [Op.iLike]: category }
      },
      include: [{ model: Outcome, as: 'outcomes' }]
    });
    
    const formatted = markets.map(formatMarketResponse);
    res.json(formatted);
  } catch (error) {
    console.error('Category markets error:', error);
    res.status(500).json({ error: 'Failed to fetch category markets' });
  }
});

app.get('/api/markets/suggestions', async (req, res) => {
  // Static suggestions (same as before)
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

// ============================================================================
// MARKETS CRUD
// ============================================================================

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
  try {
    const markets = await Market.findAll({
      include: [{ model: Outcome, as: 'outcomes' }],
      order: [['created_at', 'DESC']]
    });
    
    const formatted = markets.map(formatMarketResponse);
    res.json(formatted);
  } catch (error) {
    console.error('Get markets error:', error);
    res.status(500).json({ error: 'Failed to fetch markets' });
  }
});

app.get('/api/markets/:id', async (req, res) => {
  try {
    const market = await Market.findByPk(req.params.id, {
      include: [{ model: Outcome, as: 'outcomes' }]
    });
    
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }
    
    res.json(formatMarketResponse(market));
  } catch (error) {
    console.error('Get market error:', error);
    res.status(500).json({ error: 'Failed to fetch market' });
  }
});

app.post('/api/markets', async (req, res) => {
  try {
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

    // Start transaction
    const result = await sequelize.transaction(async (t) => {
      // Create market
      const market = await Market.create({
        id: nanoid(12),
        title,
        description,
        category,
        status: 'active',
        close_date,
        resolution_date,
        total_volume: 0,
        image_url,
        winning_outcome_id: null,
        search_keywords
      }, { transaction: t });

      // Create outcomes
      const outcomePromises = outcomes.map((o) =>
        Outcome.create({
          id: o.id || nanoid(8),
          market_id: market.id,
          title: o.title,
          probability: typeof o.probability === 'number' ? o.probability : Math.round(100 / outcomes.length),
          total_stake: typeof o.total_stake === 'number' ? o.total_stake : 0
        }, { transaction: t })
      );

      await Promise.all(outcomePromises);

      // Fetch market with outcomes
      const fullMarket = await Market.findByPk(market.id, {
        include: [{ model: Outcome, as: 'outcomes' }],
        transaction: t
      });

      return fullMarket;
    });

    res.status(201).json(formatMarketResponse(result));
  } catch (error) {
    console.error('Create market error:', error);
    res.status(500).json({ error: 'Failed to create market' });
  }
});

// ============================================================================
// PREDICTIONS
// ============================================================================

app.get('/api/predictions', async (req, res) => {
  try {
    const { market_id } = req.query;
    const where = market_id ? { market_id } : {};
    
    const predictions = await Prediction.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
    
    res.json(predictions);
  } catch (error) {
    console.error('Get predictions error:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

app.post('/api/predictions', async (req, res) => {
  try {
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

    // Use transaction for atomic operation
    const result = await sequelize.transaction(async (t) => {
      // Find market with outcomes
      const market = await Market.findByPk(market_id, {
        include: [{ model: Outcome, as: 'outcomes' }],
        transaction: t
      });

      if (!market) {
        throw new Error('Market not found');
      }

      if (market.status !== 'active') {
        throw new Error('Market is not active');
      }

      const outcome = market.outcomes.find((o) => o.id === outcome_id);
      if (!outcome) {
        throw new Error('Outcome not found');
      }

      // Calculate potential return
      const potential_return = Number((stake_amount * (100 / Math.max(odds_at_prediction, 1))).toFixed(2));

      // Create prediction
      const prediction = await Prediction.create({
        id: nanoid(12),
        market_id,
        outcome_id,
        user_id,
        stake_amount,
        odds_at_prediction,
        potential_return,
        status: 'active',
        actual_return: 0
      }, { transaction: t });

      // Update outcome total stake
      await outcome.update({
        total_stake: parseFloat(outcome.total_stake) + stake_amount
      }, { transaction: t });

      // Recalculate market stats
      const updatedMarket = await Market.findByPk(market_id, {
        include: [{ model: Outcome, as: 'outcomes' }],
        transaction: t
      });

      recomputeMarketStats(updatedMarket);

      // Update market total volume and outcome probabilities
      await updatedMarket.save({ transaction: t });
      
      for (const o of updatedMarket.outcomes) {
        await o.save({ transaction: t });
      }

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
      return prediction;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create prediction error:', error);
    if (error.message === 'Market not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Market is not active' || error.message === 'Outcome not found') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create prediction' });
  }
});

// ============================================================================
// MARKET RESOLUTION
// ============================================================================

app.post('/api/markets/:id/resolve', async (req, res) => {
  try {
    const { winning_outcome_id } = req.body;

    const result = await sequelize.transaction(async (t) => {
      // Find market with outcomes
      const market = await Market.findByPk(req.params.id, {
        include: [{ model: Outcome, as: 'outcomes' }],
        transaction: t
      });

      if (!market) {
        throw new Error('Market not found');
      }

      const winOutcome = market.outcomes.find((o) => o.id === winning_outcome_id);
      if (!winOutcome) {
        throw new Error('Invalid winning_outcome_id');
      }

      // Update market status
      await market.update({
        status: 'resolved',
        winning_outcome_id,
        resolution_date: new Date()
      }, { transaction: t });

      // Update all predictions for this market
      const predictions = await Prediction.findAll({
        where: { market_id: market.id },
        transaction: t
      });

      for (const prediction of predictions) {
        const won = prediction.outcome_id === winning_outcome_id;
        await prediction.update({
          status: won ? 'won' : 'lost',
          actual_return: won ? prediction.potential_return : 0,
          resolved_at: new Date()
        }, { transaction: t });
      }

      return market;
    });

    res.json({ ok: true, market: formatMarketResponse(result) });
  } catch (error) {
    console.error('Resolve market error:', error);
    if (error.message === 'Market not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Invalid winning_outcome_id') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to resolve market' });
  }
});

// ============================================================================
// WALLET / USER ENDPOINTS
// ============================================================================

app.get('/api/users/:id/balance', async (req, res) => {
  try {
    let user = await User.findByPk(req.params.id);
    
    if (!user) {
      // Create default user if not found
      user = await User.create({
        id: req.params.id,
        username: 'user',
        email: ''
      });
    }
    
    // Calculate balance from transactions
    const balanceInfo = await calculateBalanceFromTransactions(req.params.id);
    
    res.json({
      balance: balanceInfo.balance,
      total_deposited: balanceInfo.totalDeposits,
      total_withdrawn: balanceInfo.totalWithdrawals,
      active_stakes: balanceInfo.activePredictionStakes,
      user
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

app.post('/api/users/:id/deposit', async (req, res) => {
  try {
    const { amount, payment_method = 'card' } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    if (amount > 10000) {
      return res.status(400).json({ error: 'Maximum deposit is $10,000' });
    }

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
    const result = await sequelize.transaction(async (t) => {
      // Get or create user
      let user = await User.findByPk(req.params.id, { transaction: t });
      
      if (!user) {
        user = await User.create({
          id: req.params.id,
          username: 'user',
          email: ''
        }, { transaction: t });
      }

      // Create transaction
      const transaction = await Transaction.create({
        id: nanoid(12),
        user_id: req.params.id,
        type: 'deposit',
        amount,
        payment_method,
        status: 'completed',
        completed_at: new Date()
      }, { transaction: t });

      return transaction;
    });

    // Calculate new balance
    const balanceInfo = await calculateBalanceFromTransactions(req.params.id);

    res.status(201).json({
      success: true,
      transaction: result,
      new_balance: balanceInfo.balance
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Failed to process deposit' });
  }
});

app.post('/api/users/:id/withdraw', async (req, res) => {
  try {
    const { amount, withdrawal_method = 'bank' } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }

    // Calculate current balance
    const currentBalanceInfo = await calculateBalanceFromTransactions(req.params.id);

    if (currentBalanceInfo.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const result = await sequelize.transaction(async (t) => {
      // Ensure user exists
      let user = await User.findByPk(req.params.id, { transaction: t });
      
      if (!user) {
        user = await User.create({
          id: req.params.id,
          username: 'user',
          email: ''
        }, { transaction: t });
      }

      // Create withdrawal transaction
      const transaction = await Transaction.create({
        id: nanoid(12),
        user_id: req.params.id,
        type: 'withdrawal',
        amount,
        payment_method: withdrawal_method,
        status: 'completed',
        completed_at: new Date()
      }, { transaction: t });

      return transaction;
    });

    // Calculate new balance
    const balanceInfo = await calculateBalanceFromTransactions(req.params.id);

    res.status(201).json({
      success: true,
      transaction: result,
      new_balance: balanceInfo.balance
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

app.get('/api/users/:id/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { user_id: req.params.id },
      order: [['created_at', 'DESC']]
    });
    
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
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
// ============================================================================
// START SERVER
// ============================================================================

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync models (create tables if they don't exist)
    await sequelize.sync({ alter: false }); // Don't auto-alter in production
    console.log('✅ Database synchronized');
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Samsa API listening on http://localhost:${PORT}`);
      console.log(`📊 Using PostgreSQL database`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
