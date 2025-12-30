require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { nanoid } = require('nanoid');
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

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve the frontend bundle from root
app.use(express.static(__dirname));

// Root route to load the app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
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
