const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { computeMarketMetrics } = require('../lib/metrics');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PREDICTIONS_PATH = path.join(DATA_DIR, 'predictions.json');
const SNAPSHOTS_DAILY_PATH = path.join(DATA_DIR, 'market_snapshots_daily.json');
const INTRADAY_CACHE_PATH = path.join(DATA_DIR, 'market_intraday_cache.json');
const INFO_EVENTS_PATH = path.join(DATA_DIR, 'info_events.json');

test('computeMarketMetrics returns canonical metrics', async () => {
  const marketId = 'mkt_test_1';
  const now = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const predictions = [
    { id: 'p1', market_id: marketId, outcome_id: 'yes', stake_amount: 100, odds_at_prediction: 60, status: 'won', user_id: 'u1', created_at: yesterday.toISOString() },
    { id: 'p2', market_id: marketId, outcome_id: 'no', stake_amount: 50, odds_at_prediction: 40, status: 'active', user_id: 'u2', created_at: now.toISOString() }
  ];
  fs.writeFileSync(PREDICTIONS_PATH, JSON.stringify(predictions, null, 2));
  const snapshots = {
    __meta: { daily_at: now.toISOString() },
    [marketId]: { outcomes: [{ id: 'yes', probability: 55 }, { id: 'no', probability: 45 }] }
  };
  fs.writeFileSync(SNAPSHOTS_DAILY_PATH, JSON.stringify(snapshots, null, 2));
  const intraday = { __meta: { cached_at: now.toISOString() }, [marketId]: { sparkline: [{ t: now.toISOString(), p: 0.6 }] } };
  fs.writeFileSync(INTRADAY_CACHE_PATH, JSON.stringify(intraday, null, 2));
  const infoEvents = [{ type: 'news', title: 'Earnings beat', source: 'provider', t: now.toISOString(), confidence: 0.8, mapped_markets: [marketId], impact_estimate: 0.6 }];
  fs.writeFileSync(INFO_EVENTS_PATH, JSON.stringify(infoEvents, null, 2));
  const market = {
    id: marketId,
    title: 'Will test event occur?',
    description: 'desc',
    category: 'finance',
    status: 'active',
    outcomes: [
      { id: 'yes', title: 'Yes', probability: 60, total_stake: 200 },
      { id: 'no', title: 'No', probability: 40, total_stake: 150 }
    ],
    total_volume: 350
  };
  const metrics = await computeMarketMetrics(market);
  assert.ok(metrics);
  assert.ok(typeof metrics.trend.score === 'number');
  assert.ok(metrics.trend.score >= 0 && metrics.trend.score <= 100);
  assert.equal(metrics.sparkline.resolution, '5m');
  assert.ok(typeof metrics.trend.change_24h === 'number');
  assert.equal(metrics.core.primary_outcome_id, 'yes');
  assert.ok(metrics.core.implied_probability > 0 && metrics.core.implied_probability <= 1);
}); 
