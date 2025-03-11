import React, { useState, useEffect } from "react";
import { Odd, Game } from "@/lib/oddsblaze-utils";
import { SelectedBet } from "./AdditionalBetOptions";
import { ChevronDown, ChevronUp } from "lucide-react";

interface GameLinesProps {
  odds: Odd[];
  onSelectBet: (bet: SelectedBet) => void;
  selectedBets: SelectedBet[];
  game: Game;
}

const GameLines: React.FC<GameLinesProps> = ({
  odds,
  onSelectBet,
  selectedBets,
  game,
}) => {
  const [expandedMarkets, setExpandedMarkets] = useState<string[]>([]);

  useEffect(() => {
    // Expand the first market by default
    if (odds.length > 0 && expandedMarkets.length === 0) {
      setExpandedMarkets([odds[0].market]);
    }
  }, [odds]);

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === "string" ? parseInt(price, 10) : price;
    return numPrice >= 0 ? `+${numPrice}` : numPrice.toString();
  };

  const isBetSelected = (market: string, selection: string): boolean => {
    return selectedBets.some(
      (bet) =>
        bet.gameId === game.id &&
        bet.market === market &&
        bet.selection === selection
    );
  };

  const renderOdd = (odd: Odd) => {
    const teamName =
      odd.name === "Away" ? game.teams.away.name : game.teams.home.name;
    let selection = teamName;
    if (odd.market === "Total Points") {
      selection = `${odd.selection} ${odd.points}`;
    } else if (odd.points !== null) {
      selection += ` ${odd.points > 0 ? "+" : ""}${odd.points}`;
    }
    const isSelected = isBetSelected(odd.market, selection);

    return (
      <button
        key={`${odd.market}-${odd.name}-${odd.points}`}
        onClick={() =>
          onSelectBet({
            gameId: game.id,
            market: odd.market,
            selection: selection,
            price: Number(odd.price),
            homeTeam: game.teams.home.name,
            awayTeam: game.teams.away.name,
            points: odd.points,
          })
        }
        className={`
          w-full p-3 rounded-lg text-left
          ${
            isSelected
              ? "bg-primary/10 border-primary"
              : "bg-background hover:bg-accent/10"
          }
          border transition-colors
        `}
      >
        <div className="flex justify-between items-center">
          <span className="font-medium">{selection}</span>
          <span
            className={`font-semibold ${
              Number(odd.price) >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {formatPrice(odd.price)}
          </span>
        </div>
      </button>
    );
  };

  const groupedOdds = odds.reduce((acc, odd) => {
    if (!acc[odd.market]) {
      acc[odd.market] = [];
    }
    acc[odd.market].push(odd);
    return acc;
  }, {} as Record<string, Odd[]>);

  const sortedMarkets = Object.keys(groupedOdds).sort((a, b) => {
    const order = ["Point Spread", "Total Points", "Moneyline"];
    return order.indexOf(a) - order.indexOf(b);
  });

  const toggleMarket = (market: string) => {
    setExpandedMarkets((prev) =>
      prev.includes(market)
        ? prev.filter((m) => m !== market)
        : [...prev, market]
    );
  };

  return (
    <div className="space-y-4">
      {sortedMarkets.map((market) => {
        const marketOdds = groupedOdds[market] || [];
        const isExpanded = expandedMarkets.includes(market);

        return (
          <div key={market} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleMarket(market)}
              className="w-full p-4 text-left bg-background hover:bg-accent/5 transition-colors flex justify-between items-center"
            >
              <span className="font-semibold">{market}</span>
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isExpanded && (
              <div className="p-4 bg-accent/5 space-y-2">
                {marketOdds.map(renderOdd)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GameLines;
