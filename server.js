const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { nanoid } = require('nanoid');
const { readJson, writeJson } = require('./lib/datastore');

const app = express();
const PORT = process.env.PORT || 3001;

const DATA_DIR = path.join(__dirname, 'data');
const MARKETS_PATH = path.join(DATA_DIR, 'markets.json');
const PREDICTIONS_PATH = path.join(DATA_DIR, 'predictions.json');
const USERS_PATH = path.join(DATA_DIR, 'users.json');
const TRANSACTIONS_PATH = path.join(DATA_DIR, 'transactions.json');

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve the frontend bundle from root
app.use(express.static(__dirname));

// Root route to load the app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
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

app.get('/api/markets', async (req, res) => {
  const markets = await readJson(MARKETS_PATH);
  res.json(markets);
});

app.get('/api/markets/:id', async (req, res) => {
  const markets = await readJson(MARKETS_PATH);
  const market = markets.find((m) => m.id === req.params.id);
  if (!market) return res.status(404).json({ error: 'Market not found' });
  res.json(market);
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

// Get user balance
app.get('/api/users/:id/balance', async (req, res) => {
  const users = await readJson(USERS_PATH);
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    // Create default user if not found
    const newUser = {
      id: req.params.id,
      username: 'user',
      email: '',
      balance: 0,
      total_deposited: 0,
      total_withdrawn: 0,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    await writeJson(USERS_PATH, users);
    return res.json({ balance: 0, user: newUser });
  }
  res.json({ balance: user.balance, user });
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
      balance: 0,
      total_deposited: 0,
      total_withdrawn: 0,
      created_at: new Date().toISOString()
    };
    users.push(user);
  }

  // Update balance
  user.balance = (user.balance || 0) + amount;
  user.total_deposited = (user.total_deposited || 0) + amount;

  // Record transaction
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
    balance_after: user.balance,
    created_at: new Date().toISOString()
  };

  transactions.push(transaction);

  await writeJson(USERS_PATH, users);
  await writeJson(TRANSACTIONS_PATH, transactions);

  res.status(201).json({
    success: true,
    transaction,
    new_balance: user.balance
  });
});

// Withdraw funds
app.post('/api/users/:id/withdraw', async (req, res) => {
  const { amount, withdrawal_method = 'bank' } = req.body;

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }

  const users = await readJson(USERS_PATH);
  const user = users.find((u) => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  // Update balance
  user.balance -= amount;
  user.total_withdrawn = (user.total_withdrawn || 0) + amount;

  // Record transaction
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
    status: 'pending', // Withdrawals typically need processing
    balance_after: user.balance,
    created_at: new Date().toISOString()
  };

  transactions.push(transaction);

  await writeJson(USERS_PATH, users);
  await writeJson(TRANSACTIONS_PATH, transactions);

  res.status(201).json({
    success: true,
    transaction,
    new_balance: user.balance
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

app.listen(PORT, () => {
  console.log(`Samsa API listening on http://localhost:${PORT}`);
});