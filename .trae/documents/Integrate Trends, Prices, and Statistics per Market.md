## Intent

- Make trends function as market intelligence signals focusing on information discovery and consensus shifts rather than hype.
- Weight activity by informed behavior (user accuracy/reputation) and surface catalysts with confidence so users can follow, fade, or wait.
- Provide decision‑grade sentiment, uncertainty context, and risk views to reinforce informed probabilistic decisions.

## Canonical Metrics Contract (v2)

- `metrics.core`:
  - `price`, `implied_probability`, `primary_outcome_id`.
  - `volume.total`, `volume.volume24h`.
- `metrics.informed_volume`:
  - `volume24h_weighted`: 24h volume weighted by user reputation/accuracy.
  - `weights_applied`: snapshot of global/user weight parameters.
- `metrics.trend`:
  - `score`: [0–100] composed from normalized components.
  - `components`: `{ delta24h_norm, informed_volume24h_norm, info_event_impact_norm, sentiment_consensus_norm }`.
  - `change_24h`: signed probability change.
  - `consensus_shift`: magnitude of shift vs daily snapshot.
- `metrics.sentiment`:
  - `expert`, `institutional`, `mass`: scores [-1, 1] each.
  - `decision_grade`: enum `{ signal, noise, overreaction }` with rationale.
  - `uncertainty`: enum `{ high_disagreement, fragile_consensus, late_stage_optimism }`.
- `metrics.info_events`:
  - Array of `{ type, title, source, t, confidence, mapped_markets, impact_estimate }`.
  - `catalyst_summary`: short text explaining “why it’s moving”.
- `metrics.risk`:
  - `probability_curve_slope`: local slope/convexity from LMSR.
  - `scenario_bands`: `{ p10, p50, p90 }` implied probability bands from simulation.
  - `expected_value_delta`: short‑horizon EV change estimate.
- `metrics.sparkline`:
  - Points of implied probability for primary outcome; fixed resolution and length.
  - `resolution`: `'5m' | '1h' | '24h'`.
- `metrics.snapshot`:
  - `daily_at`: ISO timestamp of canonical daily snapshot.
  - `intraday_cached_at`: ISO timestamp of last recompute.
- `metrics.source`:
  - `{ provider: 'rapidapi|newsapi|none', fallback: 'lmsr|none' }`.
- `metrics.errors`:
  - Provider/processing errors (summaries) for observability.

## Trend Score Composition (Normalized, Signal‑Weighted)

- Components:
  - `delta24h_norm`: cap and normalize probability movement.
  - `informed_volume24h_norm`: log‑scaled volume weighted by user reputation.
  - `info_event_impact_norm`: normalized confidence×impact of AI‑detected catalysts.
  - `sentiment_consensus_norm`: strength of non‑noise alignment across sentiment layers.
- Score:
  - `score = 100 * (wΔ*Δ + wV*V + wE*E + wS*S)` with configurable weights; defaults emphasize information events and informed volume.
- Direction and labeling:
  - Use sign of `delta24h` and `consensus_shift` to label move type (breakout, unwind, fade).

## External Pricing Provider Layer

- `providers/pricing/index.js` with pluggable providers:
  - `rapidapi` for external assets when `RAPIDAPI_KEY` present.
  - `none` provider returns null.
- Fallback:
  - LMSR engine (`js/core/lmsr-engine.js`) for implied probabilities and curves.
- Interfaces:
  - `getPrice(market)` → `{ price, implied_probability, source }`.
  - `getSeries(market, resolution)` → sparkline points.

## Information Event Detection

- Ingest pipeline:
  - `server.js` integrates NewsAPI and optional RapidAPI sources for domain data (earnings, injuries, weather).
  - Map items to markets via keywords/tickers/categories.
- Event scoring:
  - Confidence from source reliability and corroboration.
  - Impact estimate from historical sensitivity and LMSR slope at current probability.
- Storage:
  - Cache recent events in memory and persist summaries to `data/info_events.json` for reuse.

## Sentiment Segmentation (Decision‑Grade)

