// ============================================================================
// JSON TO DATABASE MIGRATION SCRIPT
// ============================================================================
// Migrates existing JSON data to PostgreSQL database

require('dotenv').config();
const { readJson } = require('../lib/datastore');
const { 
  Market, 
  Outcome, 
  Prediction, 
  User, 
  Transaction,
  initializeDatabase,
  sequelize 
} = require('../lib/database/models');

async function migrateData() {
  console.log('🚀 Starting migration from JSON to PostgreSQL...\n');

  try {
    // Step 1: Initialize database (create tables)
    console.log('📋 Step 1: Creating database tables...');
    await initializeDatabase(false); // Don't force drop
    console.log('✅ Tables created\n');

    // Step 2: Migrate Users
    console.log('👥 Step 2: Migrating users...');
    try {
      const usersData = await readJson('./data/users.json');
      for (const userData of usersData) {
        await User.findOrCreate({
          where: { id: userData.id },
          defaults: {
            username: userData.username,
            email: userData.email
          }
        });
      }
      console.log(`✅ Migrated ${usersData.length} users\n`);
    } catch (err) {
      console.log('⚠️  No users.json found or empty, skipping...\n');
    }

    // Step 3: Migrate Markets and Outcomes
    console.log('📊 Step 3: Migrating markets and outcomes...');
    const marketsData = await readJson('./data/markets.json');
    
    for (const marketData of marketsData) {
      // Create market
      const [market, created] = await Market.findOrCreate({
        where: { id: marketData.id },
        defaults: {
          title: marketData.title,
          description: marketData.description,
          category: marketData.category,
          status: marketData.status || 'active',
          close_date: marketData.close_date,
          resolution_date: marketData.resolution_date,
          total_volume: marketData.total_volume || 0,
          image_url: marketData.image_url,
          winning_outcome_id: marketData.winning_outcome_id,
          search_keywords: marketData.search_keywords
        }
      });
      
      if (created) {
        console.log(`  ✓ Created market: ${market.title}`);
      } else {
        console.log(`  ↻ Market already exists: ${market.title}`);
      }
      
      // Create outcomes for this market (always check, even if market exists)
      if (marketData.outcomes && Array.isArray(marketData.outcomes)) {
        let outcomeCreatedCount = 0;
        for (const outcomeData of marketData.outcomes) {
          // Generate unique outcome ID by combining market_id and outcome_id
          const uniqueOutcomeId = `${market.id}_${outcomeData.id}`;
          
          // Check if outcome already exists
          const existingOutcome = await Outcome.findOne({
            where: { id: uniqueOutcomeId }
          });
          
          if (!existingOutcome) {
            // Create new outcome with unique ID
            await Outcome.create({
              id: uniqueOutcomeId,
              market_id: market.id,
              title: outcomeData.title,
              probability: outcomeData.probability || 0,
              total_stake: outcomeData.total_stake || 0
            });
            outcomeCreatedCount++;
          }
        }
        if (outcomeCreatedCount > 0) {
          console.log(`    ✓ Added ${outcomeCreatedCount} outcomes to ${market.title}`);
        }
      }
    }
    console.log(`✅ Migrated ${marketsData.length} markets\n`);

    // Step 4: Migrate Predictions
    console.log('💰 Step 4: Migrating predictions...');
    try {
      const predictionsData = await readJson('./data/predictions.json');
      for (const predictionData of predictionsData) {
        await Prediction.findOrCreate({
          where: { id: predictionData.id },
          defaults: {
            market_id: predictionData.market_id,
            outcome_id: predictionData.outcome_id,
            user_id: predictionData.user_id || 'user_default',
            stake_amount: predictionData.stake_amount,
            odds_at_prediction: predictionData.odds_at_prediction,
            potential_return: predictionData.potential_return,
            actual_return: predictionData.actual_return || 0,
            status: predictionData.status || 'active',
            resolved_at: predictionData.resolved_at
          }
        });
      }
      console.log(`✅ Migrated ${predictionsData.length} predictions\n`);
    } catch (err) {
      console.log('⚠️  No predictions.json found or empty, skipping...\n');
    }

    // Step 5: Migrate Transactions
    console.log('💳 Step 5: Migrating transactions...');
    try {
      const transactionsData = await readJson('./data/transactions.json');
      for (const transactionData of transactionsData) {
        await Transaction.findOrCreate({
          where: { id: transactionData.id },
          defaults: {
            user_id: transactionData.user_id,
            type: transactionData.type,
            amount: transactionData.amount,
            payment_method: transactionData.payment_method,
            status: transactionData.status || 'completed',
            completed_at: transactionData.completed_at || transactionData.created_at
          }
        });
      }
      console.log(`✅ Migrated ${transactionsData.length} transactions\n`);
    } catch (err) {
      console.log('⚠️  No transactions.json found or empty, skipping...\n');
    }

    // Step 6: Verify migration
    console.log('🔍 Step 6: Verifying migration...');
    const marketCount = await Market.count();
    const outcomeCount = await Outcome.count();
    const predictionCount = await Prediction.count();
    const userCount = await User.count();
    const transactionCount = await Transaction.count();
    
    console.log('\n📊 Migration Summary:');
    console.log(`   Markets:      ${marketCount}`);
    console.log(`   Outcomes:     ${outcomeCount}`);
    console.log(`   Predictions:  ${predictionCount}`);
    console.log(`   Users:        ${userCount}`);
    console.log(`   Transactions: ${transactionCount}`);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('💡 You can now update server.js to use the database instead of JSON files\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };

