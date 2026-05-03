require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { nanoid } = require('nanoid');
const { readJson, writeJson, addTransaction, findTransactionByExternalId, updateTransaction } = require('./lib/datastore');

// Import database models
const {
  sequelize,
  User,
  Transaction,
  initializeDatabase
} = require('./lib/database/models');

const app = express();
const PORT = process.env.PORT || 3001;
const Stripe = require('stripe');
const stripeSecret = (process.env.STRIPE_SECRET_KEY || '').trim();
const stripe = stripeSecret ? Stripe(stripeSecret) : null;

const DATA_DIR = path.join(__dirname, 'data');
const USERS_PATH = path.join(DATA_DIR, 'users.json');
const TRANSACTIONS_PATH = path.join(DATA_DIR, 'transactions.json');

// CORS configuration - allow requests from Railway frontend
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://dobium.up.railway.app',
    /\.railway\.app$/  // Allow all Railway domains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Serve the React frontend from ../frontend/dist/
const REACT_BUILD = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(REACT_BUILD));

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
 * Calculate user balance from transactions
 */
async function calculateBalanceFromTransactions(userId) {
  const transactions = await Transaction.findAll({
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

  // Balance = deposits - withdrawals
  const balance = totalDeposits - totalWithdrawals;

  return {
    balance: Math.max(0, balance),
    totalDeposits,
    totalWithdrawals
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
// MARKETS - served from data/markets.json (no external API key required)
// ============================================================================

const MARKETS_PATH = path.join(DATA_DIR, 'markets.json');
const PREDICTIONS_PATH = path.join(DATA_DIR, 'predictions.json');

// Virtual liquidity added to every outcome to prevent extreme 0%/100% prices.
// Higher value = prices move less on each trade (more stable).
const BASE_LIQUIDITY = 200;

/**
 * Recompute outcome probabilities.
 *
 * - binary / multi_single: liquidity-smoothed proportional formula, sums to 100%
 *     prob_i = (B + stake_i) / (n·B + total_volume)
 *
 * - multi_multiple: each outcome is an independent binary question anchored at 50%
 *     prob_i = (B + stake_i) / (2·B + stake_i)
 *   Outcomes do NOT need to sum to 100% — they are each their own yes/no market.
 */
function recomputeProbabilities(outcomes, totalVolume, marketType) {
  if (marketType === 'multi_multiple') {
    // Independent binary model — base anchors each outcome at 50%
    return outcomes.map(o => ({
      ...o,
      probability: parseFloat(
        ((BASE_LIQUIDITY + (o.total_stake || 0)) / (2 * BASE_LIQUIDITY + (o.total_stake || 0)) * 100).toFixed(2)
      )
    }));
  }

  // Proportional model (binary / multi_single) — must sum to 100%
  const n = outcomes.length;
  const denom = n * BASE_LIQUIDITY + totalVolume;
  const raw = outcomes.map(o => (BASE_LIQUIDITY + (o.total_stake || 0)) / denom * 100);
  // Normalize to exactly 100 (fix floating-point drift)
  const sum = raw.reduce((a, b) => a + b, 0);
  return outcomes.map((o, i) => ({
    ...o,
    probability: parseFloat((raw[i] + (i === outcomes.length - 1 ? 100 - sum : 0)).toFixed(2))
  }));
}

async function getMarkets() {
  try { return await readJson(MARKETS_PATH); }
  catch { return []; }
}

async function getPredictions() {
  try { return await readJson(PREDICTIONS_PATH); }
  catch { return []; }
}

// Current events — active markets closing within 6 months
app.get('/api/markets/current-events', async (req, res) => {
  try {
    const all = await getMarkets();
    const now = new Date();
    const cutoff = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    const filtered = all.filter(m => {
      if (m.status !== 'active') return false;
      if (!m.close_date) return true;
      const d = new Date(m.close_date);
      return d > now && d <= cutoff;
    });
    res.json(filtered);
  } catch (error) {
    console.error('Current events error:', error);
    res.status(500).json({ error: 'Failed to fetch current events' });
  }
});

// Trending — top N by total_volume
app.get('/api/markets/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const all = await getMarkets();
    const trending = all
      .filter(m => m.status === 'active')
      .sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0))
      .slice(0, limit);
    res.json(trending);
  } catch (error) {
    console.error('Trending markets error:', error);
    res.status(500).json({ error: 'Failed to fetch trending markets' });
  }
});

// By category
app.get('/api/markets/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const all = await getMarkets();
    const filtered = all.filter(m =>
      m.status === 'active' &&
      m.category?.toLowerCase() === category.toLowerCase()
    );
    res.json(filtered);
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
// MARKETS CRUD — JSON file based
// ============================================================================

// GET all markets
app.get('/api/markets', async (req, res) => {
  try {
    const markets = await getMarkets();
    res.json(markets);
  } catch (error) {
    console.error('Get markets error:', error);
    res.status(500).json({ error: 'Failed to fetch markets' });
  }
});

// GET single market by id
app.get('/api/markets/:id', async (req, res) => {
  try {
    const markets = await getMarkets();
    const market = markets.find(m => m.id === req.params.id);
    if (!market) return res.status(404).json({ error: 'Market not found' });
    res.json(market);
  } catch (error) {
    console.error('Get market error:', error);
    res.status(500).json({ error: 'Failed to fetch market' });
  }
});

// POST create market (appends to JSON file)
app.post('/api/markets', async (req, res) => {
  try {
    const { title, description, category, outcomes = [], image_url = '', search_keywords = '', close_date = null, resolution_date = null } = req.body;
    if (!title || !description || !category || !Array.isArray(outcomes) || outcomes.length < 2) {
      return res.status(400).json({ error: 'Invalid market payload' });
    }
    const markets = await getMarkets();
    const newMarket = {
      id: nanoid(12),
      title, description, category,
      status: 'active',
      close_date, resolution_date,
      outcomes: outcomes.map(o => ({
        id: o.id || nanoid(8),
        title: o.title,
        probability: typeof o.probability === 'number' ? o.probability : Math.round(100 / outcomes.length),
        total_stake: 0
      })),
      total_volume: 0,
      image_url,
      winning_outcome_id: null,
      search_keywords,
      created_at: new Date().toISOString()
    };
    markets.push(newMarket);
    await writeJson(MARKETS_PATH, markets);
    res.status(201).json(newMarket);
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
    let predictions = await getPredictions();
    if (market_id) {
      predictions = predictions.filter(p => p.market_id === market_id);
    }
    // Sort newest first
    predictions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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

    // Validate market exists and is active
    const markets = await getMarkets();
    const market = markets.find(m => m.id === market_id);
    if (!market) return res.status(404).json({ error: 'Market not found' });
    if (market.status !== 'active') return res.status(400).json({ error: 'Market is not active' });

    const outcome = (market.outcomes || []).find(o => o.id === outcome_id);
    if (!outcome) return res.status(400).json({ error: 'Outcome not found' });

    // Calculate potential return using S(1-p) formula
    const p = odds_at_prediction / 100;
    const potential_return = Number((stake_amount + stake_amount * (1 - p)).toFixed(2));

    const prediction = {
      id: nanoid(12),
      market_id,
      outcome_id,
      user_id,
      stake_amount,
      odds_at_prediction,
      potential_return,
      status: 'active',
      actual_return: 0,
      created_at: new Date().toISOString()
    };

    const predictions = await getPredictions();
    predictions.push(prediction);
    await writeJson(PREDICTIONS_PATH, predictions);

    // Update outcome total_stake, market total_volume, recalculate prices, and record snapshot
    const updatedMarkets = markets.map(m => {
      if (m.id !== market_id) return m;
      const updatedOutcomes = (m.outcomes || []).map(o => {
        if (o.id !== outcome_id) return o;
        return { ...o, total_stake: (o.total_stake || 0) + stake_amount };
      });
      const newVolume = (m.total_volume || 0) + stake_amount;
      const pricedOutcomes = recomputeProbabilities(updatedOutcomes, newVolume, m.market_type);

      // Append a new price history snapshot so charts update in real time
      const snapshot = {
        timestamp: new Date().toISOString(),
        prices: Object.fromEntries(pricedOutcomes.map(o => [o.id, o.probability]))
      };
      const priceHistory = [...(m.price_history || []), snapshot];

      return { ...m, outcomes: pricedOutcomes, total_volume: newVolume, price_history: priceHistory };
    });
    await writeJson(MARKETS_PATH, updatedMarkets);

    res.status(201).json(prediction);
  } catch (error) {
    console.error('Create prediction error:', error);
    res.status(500).json({ error: 'Failed to create prediction' });
  }
});

// ============================================================================
// SELL POSITION
// ============================================================================

app.post('/api/positions/sell', async (req, res) => {
  try {
    const { market_id, outcome_id, user_id, sell_amount } = req.body;

    if (!market_id || !outcome_id || !user_id || typeof sell_amount !== 'number' || sell_amount <= 0) {
      return res.status(400).json({ error: 'Invalid sell payload' });
    }

    // Get current market probability for this outcome
    const markets = await getMarkets();
    const market = markets.find(m => m.id === market_id);
    if (!market) return res.status(404).json({ error: 'Market not found' });
    if (market.status !== 'active') return res.status(400).json({ error: 'Cannot sell on a resolved market' });

    const outcome = (market.outcomes || []).find(o => o.id === outcome_id);
    if (!outcome) return res.status(400).json({ error: 'Outcome not found' });

    const currentProb = outcome.probability || 50; // current market probability (0-100)

    // Find all active predictions for this user/market/outcome
    const allPredictions = await getPredictions();
    const userPositions = allPredictions.filter(
      p => p.user_id === user_id && p.market_id === market_id && p.outcome_id === outcome_id && p.status === 'active'
    );

    const totalStake = userPositions.reduce((sum, p) => sum + (p.stake_amount || 0), 0);
    if (totalStake === 0) return res.status(400).json({ error: 'No active position to sell' });
    if (sell_amount > totalStake) return res.status(400).json({ error: `Cannot sell more than your position ($${totalStake.toFixed(2)})` });

    // Weighted average entry probability
    const weightedOddsSum = userPositions.reduce((sum, p) => sum + (p.odds_at_prediction || 50) * (p.stake_amount || 0), 0);
    const avgEntryProb = weightedOddsSum / totalStake;

    // Sell return = sell_amount × (current_prob / avg_entry_prob)
    // Capped at 2× sell_amount to prevent absurd returns
    const sellReturn = Math.min(
      parseFloat((sell_amount * (currentProb / avgEntryProb)).toFixed(2)),
      sell_amount * 2
    );

    // Reduce stakes across predictions (oldest first) until sell_amount is consumed
    let remaining = sell_amount;
    const updatedPredictions = allPredictions.map(p => {
      if (remaining <= 0) return p;
      if (p.user_id !== user_id || p.market_id !== market_id || p.outcome_id !== outcome_id || p.status !== 'active') return p;

      const stake = p.stake_amount || 0;
      if (stake <= remaining) {
        // Sell entire prediction
        remaining -= stake;
        return { ...p, status: 'sold', actual_return: parseFloat((stake * (currentProb / avgEntryProb)).toFixed(2)), sold_at: new Date().toISOString() };
      } else {
        // Partial sell — reduce stake, keep remainder active
        const soldPortion = remaining;
        remaining = 0;
        return { ...p, stake_amount: parseFloat((stake - soldPortion).toFixed(2)) };
      }
    });

    await writeJson(PREDICTIONS_PATH, updatedPredictions);

    // Update market: reduce total_stake on the sold outcome and total_volume,
    // then recalculate probabilities for all outcomes proportionally.
    const updatedMarkets = markets.map(m => {
      if (m.id !== market_id) return m;

      const updatedOutcomes = (m.outcomes || []).map(o => {
        if (o.id !== outcome_id) return o;
        return { ...o, total_stake: Math.max(0, (o.total_stake || 0) - sell_amount) };
      });

      const newTotalVolume = Math.max(0, (m.total_volume || 0) - sell_amount);

      // Use liquidity-smoothed pricing — prevents extreme 0/100% swings
      const pricedOutcomes = recomputeProbabilities(updatedOutcomes, newTotalVolume, m.market_type);

      // Append a new price history snapshot so charts update in real time
      const snapshot = {
        timestamp: new Date().toISOString(),
        prices: Object.fromEntries(pricedOutcomes.map(o => [o.id, o.probability]))
      };
      const priceHistory = [...(m.price_history || []), snapshot];

      return { ...m, outcomes: pricedOutcomes, total_volume: newTotalVolume, price_history: priceHistory };
    });

    await writeJson(MARKETS_PATH, updatedMarkets);
    const updatedMarket = updatedMarkets.find(m => m.id === market_id);

    res.json({
      ok: true,
      sell_amount,
      sell_return: sellReturn,
      net_pnl: parseFloat((sellReturn - sell_amount).toFixed(2)),
      current_probability: currentProb,
      avg_entry_probability: parseFloat(avgEntryProb.toFixed(2)),
      market: updatedMarket,
    });
  } catch (error) {
    console.error('Sell position error:', error);
    res.status(500).json({ error: 'Failed to sell position' });
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
      user
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`\n🗑️  DELETE /api/users/${userId} — Account deletion requested`);

    // Delete user transactions from local DB
    try {
      await Transaction.destroy({ where: { user_id: userId } });
      console.log('  ✓ Transactions deleted from local DB');
    } catch (e) { console.log('  ✗ Transaction cleanup:', e.message); }

    // Delete user from local DB
    try {
      await User.destroy({ where: { id: userId } });
      console.log('  ✓ User deleted from local DB');
    } catch (e) { console.log('  ✗ User cleanup:', e.message); }

    // Delete from Supabase auth (requires service role key)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    console.log(`  Supabase URL: ${supabaseUrl ? '✓ found' : '✗ MISSING'}`);
    console.log(`  Service Role Key: ${serviceRoleKey ? '✓ found (' + serviceRoleKey.substring(0, 20) + '...)' : '✗ MISSING'}`);

    if (supabaseUrl && serviceRoleKey) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });

        // Delete profile data from Supabase tables
        const profileRes = await supabaseAdmin.from('profiles').delete().eq('id', userId);
        console.log(`  Profiles delete: ${profileRes.error ? '✗ ' + profileRes.error.message : '✓ done'}`);

        const usersRes = await supabaseAdmin.from('users').delete().eq('id', userId);
        console.log(`  Users table delete: ${usersRes.error ? '✗ ' + usersRes.error.message : '✓ done'}`);

        // Delete the auth user entirely
        console.log(`  Deleting auth user ${userId}...`);
        const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) {
          console.error(`  ✗ Supabase auth.admin.deleteUser FAILED: ${error.message}`);
          console.error('    Full error:', JSON.stringify(error));
        } else {
          console.log(`  ✅ User ${userId} FULLY DELETED from Supabase auth`);
        }
      } catch (e) {
        console.error('  ✗ Supabase admin error:', e.message);
        console.error('    Stack:', e.stack);
      }
    } else {
      console.warn('  ⚠️  SUPABASE_SERVICE_ROLE_KEY not set — auth user NOT deleted');
    }

    console.log('  → Sending success response\n');
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
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

// ============================================================================
// SPA FALLBACK — let React Router handle all non-API routes
// ============================================================================

app.get('*', (req, res) => {
  // Only serve the React app for non-API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/config/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(REACT_BUILD, 'index.html'));
});

// ============================================================================
// START SERVER
// ============================================================================

async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    await sequelize.sync({ alter: false });
    console.log('✅ Database synchronized');
  } catch (error) {
    // Keep server alive with JSON file fallback when DB is unavailable.
    console.warn('⚠️  Database unavailable, running in file-based mode: ', error.message || '');
  }
}

const server = app.listen(PORT, () => {
  console.log(`✅ Samsa API listening on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`   In PowerShell, run:`);
    console.error(`   netstat -ano | findstr :${PORT}`);
    console.error(`   Then kill by PID:  taskkill /PID 12345 /F  (replace 12345 with the actual PID)`);
    process.exit(1);
  } else {
    throw err;
  }
});

initDatabase();
