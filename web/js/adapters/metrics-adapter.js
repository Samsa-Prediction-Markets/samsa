function normalizeWithMetrics(market) {
  const m = market || {};
  const metrics = m.metrics || {};
  const core = metrics.core || {};
  const vol = core.volume || {};
  return {
    ...m,
    volume: vol.total || m.total_volume || 0,
    volume24h: vol.volume24h || 0,
    traders: m.traders || Math.round((vol.total || m.total_volume || 0) / 50) || 0,
    closeDate: m.closeDate || (m.close_date ? new Date(m.close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'),
    outcomes: (m.outcomes || []).map((o) => ({ ...o, stake: o.stake || o.total_stake || 0 })),
    trend: metrics.trend || null,
    sparkline: metrics.sparkline || null,
    catalyst: metrics.catalyst_summary || null
  };
}

window.metricsAdapter = {
  normalize: normalizeWithMetrics
};

