import { useNavigate } from 'react-router-dom';

const CATEGORY_COLORS = {
  sports: 'from-blue-500 to-blue-600',
  entertainment: 'from-purple-500 to-purple-600',
  politics: 'from-red-500 to-red-600',
  finance: 'from-green-500 to-green-600',
  technology: 'from-cyan-500 to-cyan-600',
  science: 'from-indigo-500 to-indigo-600',
};

export default function MarketCard({ market }) {
  const navigate = useNavigate();
  if (!market) return null;

  const outcomes = market.outcomes || [];
  const isBinary = outcomes.length === 2 &&
    outcomes.some(o => o.title?.toLowerCase() === 'yes') &&
    outcomes.some(o => o.title?.toLowerCase() === 'no');

  return (
    <div
      className="group relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/10 cursor-pointer rounded-2xl market-card"
      onClick={() => navigate(`/markets/${market.id}`)}
      style={{ breakInside: 'avoid', marginBottom: '1.5rem' }}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-600/0 group-hover:from-yellow-500/5 group-hover:to-yellow-600/5 transition-all duration-300" />

      <div className="relative p-4 flex flex-col gap-2 z-10">
        {/* Header with category and live badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${CATEGORY_COLORS[market.category] || 'from-slate-500 to-slate-600'} text-white`}>
              {market.category}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${isBinary ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-blue-500/30 bg-blue-500/10 text-blue-400'}`}>
              <span>{isBinary ? '⚡' : '📊'}</span>
              <span>{isBinary ? 'Binary' : 'Multi'}</span>
            </span>
          </div>
          <span className="text-xs text-green-400 font-medium">🟢 Live</span>
        </div>

        {/* Mini chart visualization */}
        <div className="h-12 flex items-end gap-0.5 mb-1">
          {outcomes.slice(0, 5).map((outcome, idx) => (
            <div
              key={outcome.id}
              className="flex-1 bg-gradient-to-t from-yellow-500/40 to-yellow-500/20 rounded-t transition-all duration-300 group-hover:from-yellow-500/60 group-hover:to-yellow-500/40"
              style={{ height: `${(outcome.probability || 0)}%` }}
              title={`${outcome.title}: ${outcome.probability}%`}
            />
          ))}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors duration-200">
          {market.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-400 line-clamp-2">{market.description}</p>

        {/* Outcome buttons */}
        <div className="flex gap-2">
          {outcomes.slice(0, 3).map((outcome) => (
            <button
              key={outcome.id}
              className="flex-1 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg transition-all text-xs font-medium text-slate-300 hover:text-white hover:border-yellow-500/50"
              onClick={(e) => { e.stopPropagation(); }}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="truncate w-full text-center">{outcome.title}</span>
                <span className="text-yellow-400 font-bold">{outcome.probability}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