- Sources:
  - Expert: curated analysts, verified domain experts.
  - Institutional: reputable outlets, official releases.
  - Mass: social chatter, general headlines.
- Processing:
  - Distinguish signal vs noise; flag overreactions via deviation from expert/institutional baselines.
  - Produce `decision_grade` and `uncertainty` labels.

## Risk and Learning Signals

- Risk:
  - Compute local `probability_curve_slope` and scenario bands using LMSR and recent volatility proxies.
  - Provide a simple risk widget in details page.
- Learning & reputation:
  - Maintain per‑user accuracy (from `data/predictions.json`) over rolling windows.
  - Reputation weights applied to volume for `informed_volume24h`.
  - Expose a `learning_score` per user (server‑side) to support rewards later.

## Snapshot Strategy

- Daily canonical snapshot persisted in `data/market_snapshots_daily.json`.
- Intraday cache persisted in `data/market_intraday_cache.json` with 60s TTL.
- Deltas computed against the daily snapshot; avoid mixing bases.

## Backend Endpoints (server.js)

- `GET /api/markets`: markets with `metrics` v2.
- `GET /api/markets/:id`: single market with `metrics` v2.
- `GET /api/markets/trending`: markets sorted by `metrics.trend.score` and including `catalyst_summary`.
- `GET /api/markets/:id/stats`: deep `metrics` plus sparkline and risk.
- Internal helpers:
  - `computeMarketMetrics(market)`.
  - `getPrimaryOutcome(market)`.
  - `getSentimentLayers(market)`.
  - `detectInfoEvents(market)`.
  - `computeInformedVolume(market, last24h)`.

## Legacy JS Adapter Layer

- `js/adapters/metrics-adapter.js`: map canonical metrics to legacy UI expectations, e.g., trend arrows, short sparkline array, catalyst text.
- Replace direct shape assumptions in `js/features/markets/markets-view.js` with adapter functions.

## Caching and Observability

- Caching: LRU for provider calls; persist intraday cache to file.
- Observability:
  - Counters: cache hits/misses, recompute time, provider errors, info events detected.
  - Endpoint `/api/health/metrics-trends` returns current counters.
  - Structured logs for overreaction flags and uncertainty labels.

## Data and Storage

- Continue using `data/markets.json`, `data/transactions.json`.
- New: `data/market_snapshots_daily.json`, `data/market_intraday_cache.json`, `data/info_events.json`.
- `Entities/Market.json`: metrics treated as computed overlay, not persisted.

## Frontend Integration

- React:
  - `Pages/Markets.js` and `Components/markets/MarketCard.js` consume `metrics` (price, trend score, sparkline, catalyst).
  - `Pages/MarketDetails.js` and `Components/market-details/StatsPanel.js` show decision‑grade sentiment, uncertainty, risk bands, and catalyst timeline.
- Legacy:
  - Adapter feeds trending slideshow and suggestions with standardized fields.

## Testing and Validation

- Unit tests for normalization, sentiment segmentation, info event mapping, and informed volume weighting.
- Contract tests to assert `metrics` schema across endpoints.
- Behavioral tests verifying overreaction flags and consensus shift labels.
- Load/resilience tests for provider rate limits and cache effectiveness.

## Rollout and Flags

- Flags: `ENABLE_CANONICAL_METRICS_V2`, `ENABLE_EXTERNAL_PRICING`, `ENABLE_INFO_EVENTS`, `ENABLE_METRICS_OBSERVABILITY`.
- Roll out LMSR‑only first, then enable info events and external pricing per category.

## Acceptance Criteria

- All endpoints return `metrics` v2; frontend renders catalysts, trend score, sparkline, and decision‑grade sentiment.
- Trend ranking uses normalized informed signals; hype does not dominate.
- Overreaction scenarios flagged; uncertainty labels visible and consistent.
- External pricing isolated behind provider with LMSR fallback; failures degrade gracefully.
- Observability exposes cache, recompute, and error diagnostics; legacy JS remains stable via adapter.