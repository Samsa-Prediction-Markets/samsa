// ============================================================================
// MARKET CARD COMPONENT
// ============================================================================
// Displays a single market in a card format with outcomes and metadata

// Color schemes for different market categories
const categoryColors = {
  politics: "from-blue-500 to-indigo-600",
  sports: "from-green-500 to-emerald-600",
  finance: "from-amber-500 to-orange-600",
  technology: "from-purple-500 to-pink-600",
  entertainment: "from-pink-500 to-rose-600",
  crypto: "from-orange-500 to-red-600",
  other: "from-slate-500 to-slate-600"
};

/**
 * Market Card Component
 * Displays a market preview with top 2 outcomes, category badge, and key stats
 * @param {Object} props - Component props
 * @param {Object} props.market - The market object to display
 */
export default function MarketCard({ market }) {
  // Get top 2 outcomes sorted by probability (highest first)
  const topTwoOutcomes = market.outcomes
    ? [...market.outcomes]
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 2)
    : [];

  // Calculate days remaining until market closes
  const daysUntilClose = market.close_date
    ? differenceInDays(new Date(market.close_date), new Date())
    : null;

  return (
    <Card className="group relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/10 cursor-pointer">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-600/0 group-hover:from-yellow-500/5 group-hover:to-yellow-600/5 transition-all duration-300" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <Badge className={`bg-gradient-to-r ${categoryColors[market.category]} text-white border-0 px-3 py-1`}>
            {market.category}
          </Badge>
          {daysUntilClose !== null && daysUntilClose <= 7 && (
            <Badge variant="outline" className="border-orange-500/50 text-orange-400 bg-orange-500/10">
              <Clock className="w-3 h-3 mr-1" />
              {daysUntilClose}d left
            </Badge>
          )}
        </div>

        {/* Image */}
        {market.image_url && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <img
              src={market.image_url}
              alt={market.title}
              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors duration-200">
          {market.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-400 mb-3">
          {market.description}
        </p>

        {/* Top 2 Outcomes as Buttons */}
        {topTwoOutcomes.length > 0 && (
          <div>
            <div className="flex gap-2">
              {topTwoOutcomes.map((outcome, index) => (
                <button
                  key={outcome.id}
                  className={`flex-1 relative overflow-hidden rounded-lg px-3 py-2 transition-all duration-200 border ${index === 0
                    ? 'bg-green-500/10 border-green-500/50 hover:border-green-500 hover:bg-green-500/20'
                    : 'bg-red-500/10 border-red-500/50 hover:border-red-500 hover:bg-red-500/20'
                    } active:scale-95`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle outcome selection here
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-white font-medium text-xs text-center">
                      {outcome.title}
                    </span>
                    <span className={`text-lg font-bold text-center ${index === 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(outcome.probability / 100).toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
