// ============================================================================
// PORTFOLIO PAGE
// ============================================================================
// User's personal portfolio showing all predictions and performance statistics

/**
 * Portfolio Page Component
 * Displays user's predictions categorized by status (active, won, lost)
 * Shows performance metrics including total staked, win rate, and profit/loss
 */
export default function PortfolioPage() {
  const [user, setUser] = useState(null);  // Store authenticated user data

  /**
   * Find the market associated with a prediction
   * @param {Object} prediction - The prediction object
   * @returns {Object|undefined} The market object
   */
  const getMarketForPrediction = (prediction) => {
    return markets.find(m => m.id === prediction.market_id);
  };

  /**
   * Get the title of the outcome for a prediction
   * @param {Object} prediction - The prediction object
   * @returns {string} The outcome title or "Unknown"
   */
  const getOutcomeTitle = (prediction) => {
    const market = getMarketForPrediction(prediction);
    const outcome = market?.outcomes?.find(o => o.id === prediction.outcome_id);
    return outcome?.title || "Unknown";
  };

  // Filter predictions by status
  const activePredictions = predictions.filter(p => p.status === "active");
  const wonPredictions = predictions.filter(p => p.status === "won");
  const lostPredictions = predictions.filter(p => p.status === "lost");

  // Calculate portfolio statistics
  const totalStaked = predictions.reduce((sum, p) => sum + (p.stake_amount || 0), 0);
  const totalReturned = predictions.reduce((sum, p) => sum + (p.actual_return || 0), 0);
  const potentialReturn = activePredictions.reduce((sum, p) => sum + (p.potential_return || 0), 0);
  const netProfit = totalReturned - predictions.filter(p => p.status !== "active").reduce((sum, p) => sum + (p.stake_amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Wallet className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-yellow-400 tracking-tight">Your Portfolio</h1>
              <p className="text-slate-400 mt-1">Track your predictions and performance</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm font-medium">Total Staked</span>
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-yellow-400">${totalStaked.toFixed(2)}</p>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm font-medium">Active Predictions</span>
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-yellow-400">{activePredictions.length}</p>
              <p className="text-xs text-slate-500 mt-1">Potential: ${potentialReturn.toFixed(2)}</p>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm font-medium">Net Profit/Loss</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${netProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                  {netProfit >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                </div>
              </div>
              <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${Math.abs(netProfit).toFixed(2)}
              </p>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm font-medium">Win Rate</span>
                <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-yellow-400">
                {wonPredictions.length + lostPredictions.length > 0
                  ? Math.round((wonPredictions.length / (wonPredictions.length + lostPredictions.length)) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {wonPredictions.length}W / {lostPredictions.length}L
              </p>
            </Card>
          </div>
        </div>

        {/* Predictions List */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="bg-slate-900/50 border border-slate-800 mb-6">
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-slate-950"
            >
              Active ({activePredictions.length})
            </TabsTrigger>
            <TabsTrigger
              value="won"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-slate-950"
            >
              Won ({wonPredictions.length})
            </TabsTrigger>
            <TabsTrigger
              value="lost"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-slate-950"
            >
              Lost ({lostPredictions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activePredictions.length === 0 ? (
              <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-12">
                <p className="text-center text-slate-400">No active predictions</p>
              </Card>
            ) : (
              activePredictions.map(prediction => {
                const market = getMarketForPrediction(prediction);
                return (
                  <Link key={prediction.id} to={createPageUrl(`MarketDetails?id=${prediction.market_id}`)}>
                    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-yellow-500/50 transition-all duration-200 p-6 cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-yellow-400 mb-1">{market?.title}</h3>
                          <p className="text-yellow-400 font-medium mb-3">{getOutcomeTitle(prediction)}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-slate-400">Stake: </span>
                              <span className="text-white font-medium">${prediction.stake_amount}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Odds: </span>
                              <span className="text-white font-medium">{prediction.odds_at_prediction}%</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Potential: </span>
                              <span className="text-green-400 font-medium">${prediction.potential_return?.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/50">
                          Active
                        </Badge>
                      </div>
                    </Card>
                  </Link>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="won" className="space-y-4">
            {wonPredictions.length === 0 ? (
              <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-12">
                <p className="text-center text-slate-400">No won predictions yet</p>
              </Card>
            ) : (
              wonPredictions.map(prediction => {
                const market = getMarketForPrediction(prediction);
                return (
                  <Card key={prediction.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-yellow-400 mb-1">{market?.title}</h3>
                        <p className="text-yellow-400 font-medium mb-3">{getOutcomeTitle(prediction)}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Stake: </span>
                            <span className="text-white font-medium">${prediction.stake_amount}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Return: </span>
                            <span className="text-green-400 font-medium">${prediction.actual_return?.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Profit: </span>
                            <span className="text-green-400 font-medium">
                              +${(prediction.actual_return - prediction.stake_amount).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                        Won
                      </Badge>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="lost" className="space-y-4">
            {lostPredictions.length === 0 ? (
              <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-12">
                <p className="text-center text-slate-400">No lost predictions</p>
              </Card>
            ) : (
              lostPredictions.map(prediction => {
                const market = getMarketForPrediction(prediction);
                return (
                  <Card key={prediction.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-yellow-400 mb-1">{market?.title}</h3>
                        <p className="text-yellow-400 font-medium mb-3">{getOutcomeTitle(prediction)}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Stake: </span>
                            <span className="text-white font-medium">${prediction.stake_amount}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Loss: </span>
                            <span className="text-red-400 font-medium">-${prediction.stake_amount}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                        Lost
                      </Badge>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
