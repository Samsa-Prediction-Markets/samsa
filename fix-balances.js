const http = require('http');
const fs = require('fs');
const path = require('path');

function fixUserBalance(userId) {
  return new Promise((resolve, reject) => {
    const options = { method: 'POST' };
    const req = http.request(`http://localhost:3001/api/users/${userId}/fix-balance`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Scanning all users for negative buying power...\n');

  try {
    const usersPath = path.join(__dirname, 'data', 'users.json');
    if (!fs.existsSync(usersPath)) {
      console.log('No users.json found. Nothing to fix.');
      return;
    }

    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    let fixedCount = 0;

    for (const user of users) {
      try {
        const data = await fixUserBalance(user.id);
        if (data.cancelled_predictions > 0) {
          console.log(`✅ Repaired user ${user.id}: Cancelled ${data.cancelled_predictions} trades. New balance: $${data.balance_after.toFixed(2)}`);
          fixedCount++;
        }
      } catch (err) {
        console.error(`❌ Failed to check/fix ${user.id}: Is the local server running? (${err.message})`);
      }
    }

    console.log(`\nFinished scanning ${users.length} users. Repaired ${fixedCount} accounts.`);
  } catch (err) {
    console.error('Error running script:', err);
  }
}

run();