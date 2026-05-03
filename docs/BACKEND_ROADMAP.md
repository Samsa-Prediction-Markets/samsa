# Backend Development Roadmap
## Samsa Prediction Markets - Backend Team

### Primary Responsibility
**Make the system work reliably** - Handle trades, data persistence, and market operations flawlessly.

---

## Current Architecture

```
├── server.js              # Main Express server (558 lines)
├── lib/
│   ├── datastore.js       # JSON file read/write utilities
│   ├── datastore.py       # Python version (legacy)
│   └── lmsr.py           # LMSR pricing logic
├── data/                  # JSON file storage
│   ├── markets.json
│   ├── predictions.json
│   ├── users.json
│   └── transactions.json
```

**Current Tech Stack:**
- Node.js + Express.js
- JSON file storage (temporary)
- CORS + Morgan logging
- Nanoid for ID generation

---

## Phase 1: Database Setup & Migration (Priority: HIGH)

### Objective
Migrate from JSON files to PostgreSQL for reliability, concurrency, and performance.

### Tasks

#### 1.1 Install PostgreSQL Dependencies
```bash
npm install pg sequelize
npm install --save-dev sequelize-cli
```

#### 1.2 Create Database Schema
**File**: `lib/database/schema.sql`

```sql
-- Markets Table
CREATE TABLE markets (
    id VARCHAR(12) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    close_date TIMESTAMP,
    resolution_date TIMESTAMP,
    total_volume DECIMAL(10,2) DEFAULT 0,
    image_url TEXT,
    winning_outcome_id VARCHAR(8),
    search_keywords TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outcomes Table
CREATE TABLE outcomes (
    id VARCHAR(8) PRIMARY KEY,
    market_id VARCHAR(12) REFERENCES markets(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    probability INTEGER DEFAULT 0,
    total_stake DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions (Trades) Table
CREATE TABLE predictions (
    id VARCHAR(12) PRIMARY KEY,
    market_id VARCHAR(12) REFERENCES markets(id),
    outcome_id VARCHAR(8) REFERENCES outcomes(id),
    user_id VARCHAR(50) NOT NULL,
    stake_amount DECIMAL(10,2) NOT NULL,
    odds_at_prediction DECIMAL(5,2) NOT NULL,
    potential_return DECIMAL(10,2),
    actual_return DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table  
CREATE TABLE transactions (
    id VARCHAR(12) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- 'deposit' or 'withdrawal'
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_category ON markets(category);
CREATE INDEX idx_predictions_market ON predictions(market_id);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
```

#### 1.3 Create Database Connection Module
**File**: `lib/database/connection.js`

```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://localhost:5432/samsa_dev',
  {
    dialect: 'postgres',
    logging: false, // Set to console.log for debugging
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
```

#### 1.4 Create Sequelize Models
**File**: `lib/database/models/Market.js`

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Market = sequelize.define('Market', {
  id: {
    type: DataTypes.STRING(12),
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: DataTypes.TEXT,
  category: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active'
  },
  close_date: DataTypes.DATE,
  resolution_date: DataTypes.DATE,
  total_volume: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  image_url: DataTypes.TEXT,
  winning_outcome_id: DataTypes.STRING(8),
  search_keywords: DataTypes.TEXT
}, {
  tableName: 'markets',
  timestamps: true,
  underscored: true
});

module.exports = Market;
```

**Similar files needed:**
- `lib/database/models/Outcome.js`
- `lib/database/models/Prediction.js`
- `lib/database/models/User.js`
- `lib/database/models/Transaction.js`
- `lib/database/models/index.js` (exports all models with associations)

#### 1.5 Migration Script
**File**: `scripts/migrate-json-to-db.js`

```javascript
// Script to migrate existing JSON data to PostgreSQL
const { readJson } = require('../lib/datastore');
const { Market, Outcome, Prediction, User, Transaction } = require('../lib/database/models');

async function migrateData() {
  console.log('Starting migration...');
  
  // Migrate markets and outcomes
  const markets = await readJson('./data/markets.json');
  for (const marketData of markets) {
    const market = await Market.create({
      id: marketData.id,
      title: marketData.title,
      description: marketData.description,
      category: marketData.category,
      status: marketData.status,
      close_date: marketData.close_date,
      resolution_date: marketData.resolution_date,
      total_volume: marketData.total_volume || 0,
      image_url: marketData.image_url,
      winning_outcome_id: marketData.winning_outcome_id,
      search_keywords: marketData.search_keywords
    });
    
    // Create outcomes
    for (const outcomeData of marketData.outcomes) {
      await Outcome.create({
        id: outcomeData.id,
        market_id: market.id,
        title: outcomeData.title,
        probability: outcomeData.probability || 0,
        total_stake: outcomeData.total_stake || 0
      });
    }
  }
  
  // Similar for predictions, users, transactions...
  
  console.log('Migration complete!');
}

