import React, { useState } from "react";
import { Odd, Game } from "@/lib/oddsblaze-utils";
import { SelectedBet } from "./AdditionalBetOptions";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlayerPropsProps {
  odds: Odd[];
  onSelectBet: (bet: SelectedBet) => void;
  selectedBets: SelectedBet[];
  game: Game;
}

const propCategories = [
  { id: "points", name: "Points" },
  { id: "rebounds", name: "Rebounds" },
  { id: "assists", name: "Assists" },
  { id: "threes", name: "Threes" },
  { id: "blocks", name: "Blocks" },
  { id: "steals", name: "Steals" },
];

const PlayerProps: React.FC<PlayerPropsProps> = ({
  odds,
  onSelectBet,
  selectedBets,
  game,
}) => {
  const [expandedPlayers, setExpandedPlayers] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("points");

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

  const togglePlayerExpansion = (playerName: string) => {
    setExpandedPlayers((prev) =>
      prev.includes(playerName)
        ? prev.filter((name) => name !== playerName)
        : [...prev, playerName]
    );
  };

  const filterOddsByCategory = (odds: Odd[], category: string) => {
    return odds.filter((odd) => odd.market.toLowerCase().includes(category));
  };

  const groupedOdds = odds.reduce((acc, odd) => {
    const playerName = odd.players[0]?.name || "Unknown Player";
    if (!acc[playerName]) {
      acc[playerName] = [];
    }
    acc[playerName].push(odd);
    return acc;
  }, {} as Record<string, Odd[]>);

  return (
    <div className="space-y-4">
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-4">
          {propCategories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {propCategories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            {Object.entries(groupedOdds).map(([playerName, playerOdds]) => {
              const filteredOdds = filterOddsByCategory(
                playerOdds,
                category.name
              );
              if (filteredOdds.length === 0) return null;

              return (
                <div
                  key={playerName}
                  className="border rounded-lg overflow-hidden mb-4"
                >
                  <button
                    onClick={() => togglePlayerExpansion(playerName)}
                    className="w-full p-4 text-left bg-background hover:bg-accent/5 transition-colors flex justify-between items-center"
                  >
                    <span className="font-semibold">{playerName}</span>
                    {expandedPlayers.includes(playerName) ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                  {expandedPlayers.includes(playerName) && (
                    <div className="p-4 bg-accent/5 space-y-2">
                      {filteredOdds.map((odd, index) => {
                        const isSelected = isBetSelected(
                          odd.market,
                          `${playerName} ${odd.selection} ${odd.points}`
                        );
                        const isOver = odd.selection
                          ?.toLowerCase()
                          .includes("over");

                        return (
                          <button
                            key={`${odd.market}-${odd.selection}-${index}`}
                            onClick={() => {
                              const selectedBet: SelectedBet = {
                                gameId: game.id,
                                market: odd.market,
                                selection: `${playerName} ${odd.selection} ${odd.points}`,
                                price: Number(odd.price),
                                homeTeam: game.teams.home.name,
                                awayTeam: game.teams.away.name,
                                points: odd.points,
                              };
                              onSelectBet(selectedBet);
                            }}
                            className={`
                              w-full p-3 rounded-lg text-left flex justify-between items-center
                              ${
                                isSelected
                                  ? "bg-primary/10 border-primary"
                                  : "bg-background hover:bg-accent/10"
                              }
                              border transition-colors
                            `}
                          >
                            <div className="flex items-center space-x-3">
                              {isOver ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {odd.market.replace("Player ", "")}{" "}
                                  {odd.selection} {odd.points}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`font-semibold ${
                                Number(odd.price) >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {formatPrice(odd.price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default PlayerProps;
