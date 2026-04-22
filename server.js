try { require('dotenv').config(); } catch (e) {}
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

// Serve the frontend bundle from web/
app.use(express.static(path.join(__dirname, 'web')));

// Root route to load the app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
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

app.listen(PORT, () => {
  console.log(`Samsa API listening on http://localhost:${PORT}`);
});

initDatabase();
