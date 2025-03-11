import React, { useState, useEffect } from "react";
import { fetchOdds } from "@/lib/api";
import { Game, Odd } from "@/lib/oddsblaze-utils";
import MainBetDisplay from "./MainBetDisplay";
import { nflMarkets, NFLMarkets } from "@/app/utils/nflMarkets";

interface OddsDisplayProps {
  sport: string;
  sportsbook: string;
  category: string;
  onSelectBet: (bet: SelectedBet) => void;
  selectedBets: SelectedBet[];
}

export interface SelectedBet {
  gameId: string;
  market: string;
  selection: string;
  price: number;
  homeTeam: string;
  awayTeam: string;
  points?: number | null;
}

const OddsDisplay: React.FC<OddsDisplayProps> = ({
  sport,
  sportsbook,
  category,
  onSelectBet,
  selectedBets,
}) => {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOdds() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchOdds(sport, sportsbook);
        setGames(data.games);
      } catch (err) {
        setError("Failed to load odds");
      } finally {
        setIsLoading(false);
      }
    }

    loadOdds();
  }, [sport, sportsbook]);

  const filterOddsByCategory = (odds: Odd[], category: string): Odd[] => {
    const [mainCategory, subCategory] = category.split("-");
    const marketCategory = nflMarkets[mainCategory as keyof NFLMarkets];

    if (Array.isArray(marketCategory)) {
      return odds.filter((odd) => marketCategory.includes(odd.market));
    } else if (subCategory && marketCategory[subCategory]) {
      return odds.filter((odd) =>
        marketCategory[subCategory].includes(odd.market)
      );
    }

    return odds;
  };

  if (isLoading) return <div className="text-center py-4">Loading...</div>;
  if (error)
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  if (games.length === 0)
    return <div className="text-center py-4">No games available</div>;

  return (
    <div className="space-y-8">
      {games.map((game) => (
        <div key={game.id} className="border rounded-lg p-4">
          
        </div>
      ))}
    </div>
  );
};

export default OddsDisplay;
