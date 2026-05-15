const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const PREDICTIONS_PATH = path.join(DATA_DIR, 'predictions.json');
const TRANSACTIONS_PATH = path.join(DATA_DIR, 'transactions.json');

async function readJson(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

async function checkBalance(userId) {
  const predictions = await readJson(PREDICTIONS_PATH);
  const transactions = await readJson(TRANSACTIONS_PATH);

  const userPreds = predictions.filter(p => p.user_id === userId);
  const userTransactions = transactions.filter(t => t.user_id === userId);

  const activePreds = userPreds.filter(p => p.status === 'active');
  const totalDeposits = userTransactions
    .filter(t => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const activePredictionStakes = activePreds.reduce((sum, p) => sum + (p.stake_amount || 0), 0);
  const balance = totalDeposits - activePredictionStakes;

  console.log(`\n📊 Balance Report for User: ${userId}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Total Deposits:        $${totalDeposits.toFixed(2)}`);
  console.log(`Active Stakes Locked:  $${activePredictionStakes.toFixed(2)}`);
  console.log(`Current Balance:       $${balance.toFixed(2)}`);
  console.log(`\nActive Predictions: ${activePreds.length}`);
  activePreds.forEach(p => {
    console.log(`  - ${p.id}: $${p.stake_amount} (Created: ${new Date(p.created_at).toLocaleString()})`);
  });
}

// Get user ID from command line or use example
const userId = process.argv[2] || 'your-user-id-here';
checkBalance(userId);
