// ============================================================================
// OUTCOMES LIST COMPONENT
// ============================================================================
// Displays all possible outcomes for a market with current probabilities

/**
 * Outcomes List Component
 * Shows all available outcomes for a market with their current probabilities,
 * stake amounts, and user's existing predictions
 * @param {Object} props - Component props
 * @param {Array} props.outcomes - Array of outcome objects
 * @param {Function} props.onSelectOutcome - Callback when user clicks to predict an outcome
 * @param {Array} props.userPredictions - User's existing predictions for this market
 */
export default function OutcomesList({ outcomes, onSelectOutcome, userPredictions }) {
  /**
   * Find user's prediction for a specific outcome
   * @param {string} outcomeId - The outcome ID to search for
   * @returns {Object|undefined} The prediction object if found
   */
  const getUserPredictionForOutcome = (outcomeId) => {
    return userPredictions.find(p => p.outcome_id === outcomeId);
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-6">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6">Predict the Outcome</h2>
      <div className="space-y-4">
        {outcomes?.map((outcome) => {
          const userPrediction = getUserPredictionForOutcome(outcome.id);

          return (
            <div
              key={outcome.id}
              className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700 hover:border-yellow-500/50 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors">
                      {outcome.title}
                    </h3>
                    {userPrediction && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                        <Check className="w-3 h-3 mr-1" />
                        Predicted
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-yellow-400">
                      {(outcome.probability / 100).toFixed(2)}
                    </span>
                    <span className="text-sm text-slate-400">
                      ${outcome.total_stake?.toLocaleString() || 0} staked
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => onSelectOutcome(outcome)}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-950 font-semibold"
                >
                  Predict
                </Button>
              </div>

              {/* Probability Bar */}
              <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full transition-all duration-500"
                  style={{ width: `${outcome.probability}%` }}
                />
              </div>

              {userPrediction && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Your stake:</span>
                    <span className="text-white font-medium">${userPrediction.stake_amount}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-400">Potential return:</span>
                    <span className="text-green-400 font-medium">${userPrediction.potential_return?.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
