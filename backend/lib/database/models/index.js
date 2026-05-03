// ============================================================================
// MODELS INDEX
// ============================================================================
// Exports all models and defines their relationships

const { sequelize } = require('../connection');
const User = require('./User');
const Transaction = require('./Transaction');
const Market = require('./Market');
const Outcome = require('./Outcome');
const Prediction = require('./Prediction');
const PriceHistory = require('./PriceHistory');

// ============================================================================
// DEFINE RELATIONSHIPS
// ============================================================================

// User has many Transactions
User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Market has many Outcomes
Market.hasMany(Outcome, { foreignKey: 'market_id', as: 'outcomes', onDelete: 'CASCADE' });
Outcome.belongsTo(Market, { foreignKey: 'market_id', as: 'market' });

// Market has many Predictions
Market.hasMany(Prediction, { foreignKey: 'market_id', as: 'predictions', onDelete: 'CASCADE' });
Prediction.belongsTo(Market, { foreignKey: 'market_id', as: 'market' });

// Outcome has many Predictions
Outcome.hasMany(Prediction, { foreignKey: 'outcome_id', as: 'predictions' });
Prediction.belongsTo(Outcome, { foreignKey: 'outcome_id', as: 'outcome' });

// Market has many PriceHistory entries
Market.hasMany(PriceHistory, { foreignKey: 'market_id', as: 'price_history', onDelete: 'CASCADE' });
PriceHistory.belongsTo(Market, { foreignKey: 'market_id', as: 'market' });

// User has many Predictions
User.hasMany(Prediction, { foreignKey: 'user_id', as: 'predictions' });
Prediction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ============================================================================
// SYNC DATABASE (Create tables if they don't exist)
// ============================================================================

/**
 * Initialize database - creates tables if they don't exist
 * @param {boolean} force - If true, drops existing tables (WARNING: deletes data!)
 */
async function initializeDatabase(force = false) {
  try {
    // SAFETY: Never allow force=true in production
    if (force && process.env.NODE_ENV === 'production') {
      console.error('❌ PREVENTED: Cannot reset database in production environment');
      console.error('   To reset production database, you must do it manually');
      force = false;
    }

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
  User,
  Transaction,
  Market,
  Outcome,
  Prediction,
  PriceHistory,
  initializeDatabase
};
