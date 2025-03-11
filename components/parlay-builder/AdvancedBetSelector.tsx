import { useState } from "react";
import { Odd } from "@/lib/oddsblaze-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdvancedBetSelectorProps {
  odds: Odd[];
  onSelectBet: (bet: {
    market: string;
    selection: string;
    price: number;
  }) => void;
  homeTeam: string;
  awayTeam: string;
}

export default function AdvancedBetSelector({
  odds,
  onSelectBet,
  homeTeam,
  awayTeam,
}: AdvancedBetSelectorProps) {
  const [selectedPropType, setSelectedPropType] = useState<string | null>(null);

  const formatSelection = (odd: Odd) => {
    if (odd.market === "Moneyline") {
      return odd.name === "Away" ? awayTeam : homeTeam;
    }
    if (odd.market === "Point Spread") {
      const team = odd.name === "Away" ? awayTeam : homeTeam;
      const sign = odd.points && odd.points >= 0 ? "+" : "";
      return `${team} ${sign}${odd.points}`;
    }
    if (odd.market === "Total Points") {
      return `${odd.selection} ${odd.points}`;
    }
    if (odd.players && odd.players.length > 0) {
      const playerName = odd.players[0].name;
      const line = odd.points !== null ? ` ${odd.points}` : "";
      const overUnder = odd.selection ? ` ${odd.selection}` : "";
      return `${playerName}${overUnder}${line}`.trim();
    }
    return odd.selection || odd.name;
  };

  const formatPrice = (price: string | number): number => {
    if (typeof price === "string") {
      return parseInt(price, 10);
    }
    return price;
  };

  const groupOddsByMarket = (odds: Odd[]) => {
    return odds.reduce((acc, odd) => {
      const market = odd.market.split(" ")[0];
      if (!acc[market]) {
        acc[market] = [];
      }
      acc[market].push(odd);
      return acc;
    }, {} as Record<string, Odd[]>);
  };

  const groupedOdds = groupOddsByMarket(odds);
  const propTypes = Object.keys(groupedOdds).filter((market) =>
    market.includes("Player")
  );

  return (
    <div className="space-y-4">
      {propTypes.length > 0 && (
        <div>
          <Select onValueChange={setSelectedPropType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select prop type" />
            </SelectTrigger>
            <SelectContent>
              {propTypes.map((propType) => (
                <SelectItem key={propType} value={propType}>
                  {propType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(groupedOdds).map(
          ([market, marketOdds]) =>
            (!selectedPropType || market === selectedPropType) && (
              <div key={market} className="space-y-2">
                <h3 className="font-semibold">{market}</h3>
                {marketOdds.map((odd, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      onSelectBet({
                        market: odd.market,
                        selection: formatSelection(odd),
                        price: formatPrice(odd.price),
                      })
                    }
                    className="w-full p-2 rounded-lg border hover:border-primary transition-colors text-left"
                  >
                    <div className="flex justify-between items-center">
                      <span>{formatSelection(odd)}</span>
                      <span className="text-primary">
                        {formatPrice(odd.price) >= 0
                          ? `+${formatPrice(odd.price)}`
                          : formatPrice(odd.price)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )
        )}
      </div>
    </div>
  );
}
