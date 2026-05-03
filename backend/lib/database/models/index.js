// ============================================================================
// MODELS INDEX
// ============================================================================
// Exports all models and defines their relationships

const { sequelize } = require('../connection');
const User = require('./User');
const Transaction = require('./Transaction');

// ============================================================================
// DEFINE RELATIONSHIPS
// ============================================================================

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
  User,
  Transaction,
  initializeDatabase
};
