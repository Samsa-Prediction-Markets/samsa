// ============================================================================
// DATABASE CONNECTION
// ============================================================================
// Manages PostgreSQL connection using Sequelize ORM

const { Sequelize } = require('sequelize');

// Load environment variables
require('dotenv').config();

// Determine if we need SSL (any remote database, not just production)
const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/samsa_dev';
const isRemote = !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');

console.log(`🔗 Database URL: ${dbUrl ? dbUrl.substring(0, 30) + '...' : 'NOT SET'}`);
console.log(`🔒 SSL enabled: ${isRemote}`);

// Create Sequelize instance
const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries
  pool: {
    max: 20,        // Maximum number of connections
    min: 0,         // Minimum number of connections
    acquire: 30000, // Maximum time (ms) to get connection
    idle: 10000     // Maximum time (ms) connection can be idle
  },
  // Enable SSL for any remote database (Supabase, Railway, etc.)
  dialectOptions: isRemote ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

// Test connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    return false;
  }
}

module.exports = { sequelize, testConnection };

