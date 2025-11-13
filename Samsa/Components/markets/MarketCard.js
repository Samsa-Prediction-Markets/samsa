const categoryColors = {
  politics: "from-blue-500 to-indigo-600",
  sports: "from-green-500 to-emerald-600",
  finance: "from-amber-500 to-orange-600",
  technology: "from-purple-500 to-pink-600",
  entertainment: "from-pink-500 to-rose-600",
  crypto: "from-orange-500 to-red-600",
  other: "from-slate-500 to-slate-600"
};

export default function MarketCard({ market }) {
  const topOutcome = market.outcomes?.reduce((prev, current) =>
    (current.probability > prev.probability) ? current : prev
    , market.outcomes[0]);

  const daysUntilClose = market.close_date
    ? differenceInDays(new Date(market.close_date), new Date())
    : null;

  return (
    <Card className="group relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/10 cursor-pointer h-full">
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
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors duration-200">
          {market.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
          {market.description}
        </p>

        {/* Leading Outcome */}
        {topOutcome && (
          <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Leading prediction</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-white font-semibold mb-1">{topOutcome.title}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${topOutcome.probability}%` }}
                />
              </div>
              <span className="text-yellow-400 font-bold text-sm">{topOutcome.probability}%</span>
            </div>
          </div>
        )}

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-slate-400">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">
              ${market.total_volume?.toLocaleString() || 0} vol
            </span>
          </div>
          {market.close_date && (
            <span className="text-xs text-slate-500">
              Closes {format(new Date(market.close_date), "MMM d")}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
