// ============================================================================
// DATABASE CONNECTION
// ============================================================================
// Manages PostgreSQL connection using Sequelize ORM

const { Sequelize } = require('sequelize');

// Load environment variables
require('dotenv').config();

// Create Sequelize instance
// Falls back to local PostgreSQL if DATABASE_URL not set
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://localhost:5432/samsa_dev',
  {
    dialect: 'postgres',
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 20,        // Maximum number of connections
      min: 0,         // Minimum number of connections
      acquire: 30000, // Maximum time (ms) to get connection
      idle: 10000     // Maximum time (ms) connection can be idle
    },
    // For production, enable SSL
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
);

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

