// ============================================================================
// MARKET DETAILS PAGE
// ============================================================================
// Detailed view of a single prediction market with outcomes, news, and stats

/**
 * Market Details Page Component
 * Shows comprehensive information about a specific market including:
 * - Market description and metadata
 * - Available outcomes with current probabilities
 * - Prediction form for placing bets
 * - Related news and statistics
 */
export default function MarketDetailsPage() {
  const navigate = useNavigate();  // Navigation function
  const queryClient = useQueryClient();  // React Query client for cache invalidation
  const urlParams = new URLSearchParams(window.location.search);
  const marketId = urlParams.get('id');  // Get market ID from URL query params

  // State management
  const [selectedOutcome, setSelectedOutcome] = useState(null);  // Currently selected outcome for prediction
  const [user, setUser] = useState(null);  // Authenticated user data

  // Fetch current user on component mount
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  // Fetch market data
  const { data: market, isLoading } = useQuery({
    queryKey: ['market', marketId],
    queryFn: async () => {
      const markets = await base44.entities.Market.filter({ id: marketId });
      return markets[0];
    },
    enabled: !!marketId,  // Only fetch if marketId exists
  });

  // Fetch user's predictions for this market
  const { data: userPredictions = [] } = useQuery({
    queryKey: ['predictions', marketId, user?.email],
    queryFn: () => base44.entities.Prediction.filter({
      market_id: marketId,
      created_by: user?.email
    }),
    enabled: !!marketId && !!user?.email,  // Only fetch if both exist
  });

  /**
   * Mutation for creating a new prediction
   * Updates market outcomes and recalculates probabilities after prediction is placed
   */
  const createPredictionMutation = useMutation({
    mutationFn: async (predictionData) => {
      // Create the prediction
      const prediction = await base44.entities.Prediction.create(predictionData);

      // Update the stake amount for the selected outcome
      const updatedOutcomes = market.outcomes.map(outcome => {
        if (outcome.id === predictionData.outcome_id) {
          return {
            ...outcome,
            total_stake: (outcome.total_stake || 0) + predictionData.stake_amount
          };
        }
        return outcome;
      });

      // Recalculate probabilities based on new stakes
      const totalStake = updatedOutcomes.reduce((sum, o) => sum + (o.total_stake || 0), 0);
      const finalOutcomes = updatedOutcomes.map(outcome => ({
        ...outcome,
        probability: totalStake > 0 ? Math.round((outcome.total_stake / totalStake) * 100) : outcome.probability
      }));

      // Update market with new outcomes and total volume
      await base44.entities.Market.update(marketId, {
        outcomes: finalOutcomes,
        total_volume: (market.total_volume || 0) + predictionData.stake_amount
      });

      return prediction;
    },
    onSuccess: () => {
      // Refresh market and predictions data after successful prediction
      queryClient.invalidateQueries({ queryKey: ['market', marketId] });
      queryClient.invalidateQueries({ queryKey: ['predictions', marketId] });
      setSelectedOutcome(null);  // Clear selected outcome
    },
  });

  if (isLoading || !market) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-white">Loading market...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Markets"))}
          className="mb-6 text-slate-300 hover:text-white hover:bg-slate-800/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Markets
        </Button>

        {/* Market Header */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 mb-8">
          {market.image_url && (
            <div className="mb-6 rounded-2xl overflow-hidden">
              <img
                src={market.image_url}
                alt={market.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          <h1 className="text-4xl font-bold text-yellow-400 mb-4">{market.title}</h1>
          <p className="text-lg text-slate-300 mb-6">{market.description}</p>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-5 h-5 text-amber-400" />
              <span className="font-medium">
                Closes: {market.close_date ? format(new Date(market.close_date), "MMM d, yyyy 'at' h:mm a") : "TBD"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="font-medium">
                ${market.total_volume?.toLocaleString() || 0} Total Volume
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="font-medium capitalize">{market.category}</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Outcomes & Prediction */}
          <div className="lg:col-span-2 space-y-8">
            <OutcomesList
              outcomes={market.outcomes}
              onSelectOutcome={setSelectedOutcome}
              userPredictions={userPredictions}
            />

            {selectedOutcome && (
              <PredictionForm
                market={market}
                outcome={selectedOutcome}
                onSubmit={createPredictionMutation.mutate}
                onCancel={() => setSelectedOutcome(null)}
                isProcessing={createPredictionMutation.isPending}
              />
            )}
          </div>

          {/* Right Column - News & Stats */}
          <div className="space-y-8">
            <Tabs defaultValue="news" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 border border-slate-800">
                <TabsTrigger value="news" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-slate-950">
                  <Newspaper className="w-4 h-4 mr-2" />
                  News
                </TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-slate-950">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Stats
                </TabsTrigger>
              </TabsList>
              <TabsContent value="news">
                <NewsSection searchQuery={market.search_keywords || market.title} />
              </TabsContent>
              <TabsContent value="stats">
                <StatsPanel market={market} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
