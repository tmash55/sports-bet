import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Odd } from "@/lib/oddsblaze-utils";
import { SelectedBet } from "./AdditionalBetOptions";

interface BetDropdownProps {
  title: string;
  odds: Odd[];
  onSelectBet: (bet: Odd) => void;
  selectedBet?: SelectedBet;
  homeTeam: string;
  awayTeam: string;
}

const BetDropdown: React.FC<BetDropdownProps> = ({
  title,
  odds,
  onSelectBet,
  selectedBet,
  homeTeam,
  awayTeam,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === "string" ? parseInt(price, 10) : price;
    return numPrice >= 0 ? `+${numPrice}` : numPrice.toString();
  };

  const formatSelection = (odd: Odd): string => {
    if (odd.market === "Point Spread") {
      const team = odd.name === "Away" ? awayTeam : homeTeam;
      const sign = odd.points && odd.points >= 0 ? "+" : "";
      return `${team} ${sign}${odd.points}`;
    }
    if (odd.market === "Total Points") {
      return `${odd.selection} ${odd.points}`;
    }
    return odd.selection || odd.name;
  };

  const sortedOdds = [...odds].sort((a, b) => {
    if (a.points !== null && b.points !== null) {
      return a.points - b.points;
    }
    return 0;
  });

  return (
    <div className="w-full mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 bg-background border rounded-lg hover:bg-accent/5 transition-colors"
      >
        <span className="font-medium">{title}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {isOpen && (
        <div className="mt-2 border rounded-lg overflow-hidden">
          {sortedOdds.map((odd, index) => {
            const isSelected =
              selectedBet &&
              odd.market === selectedBet.market &&
              formatSelection(odd) === selectedBet.selection;
            return (
              <button
                key={`${odd.market}-${odd.selection}-${index}`}
                onClick={() => onSelectBet(odd)}
                className={`w-full flex justify-between items-center p-3 hover:bg-accent/5 transition-colors ${
                  isSelected ? "bg-primary/5" : ""
                }`}
              >
                <span>{formatSelection(odd)}</span>
                <span className="text-primary font-semibold">
                  {formatPrice(odd.price)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BetDropdown;
