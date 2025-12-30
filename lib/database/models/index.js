// ============================================================================
// MODELS INDEX
// ============================================================================
// Exports all models and defines their relationships

const { sequelize } = require('../connection');
const Market = require('./Market');
const Outcome = require('./Outcome');
const Prediction = require('./Prediction');
const User = require('./User');
const Transaction = require('./Transaction');

// ============================================================================
// DEFINE RELATIONSHIPS
// ============================================================================

// Market has many Outcomes
Market.hasMany(Outcome, {
  foreignKey: 'market_id',
  as: 'outcomes',
  onDelete: 'CASCADE'
});
Outcome.belongsTo(Market, {
  foreignKey: 'market_id',
  as: 'market'
});

// Market has many Predictions
Market.hasMany(Prediction, {
  foreignKey: 'market_id',
  as: 'predictions'
});
Prediction.belongsTo(Market, {
  foreignKey: 'market_id',
  as: 'market'
});

// Outcome has many Predictions
Outcome.hasMany(Prediction, {
  foreignKey: 'outcome_id',
  as: 'predictions'
});
Prediction.belongsTo(Outcome, {
  foreignKey: 'outcome_id',
  as: 'outcome'
});

// User has many Predictions
User.hasMany(Prediction, {
  foreignKey: 'user_id',
  as: 'predictions'
});
Prediction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User has many Transactions
User.hasMany(Transaction, {
  foreignKey: 'user_id',
  as: 'transactions'
});
Transaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// ============================================================================
// SYNC DATABASE (Create tables if they don't exist)
// ============================================================================

/**
 * Initialize database - creates tables if they don't exist
 * @param {boolean} force - If true, drops existing tables (WARNING: deletes data!)
 */
async function initializeDatabase(force = false) {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log(`✅ Database ${force ? 'reset' : 'synchronized'} successfully`);
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  sequelize,
  Market,
  Outcome,
  Prediction,
  User,
  Transaction,
  initializeDatabase
};

