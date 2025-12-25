const { readJson } = require('./datastore');
const path = require('path');
const DATA_DIR = path.join(__dirname, '..', 'data');
const PREDICTIONS_PATH = path.join(DATA_DIR, 'predictions.json');
const SNAPSHOTS_DAILY_PATH = path.join(DATA_DIR, 'market_snapshots_daily.json');
const INTRADAY_CACHE_PATH = path.join(DATA_DIR, 'market_intraday_cache.json');
const INFO_EVENTS_PATH = path.join(DATA_DIR, 'info_events.json');

function clamp01(x) {
  if (isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function logNorm(x, cap) {
  const v = Math.log(1 + Math.max(0, x));
  const c = Math.log(1 + Math.max(1, cap));
  return clamp01(v / c);
}

async function getPredictionsSafe() {
  try {
    return await readJson(PREDICTIONS_PATH);
  } catch {
    return [];
  }
}

async function getSnapshotsDailySafe() {
  try {
    return await readJson(SNAPSHOTS_DAILY_PATH);
  } catch {
    return {};
  }
}

async function getIntradayCacheSafe() {
  try {
    return await readJson(INTRADAY_CACHE_PATH);
  } catch {
    return {};
  }
}

async function getInfoEventsSafe() {
  try {
    return await readJson(INFO_EVENTS_PATH);
  } catch {
    return [];
  }
}

function computeUserAccuracyMap(predictions) {
  const resolved = predictions.filter((p) => p.status === 'won' || p.status === 'lost');
  const byUser = new Map();
  for (const p of resolved) {
    const id = p.user_id || 'anon';
    const prev = byUser.get(id) || { total: 0, wins: 0 };
    byUser.set(id, { total: prev.total + 1, wins: prev.wins + (p.status === 'won' ? 1 : 0) });
  }
  const acc = new Map();
  for (const [id, v] of byUser.entries()) {
    const a = v.total > 0 ? v.wins / v.total : 0.5;
    acc.set(id, a);
  }
  return acc;
}

function getPrimaryOutcomeId(market) {
  const titles = (market.outcomes || []).map((o) => (o.title || '').trim().toLowerCase());
  const yesIdx = titles.indexOf('yes');
  if (market.outcomes && market.outcomes.length === 2 && yesIdx !== -1) {
    return market.outcomes[yesIdx].id;
  }
  let max = null;
  for (const o of market.outcomes || []) {
    const stake = Number(o.total_stake || 0);
    if (!max || stake > Number(max.total_stake || 0)) max = o;
  }
  return max ? max.id : (market.outcomes && market.outcomes[0] ? market.outcomes[0].id : null);
}

function getOutcomeById(market, outcomeId) {
  return (market.outcomes || []).find((o) => o.id === outcomeId) || null;
}

function computeImpliedProbability(market, primaryOutcomeId) {
  const primary = getOutcomeById(market, primaryOutcomeId);
  if (!primary) return 0.5;
  if (typeof primary.probability === 'number') {
    const p = primary.probability > 1 ? primary.probability / 100 : primary.probability;
    return clamp01(p);
  }
  const totalStake = (market.outcomes || []).reduce((sum, o) => sum + (o.total_stake || 0), 0);
  if (totalStake <= 0) return 0.5;
  const p = (primary.total_stake || 0) / totalStake;
  return clamp01(p);
}

function sumStakesLast24h(predictions, marketId) {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  let sum = 0;
  for (const p of predictions) {
    if (p.market_id !== marketId) continue;
    const t = new Date(p.created_at || 0).getTime();
    if (t >= since) sum += Number(p.stake_amount || 0);
  }
  return sum;
}

function sumStakesWeightedLast24h(predictions, marketId, userAcc) {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  let sum = 0;
  for (const p of predictions) {
    if (p.market_id !== marketId) continue;
    const t = new Date(p.created_at || 0).getTime();
    if (t < since) continue;
    const acc = userAcc.get(p.user_id || 'anon') ?? 0.5;
    const w = 0.5 + acc * 0.5;
    sum += Number(p.stake_amount || 0) * w;
  }
  return sum;
}

function getDailySnapshotProb(snapshotsDaily, marketId, primaryOutcomeId) {
  const snap = snapshotsDaily[marketId];
  if (!snap || !snap.outcomes) return null;
  const o = (snap.outcomes || []).find((x) => x.id === primaryOutcomeId);
  if (!o) return null;
  const p = o.probability > 1 ? o.probability / 100 : o.probability;
  return typeof p === 'number' ? clamp01(p) : null;
}

function buildSparkline(intradayCache, marketId, impliedProbability) {
  const cache = intradayCache[marketId] && intradayCache[marketId].sparkline;
  const now = Date.now();
  const res = '5m';
  if (Array.isArray(cache) && cache.length > 0) {
    return { points: cache, resolution: res };
  }
  const points = [];
  const count = 60;
  const step = 5 * 60 * 1000;
  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(now - i * step).toISOString();
    points.push({ t, p: impliedProbability });
  }
  return { points, resolution: res };
}

function sentimentLayers(infoEvents) {
  if (!Array.isArray(infoEvents) || infoEvents.length === 0) {
    return { expert: 0, institutional: 0, mass: 0, decision_grade: 'noise', uncertainty: 'high_disagreement' };
  }
  const avgConf = infoEvents.reduce((s, e) => s + (e.confidence || 0), 0) / infoEvents.length;
  const score = clamp01(avgConf);
  const decision = score > 0.6 ? 'signal' : score < 0.3 ? 'noise' : 'overreaction';
  const uncertainty = score < 0.4 ? 'high_disagreement' : score > 0.8 ? 'late_stage_optimism' : 'fragile_consensus';
  return { expert: score, institutional: score, mass: score, decision_grade: decision, uncertainty };
}

function catalystSummary(infoEvents) {
  if (!Array.isArray(infoEvents) || infoEvents.length === 0) return 'No catalyst detected';
  const top = infoEvents.slice(0, 2).map((e) => e.title || e.type).filter(Boolean);
  return top.join(' • ');
}

function computeTrendScore(delta24h, informedVol24h, infoImpact, sentimentConsensus, weights, caps) {
  const dNorm = clamp01(Math.abs(delta24h) / (caps.delta24h || 0.2));
  const vNorm = logNorm(informedVol24h, caps.volume24h || 1000);
  const eNorm = clamp01(infoImpact);
  const sNorm = clamp01(sentimentConsensus);
  const w = { d: weights.wDelta ?? 0.35, v: weights.wVol ?? 0.25, e: weights.wEvent ?? 0.25, s: weights.wSent ?? 0.15 };
  const score = 100 * (w.d * dNorm + w.v * vNorm + w.e * eNorm + w.s * sNorm);
  return Math.round(score);
}

async function computeMarketMetrics(market) {
  const predictions = await getPredictionsSafe();
  const snapshotsDaily = await getSnapshotsDailySafe();
  const intradayCache = await getIntradayCacheSafe();
  const infoEventsAll = await getInfoEventsSafe();
  const primaryOutcomeId = getPrimaryOutcomeId(market);
  const impliedProbability = computeImpliedProbability(market, primaryOutcomeId);
  const sparkline = buildSparkline(intradayCache, market.id, impliedProbability);
  const snapProb = getDailySnapshotProb(snapshotsDaily, market.id, primaryOutcomeId);
  const change24h = typeof snapProb === 'number' ? impliedProbability - snapProb : 0;
  const userAcc = computeUserAccuracyMap(predictions);
  const vol24h = sumStakesLast24h(predictions, market.id);
  const vol24hWeighted = sumStakesWeightedLast24h(predictions, market.id, userAcc);
  const infoEvents = infoEventsAll.filter((e) => Array.isArray(e.mapped_markets) && e.mapped_markets.includes(market.id));
  const sent = sentimentLayers(infoEvents);
  const infoImpact = clamp01(infoEvents.reduce((s, e) => s + (e.impact_estimate || 0), 0));
  const trendScore = computeTrendScore(change24h, vol24hWeighted, infoImpact, Math.abs(sent.expert + sent.institutional + sent.mass) / 3, { wDelta: 0.4, wVol: 0.25, wEvent: 0.25, wSent: 0.1 }, { delta24h: 0.2, volume24h: 2000 });
  const now = new Date().toISOString();
  const dailyAt = snapshotsDaily.__meta && snapshotsDaily.__meta.daily_at ? snapshotsDaily.__meta.daily_at : null;
  const intradayAt = intradayCache.__meta && intradayCache.__meta.cached_at ? intradayCache.__meta.cached_at : now;
  const price = Math.round(impliedProbability * 100);
  return {
    core: { price, implied_probability: impliedProbability, primary_outcome_id: primaryOutcomeId, volume: { total: market.total_volume || 0, volume24h: vol24h } },
    informed_volume: { volume24h_weighted: vol24hWeighted, weights_applied: { default: 'accuracy_0.5_to_1.0' } },
    trend: { score: trendScore, components: { delta24h_norm: clamp01(Math.abs(change24h) / 0.2), informed_volume24h_norm: logNorm(vol24hWeighted, 2000), info_event_impact_norm: infoImpact, sentiment_consensus_norm: clamp01(Math.abs(sent.expert + sent.institutional + sent.mass) / 3) }, change_24h: change24h, consensus_shift: change24h },
    sentiment: { expert: sent.expert * 2 - 1, institutional: sent.institutional * 2 - 1, mass: sent.mass * 2 - 1, decision_grade: sent.decision_grade, uncertainty: sent.uncertainty },
    info_events: infoEvents.map((e) => ({ type: e.type || 'event', title: e.title || '', source: e.source || '', t: e.t || now, confidence: e.confidence || 0, mapped_markets: e.mapped_markets || [], impact_estimate: e.impact_estimate || 0 })),
    catalyst_summary: catalystSummary(infoEvents),
    risk: { probability_curve_slope: 0, scenario_bands: { p10: Math.max(0, impliedProbability - 0.1), p50: impliedProbability, p90: Math.min(1, impliedProbability + 0.1) }, expected_value_delta: change24h },
    sparkline,
    snapshot: { daily_at: dailyAt, intraday_cached_at: intradayAt },
    source: { provider: 'none', fallback: 'lmsr' },
    errors: []
  };
}

module.exports = {
  computeMarketMetrics
};

