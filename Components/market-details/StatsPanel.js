// ============================================================================
// STATS PANEL COMPONENT
// ============================================================================
// Displays AI-generated statistics and insights about a market

/**
 * Stats Panel Component
 * Uses LLM to fetch and display relevant statistics and insights
 * that can help users make informed predictions
 * @param {Object} props - Component props
 * @param {Object} props.market - The market object to analyze
 */
export default function StatsPanel({ market }) {
  const [stats, setStats] = useState(null);  // Stores fetched statistics
  const [loading, setLoading] = useState(false);  // Loading state

  /**
   * Fetch statistics using LLM with internet context
   * Runs when market changes
   */
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Use LLM to generate relevant statistics and insights
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Provide key statistics and insights about: ${market.search_keywords || market.title}.
          Include relevant numbers, trends, historical data, and expert opinions that would help predict the outcome.`,
          add_context_from_internet: true,  // Enable web search for current data
          response_json_schema: {
            type: "object",
            properties: {
              key_statistics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string" },
                    value: { type: "string" },
                    trend: { type: "string" }
                  }
                }
              },
              insights: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        });
        setStats(result);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
      setLoading(false);
    };

    if (market) {
      fetchStats();
    }
  }, [market]);

  if (loading) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-bold text-yellow-400">Market Statistics</h3>
      </div>

      {stats?.key_statistics && stats.key_statistics.length > 0 && (
        <div className="space-y-4 mb-6">
          {stats.key_statistics.map((stat, index) => (
            <div
              key={index}
              className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-sm text-slate-400">{stat.label}</span>
                {stat.trend && (
                  <TrendingUp className={`w-4 h-4 ${stat.trend.toLowerCase().includes('up') || stat.trend.toLowerCase().includes('positive')
                    ? 'text-green-400'
                    : stat.trend.toLowerCase().includes('down') || stat.trend.toLowerCase().includes('negative')
                      ? 'text-red-400'
                      : 'text-yellow-400'
                    }`} />
                )}
              </div>
              <p className="text-xl font-bold text-yellow-400">{stat.value}</p>
              {stat.trend && (
                <p className="text-xs text-slate-500 mt-1">{stat.trend}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {stats?.insights && stats.insights.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Key Insights</h4>
          <div className="space-y-2">
            {stats.insights.map((insight, index) => (
              <div
                key={index}
                className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50"
              >
                <p className="text-sm text-slate-300">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!stats || ((!stats.key_statistics || stats.key_statistics.length === 0) && (!stats.insights || stats.insights.length === 0))) && (
        <p className="text-slate-400 text-center py-8">No statistics available</p>
      )}
    </Card>
  );
}
