import React, { useState } from "react";
import { Game, Odd } from "@/lib/oddsblaze-utils";
import { MoreHorizontal } from "lucide-react";
import AdditionalBetsPopup from "./AdditionalBetsPopup";
import { SelectedBet } from "./ParlayBuilder";

interface MainBetDisplayProps {
  game: Game;
  onSelectBet: (bet: SelectedBet) => void;
  selectedBets: SelectedBet[];
}

const MainBetDisplay: React.FC<MainBetDisplayProps> = ({
  game,
  onSelectBet,
  selectedBets,
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === "string" ? parseInt(price, 10) : price;
    return numPrice >= 0 ? `+${numPrice}` : numPrice.toString();
  };

  const findOdd = (market: string, selection?: string): Odd | undefined => {
    return game.sportsbooks[0].odds.find(
      (odd) =>
        odd.market === market &&
        (selection ? odd.selection === selection : true)
    );
  };

  const isBetSelected = (market: string, selection: string): boolean => {
    return selectedBets.some(
      (bet) =>
        bet.gameId === game.id &&
        bet.market === market &&
        bet.selection === selection
    );
  };

  const handleBetClick = (odd: Odd) => {
    onSelectBet({
      gameId: game.id,
      market: odd.market,
      selection: odd.selection || "",
      price: Number(odd.price),
      homeTeam: game.teams.home.name,
      awayTeam: game.teams.away.name,
      points: odd.points,
    });
  };

  const renderOddButton = (odd: Odd | undefined, label: string) => {
    if (!odd) return null;
    return (
      <button
        onClick={() => handleBetClick(odd)}
        className={`
          w-full p-2 rounded-lg text-left
          ${
            isBetSelected(odd.market, odd.selection || "")
              ? "bg-primary/10 border-primary"
              : "bg-background hover:bg-accent/10"
          }
          border transition-colors
        `}
      >
        <div className="flex justify-between items-center">
          <span className="font-medium">{label}</span>
          <span className="text-primary font-semibold">
            {formatPrice(odd.price)}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="w-full border rounded-lg p-4">
      <div className="text-sm text-muted-foreground mb-2">
        {new Date(game.start)
          .toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
          .toUpperCase()}
      </div>

      <h3 className="text-lg font-semibold mb-2">
        {game.teams.away.name} @ {game.teams.home.name}
      </h3>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div>
          {renderOddButton(
            findOdd("Point Spread", "Away"),
            `${game.teams.away.name} ${findOdd("Point Spread", "Away")?.points}`
          )}
          {renderOddButton(
            findOdd("Point Spread", "Home"),
            `${game.teams.home.name} ${findOdd("Point Spread", "Home")?.points}`
          )}
        </div>
        <div>
          {renderOddButton(
            findOdd("Total Points", "Over"),
            `O ${findOdd("Total Points", "Over")?.points}`
          )}
          {renderOddButton(
            findOdd("Total Points", "Under"),
            `U ${findOdd("Total Points", "Under")?.points}`
          )}
        </div>
        <div>
          {renderOddButton(findOdd("Moneyline", "Away"), game.teams.away.name)}
          {renderOddButton(findOdd("Moneyline", "Home"), game.teams.home.name)}
        </div>
      </div>

      <button
        onClick={() => setIsPopupOpen(true)}
        className="w-full flex items-center justify-center py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        More Bets
        <MoreHorizontal className="ml-2 h-4 w-4" />
      </button>

      {isPopupOpen && (
        <AdditionalBetsPopup
          game={game}
          onClose={() => setIsPopupOpen(false)}
          onSelectBet={onSelectBet}
          selectedBets={selectedBets}
        />
      )}
    </div>
  );
};

export default MainBetDisplay;