migrateData().catch(console.error);
```

---

## Phase 2: Trade Persistence & Consistency (Priority: HIGH)

### Objective
Ensure atomic operations, prevent race conditions, validate all trades.

### Tasks

#### 2.1 Add Transaction Wrapper
**File**: `lib/transaction-manager.js`

```javascript
const sequelize = require('./database/connection');

async function withTransaction(callback) {
  const t = await sequelize.transaction();
  try {
    const result = await callback(t);
    await t.commit();
    return result;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

module.exports = { withTransaction };
```

#### 2.2 Improve Prediction Endpoint with Atomic Operations
**Update**: `POST /api/predictions` in server.js

```javascript
app.post('/api/predictions', async (req, res) => {
  try {
    await withTransaction(async (t) => {
      const { market_id, outcome_id, stake_amount, user_id } = req.body;
      
      // Validate inputs
      if (!market_id || !outcome_id || !stake_amount || stake_amount <= 0) {
        throw new Error('Invalid prediction data');
      }
      
      // Check user balance (atomic)
      const user = await User.findByPk(user_id, { transaction: t, lock: true });
      const balance = await calculateBalance(user_id, t);
      
      if (balance < stake_amount) {
        throw new Error('Insufficient balance');
      }
      
      // Check market is active (atomic)
      const market = await Market.findByPk(market_id, { transaction: t, lock: true });
      if (!market || market.status !== 'active') {
        throw new Error('Market not available');
      }
      
      // Get current odds (atomic)
      const outcome = await Outcome.findByPk(outcome_id, { transaction: t, lock: true });
      const odds = outcome.probability;
      
      // Create prediction
      const prediction = await Prediction.create({
        id: nanoid(12),
        market_id,
        outcome_id,
        user_id,
        stake_amount,
        odds_at_prediction: odds,
        potential_return: calculateReturn(stake_amount, odds),
        status: 'active'
      }, { transaction: t });
      
      // Update outcome stake (atomic)
      outcome.total_stake += stake_amount;
      await outcome.save({ transaction: t });
      
      // Recompute probabilities
      await recomputeMarketStats(market_id, t);
      
      return prediction;
    });
    
    res.status(201).json({ success: true, prediction });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(400).json({ error: error.message });
  }
});
```

#### 2.3 Add Validation Layer
**File**: `lib/validators.js`

```javascript
const Joi = require('joi');

const predictionSchema = Joi.object({
  market_id: Joi.string().required(),
  outcome_id: Joi.string().required(),
  stake_amount: Joi.number().min(1).max(10000).required(),
  user_id: Joi.string().required()
});

const marketSchema = Joi.object({
  title: Joi.string().min(10).max(255).required(),
  description: Joi.string().min(20).required(),
  category: Joi.string().valid(
    'politics', 'sports', 'crypto', 'technology', 
    'finance', 'entertainment', 'international'
  ).required(),
  outcomes: Joi.array().items(
    Joi.object({
      title: Joi.string().required()
    })
  ).min(2).required()
});

function validatePrediction(data) {
  const { error, value } = predictionSchema.validate(data);
  if (error) throw new Error(error.details[0].message);
  return value;
}

module.exports = { validatePrediction, validateMarket };
```

---

## Phase 3: Enhanced Market Resolution (Priority: MEDIUM)

### Objective
Robust, automated market resolution with multiple resolution sources.

### Tasks

#### 3.1 Resolution Engine
**File**: `lib/resolution-engine.js`

```javascript
class ResolutionEngine {
  async resolveMarket(marketId, winningOutcomeId, resolutionSource = 'manual') {
    await withTransaction(async (t) => {
      // Lock market
      const market = await Market.findByPk(marketId, { transaction: t, lock: true });
      
      if (market.status === 'resolved') {
        throw new Error('Market already resolved');
      }
      
      // Validate winning outcome
      const outcome = await Outcome.findOne({
        where: { id: winningOutcomeId, market_id: marketId },
        transaction: t
      });
      
      if (!outcome) {
        throw new Error('Invalid winning outcome');
      }
      
      // Update market
      market.status = 'resolved';
      market.winning_outcome_id = winningOutcomeId;
      market.resolution_date = new Date();
      await market.save({ transaction: t });
      
      // Settle all predictions
      const predictions = await Prediction.findAll({
        where: { market_id: marketId, status: 'active' },
        transaction: t,
        lock: true
      });
      
      for (const prediction of predictions) {
        const won = prediction.outcome_id === winningOutcomeId;
        prediction.status = won ? 'won' : 'lost';
        prediction.actual_return = won ? prediction.potential_return : 0;
        prediction.resolved_at = new Date();
        await prediction.save({ transaction: t });
        
        // Create payout transaction for winners
        if (won) {
          await Transaction.create({
            id: nanoid(12),
            user_id: prediction.user_id,
            type: 'payout',
            amount: prediction.actual_return,
            status: 'completed',
            completed_at: new Date()
          }, { transaction: t });
        }
      }
      
      // Log resolution
      console.log(`✅ Resolved market ${marketId} - Winner: ${outcome.title}`);
    });
  }
}

module.exports = new ResolutionEngine();
```

---

## Phase 4: Performance & Error Handling (Priority: MEDIUM)

### Tasks

#### 4.1 Add Proper Error Handling Middleware
**File**: `lib/middleware/error-handler.js`

```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

function errorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  
  if (process.env.NODE_ENV === 'production') {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.isOperational ? err.message : 'Something went wrong'
    });
  } else {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      stack: err.stack
    });
  }
  
  // Log error
  console.error('ERROR:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
}

