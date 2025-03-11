import { SelectedBet } from "./OddsDisplay";
import { X } from "lucide-react";

interface ParlaySlipProps {
  bets: SelectedBet[];
  onRemoveBet: (index: number) => void;
}

export default function ParlaySlip({ bets, onRemoveBet }: ParlaySlipProps) {
  const isAllBetsSameGame = (bets: SelectedBet[]) => {
    if (bets.length <= 1) return false;
    const firstGameId = bets[0].gameId;
    return bets.every((bet) => bet.gameId === firstGameId);
  };

  const calculateParlayOdds = () => {
    console.log("Calculating parlay odds...");

    const isSGP = isAllBetsSameGame(bets);
    console.log("Is Same Game Parlay:", isSGP);

    // Convert bets to decimal odds based on total payout
    const decimalOdds = bets.map((bet, index) => {
      const price = Math.abs(bet.price);
      let decimal = bet.price > 0 ? bet.price / 100 + 1 : 100 / price + 1;
      console.log(
        `Bet ${index + 1}: ${bet.price} (Decimal: ${decimal.toFixed(4)})`
      );
      return decimal;
    });

    console.log("Decimal odds for all bets:", decimalOdds);

    // Calculate parlay decimal odds
    let parlayDecimalOdds = decimalOdds.reduce((acc, odds) => acc * odds, 1);

    // Apply SGP adjustment if all bets are from the same game
    if (isSGP) {
      // FanDuel-like SGP adjustment
      const sgpFactor = 0.95; // Adjusted factor to get closer to FanDuel's odds
      parlayDecimalOdds = 1 + (parlayDecimalOdds - 1) * sgpFactor;
    }

    console.log(
      "Parlay decimal odds (adjusted):",
      parlayDecimalOdds.toFixed(4)
    );

    // Convert parlay decimal odds back to American odds
    let americanOdds =
      parlayDecimalOdds >= 2
        ? (parlayDecimalOdds - 1) * 100
        : -100 / (parlayDecimalOdds - 1);

    // Final rounding at the last step
    americanOdds = Math.round(americanOdds);
    console.log("Final calculated American odds:", americanOdds);

    return americanOdds;
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h2 className="text-xl font-semibold mb-4">Parlay Slip</h2>
      {bets.length > 0 ? (
        <>
          <ul className="space-y-4 mb-4">
            {bets.map((bet, index) => (
              <li key={index} className="border-b border-border pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium mb-1">
                      {bet.awayTeam} @ {bet.homeTeam}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {bet.market}: {bet.selection}
                      {bet.points && ` (${bet.points})`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(bet.gameId).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-primary mr-3">
                      {bet.price > 0 ? `${bet.price}` : bet.price}
                    </span>
                    <button
                      onClick={() => onRemoveBet(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {bets.length >= 2 && (
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-lg font-bold flex justify-between items-center">
                <span>Parlay Odds</span>
                <span className="text-primary">
                  {calculateParlayOdds() > 0
                    ? `+${calculateParlayOdds()}`
                    : calculateParlayOdds()}
                </span>
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="text-muted-foreground">No bets selected</p>
      )}
    </div>
  );
}
