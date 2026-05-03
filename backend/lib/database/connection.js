// ============================================================================
// DATABASE CONNECTION
// ============================================================================
// Manages PostgreSQL connection using Sequelize ORM

const { Sequelize } = require('sequelize');
const { execSync } = require('child_process');

// Load environment variables
require('dotenv').config();

const rawUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/samsa_dev';
const isRemote = !rawUrl.includes('localhost') && !rawUrl.includes('127.0.0.1');

/**
 * Resolve a hostname to IPv4 synchronously.
 * Railway cannot reach Supabase over IPv6, so we resolve to IPv4 first
 * and replace the hostname in the URL with the IP address.
 */
function resolveIPv4(dbUrl) {
  if (!isRemote) return dbUrl;
  try {
    const urlObj = new URL(dbUrl);
    const hostname = urlObj.hostname;
    // Spawn a child process to resolve DNS to IPv4
    const ip = execSync(
      `node -e "require('dns').resolve4('${hostname}', (e,a) => process.stdout.write(a && a[0] || ''))"`,
      { encoding: 'utf-8', timeout: 10000 }
    ).trim();
    if (ip) {
      console.log(`🌐 Resolved ${hostname} → ${ip} (IPv4)`);
      urlObj.hostname = ip;
      return urlObj.toString();
    }
    console.warn(`⚠️  No IPv4 address found for ${hostname}`);
  } catch (err) {
    console.warn(`⚠️  IPv4 resolution failed: ${err.message}`);
  }
  return dbUrl;
}

const dbUrl = resolveIPv4(rawUrl);
console.log(`🔗 Database: ${isRemote ? 'remote (SSL)' : 'local'}`);

// Create Sequelize instance with resolved IPv4 URL
const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
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