module.exports = { AppError, errorHandler };
```

#### 4.2 Add Request Logging & Monitoring
**File**: `lib/middleware/logger.js`

```javascript
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create write streams
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

// Morgan formats
const successLogger = morgan('combined', {
  stream: accessLogStream,
  skip: (req, res) => res.statusCode >= 400
});

const errorLogger = morgan('combined', {
  stream: errorLogStream,
  skip: (req, res) => res.statusCode < 400
});

module.exports = { successLogger, errorLogger };
```

#### 4.3 Add Caching Layer
**File**: `lib/cache.js`

```javascript
// Simple in-memory cache for frequently accessed data
class SimpleCache {
  constructor() {
    this.cache = new Map();
  }
  
  set(key, value, ttl = 60000) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  invalidate(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
}

module.exports = new SimpleCache();
```

---

## Implementation Timeline

### Week 1-2: Database Setup
- [ ] Install PostgreSQL locally
- [ ] Create database schema
- [ ] Set up Sequelize models
- [ ] Write migration script
- [ ] Test migration with sample data

### Week 3: Trade Consistency
- [ ] Add transaction wrapper
- [ ] Update prediction endpoint with locks
- [ ] Add validation layer
- [ ] Test concurrent trades

### Week 4: Market Resolution
- [ ] Build resolution engine
- [ ] Add payout system
- [ ] Test resolution workflows
- [ ] Add resolution notifications

### Week 5: Performance & Monitoring
- [ ] Add error handling middleware
- [ ] Set up logging system
- [ ] Add caching for markets list
- [ ] Performance testing & optimization

---

## Testing Checklist

- [ ] Can create market successfully
- [ ] Can place prediction with valid balance
- [ ] Cannot place prediction with insufficient balance
- [ ] Concurrent predictions don't cause race conditions
- [ ] Market resolution settles all predictions correctly
- [ ] Winners receive payouts in transactions table
- [ ] Balance calculations are accurate
- [ ] Error responses are consistent and helpful
- [ ] System handles 100+ concurrent requests
- [ ] Database queries are optimized with indexes

---

## Environment Variables

Create `.env` file:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/samsa_dev
LOG_LEVEL=debug
```

---

## Useful Commands

```bash
# Start PostgreSQL (Mac)
brew services start postgresql

# Create database
createdb samsa_dev

# Run migrations
npm run migrate

# Start dev server
npm run dev

# Run tests
npm test
```

---

## Next Steps

1. **Start with Phase 1**: Get PostgreSQL running locally
2. **Create database schema**: Run the SQL file
3. **Build models**: One entity at a time
4. **Migrate data**: Test with small dataset first
5. **Update endpoints**: One route at a time
6. **Add tests**: Write tests as you go

---

**Questions?** Check the main Samsa repo or ask the team!

