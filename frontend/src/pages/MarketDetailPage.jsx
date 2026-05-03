import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMarket } from '../hooks/useMarkets';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { CATEGORY_COLORS, formatCurrency, formatDate } from '../store/storage';

export default function MarketDetailPage() {
  const { id } = useParams();
  const { market, loading, error } = useMarket(id);
  const { session } = useAuth();
  const navigate = useNavigate();
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [stake, setStake] = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeMsg, setTradeMsg] = useState('');

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error || !market) return <div className="empty-state"><p>Market not found.</p></div>;

  const accentColor = CATEGORY_COLORS[market.category] || '#6366f1';
  const outcomes = market.outcomes || [];
  const yesOutcome = outcomes.find(o => o.title?.toLowerCase() === 'yes') || outcomes[0];

  const handleTrade = async (e) => {
    e.preventDefault();
    if (!session) { navigate('/auth'); return; }
    if (!selectedOutcome || !stake) return;
    setTradeLoading(true); setTradeMsg('');
    try {
      await api.createPrediction({
        market_id: market.id,
        outcome_id: selectedOutcome.id,
        stake_amount: parseFloat(stake),
        odds_at_prediction: selectedOutcome.probability || 50,
        user_id: session.user.id,
      });
      setTradeMsg('✅ Prediction placed successfully!');
      setStake('');
    } catch (err) {
      setTradeMsg(`❌ ${err.message}`);
    } finally {
      setTradeLoading(false);
    }
  };

  const potential = selectedOutcome && stake
    ? (parseFloat(stake) * (100 / Math.max(selectedOutcome.probability || 50, 1))).toFixed(2)
    : null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="detail-hero">
        <span className="market-card-category" style={{ background: `${accentColor}1a`, color: accentColor, marginBottom: 12, display: 'inline-block' }}>
          {market.category}
        </span>
        <h1 className="detail-title">{market.title}</h1>
        {market.description && <p className="detail-desc">{market.description}</p>}
        <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>Volume: {formatCurrency(market.total_volume || 0)}</span>
          {market.close_date && <span>Closes: {formatDate(market.close_date)}</span>}
          <span className={`badge ${market.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{market.status}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Outcomes */}
        <div>
          <div className="section-title">Outcomes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {outcomes.map(o => {
              const isYes = o.title?.toLowerCase() === 'yes';
              const isNo  = o.title?.toLowerCase() === 'no';
              const color = isYes ? 'var(--green)' : isNo ? 'var(--red)' : accentColor;
              return (
                <div
                  key={o.id}
                  className="card"
                  style={{ cursor: market.status === 'active' ? 'pointer' : 'default', border: selectedOutcome?.id === o.id ? `1px solid ${color}` : undefined }}
                  onClick={() => market.status === 'active' && setSelectedOutcome(o)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{o.title}</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color }}>{o.probability ?? 50}%</span>
                  </div>
                  <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'var(--bg-hover)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${o.probability ?? 50}%`, background: color, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trade form */}
        {market.status === 'active' && (
          <div className="trade-form">
            <div className="section-title">Place Prediction</div>
            {!selectedOutcome ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Select an outcome above to trade.</p>
            ) : (
              <form onSubmit={handleTrade} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', background: 'var(--bg-hover)', fontSize: 13 }}>
                  Betting on: <strong>{selectedOutcome.title}</strong> ({selectedOutcome.probability ?? 50}%)
                </div>
                <div className="form-group">
                  <label className="form-label">Stake Amount ($)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    step="0.01"
                    value={stake}
                    onChange={e => setStake(e.target.value)}
                    placeholder="10.00"
                    required
                  />
                </div>
                {potential && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Potential return: <strong style={{ color: 'var(--green)' }}>${potential}</strong>
                  </div>
                )}
                {tradeMsg && <p style={{ fontSize: 12, color: tradeMsg.startsWith('✅') ? 'var(--green)' : 'var(--red)' }}>{tradeMsg}</p>}
                <button className="btn btn-primary btn-full" type="submit" disabled={tradeLoading}>
                  {tradeLoading ? 'Placing…' : 'Place Prediction'}
                </button>
                {!session && <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>You'll be asked to log in.</p>}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
