import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { formatCurrency, formatRelativeTime } from '../store/storage';
import MarketCard from '../components/MarketCard';

export default function PortfolioPage() {
  const { session } = useAuth();
  const userId = session?.user?.id || 'demo';
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPredictions()
      .then(data => setPredictions(Array.isArray(data) ? data : []))
      .catch(() => setPredictions([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const active = predictions.filter(p => p.status === 'active');
  const resolved = predictions.filter(p => p.status !== 'active');
  const totalStaked = active.reduce((s, p) => s + (p.stake_amount || 0), 0);
  const totalWon = resolved.filter(p => p.status === 'won').reduce((s, p) => s + (p.actual_return || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Portfolio</h1>
        <p className="page-subtitle">Your prediction positions</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Active Positions</div>
          <div className="stat-value">{active.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Staked</div>
          <div className="stat-value">{formatCurrency(totalStaked)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Won</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{formatCurrency(totalWon)}</div>
        </div>
      </div>

      {loading
        ? <div className="loading-center"><div className="spinner" /></div>
        : predictions.length === 0
          ? <div className="empty-state"><p>No predictions yet. Head to Explore to make your first prediction!</p></div>
          : (
            <>
              {active.length > 0 && (
                <>
                  <div className="section-title">Active Positions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    {active.map(p => <PredictionRow key={p.id} prediction={p} />)}
                  </div>
                </>
              )}
              {resolved.length > 0 && (
                <>
                  <div className="section-title">Past Predictions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {resolved.map(p => <PredictionRow key={p.id} prediction={p} />)}
                  </div>
                </>
              )}
            </>
          )
      }
    </div>
  );
}

function PredictionRow({ prediction: p }) {
  const statusColor = p.status === 'won' ? 'var(--green)' : p.status === 'lost' ? 'var(--red)' : 'var(--accent)';
  return (
    <div className="card" style={{ gap: 0, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Market ID: {p.market_id}</span>
        <span className="badge" style={{ background: `${statusColor}1a`, color: statusColor }}>{p.status}</span>
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>Outcome: <strong style={{ color: 'var(--text-primary)' }}>{p.outcome_id}</strong></span>
        <span>Staked: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(p.stake_amount || 0)}</strong></span>
        <span>Odds: {p.odds_at_prediction}%</span>
        {p.status !== 'active' && <span>Return: <strong style={{ color: statusColor }}>{formatCurrency(p.actual_return || 0)}</strong></span>}
        <span>{formatRelativeTime(p.created_at)}</span>
      </div>
    </div>
  );
}
