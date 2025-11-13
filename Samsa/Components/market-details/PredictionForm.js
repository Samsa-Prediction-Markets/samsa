export default function PredictionForm({ market, outcome, onSubmit, onCancel, isProcessing }) {
  const [stakeAmount, setStakeAmount] = useState("");

  const calculateReturn = () => {
    const stake = parseFloat(stakeAmount) || 0;
    if (stake === 0) return 0;

    // Simple calculation: if you bet on 60% odds, you get less return than betting on 20% odds
    const multiplier = 100 / outcome.probability;
    return stake * multiplier;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const stake = parseFloat(stakeAmount);
    if (isNaN(stake) || stake <= 0) return;

    const potentialReturn = calculateReturn();

    onSubmit({
      market_id: market.id,
      outcome_id: outcome.id,
      stake_amount: stake,
      odds_at_prediction: outcome.probability,
      potential_return: potentialReturn,
      status: "active"
    });
  };

  return (
    <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 backdrop-blur-xl border-yellow-500/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Place Prediction</h3>
            <p className="text-sm text-slate-300">{outcome.title}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
          <div className="flex justify-between mb-2">
            <span className="text-slate-400 text-sm">Current odds</span>
            <span className="text-yellow-400 font-bold text-lg">{outcome.probability}%</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stake" className="text-white font-medium">Stake Amount ($)</Label>
          <Input
            id="stake"
            type="number"
            min="1"
            step="0.01"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="Enter amount"
            className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 h-12 text-lg"
            required
          />
        </div>

        {stakeAmount && parseFloat(stakeAmount) > 0 && (
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Your stake</span>
              <span className="text-white font-medium">${parseFloat(stakeAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-slate-300 font-medium">Potential return</span>
              <span className="text-green-400 font-bold">${calculateReturn().toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-700">
              <span className="text-slate-400">Potential profit</span>
              <span className="text-green-400 font-semibold">
                ${(calculateReturn() - parseFloat(stakeAmount)).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isProcessing || !stakeAmount || parseFloat(stakeAmount) <= 0}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-950 font-bold h-12 text-lg"
        >
          {isProcessing ? "Processing..." : "Confirm Prediction"}
        </Button>
      </form>
    </Card>
  );
}