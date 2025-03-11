import React, { useState } from "react";
import { Game, Odd } from "@/lib/oddsblaze-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nflMarkets, NFLMarkets } from "@/app/utils/nflMarkets";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AdditionalBetOptionsProps {
  game: Game;
  onSelectBet: (bet: SelectedBet) => void;
  selectedBets: SelectedBet[];
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  filteredOdds: Odd[];
}

export interface SelectedBet {
  gameId: string;
  market: string;
  selection: string;
  price: number;
  homeTeam: string;
  awayTeam: string;
  points?: number;
}

interface GroupedOdd {
  playerName: string;
  overOdd: Odd | null;
  underOdd: Odd | null;
}

const AdditionalBetOptions: React.FC<AdditionalBetOptionsProps> = ({
  game,
  onSelectBet,
  selectedBets,
  selectedTab,
  setSelectedTab,
  filteredOdds,
}) => {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );
  const categories = Object.keys(nflMarkets);

  const groupOddsByMarketAndPlayer = (odds: Odd[]) => {
    return odds.reduce((acc, odd) => {
      const marketBase = odd.market
        .replace(/(Over|Under|Player\s)/g, "")
        .trim();
      if (!acc[marketBase]) {
        acc[marketBase] = new Map<string, GroupedOdd>();
      }

      const playerName = odd.players?.[0]?.name || "Unknown Player";
      const existingGroup = acc[marketBase].get(playerName) || {
        playerName,
        overOdd: null,
        underOdd: null,
      };

      if (odd.selection?.toLowerCase().includes("over")) {
        existingGroup.overOdd = odd;
      } else if (odd.selection?.toLowerCase().includes("under")) {
        existingGroup.underOdd = odd;
      }

      acc[marketBase].set(playerName, existingGroup);
      return acc;
    }, {} as Record<string, Map<string, GroupedOdd>>);
  };

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === "string" ? parseInt(price, 10) : price;
    return numPrice >= 0 ? `+${numPrice}` : numPrice.toString();
  };

  const isBetSelected = (odd: Odd, selection: string): boolean => {
    return selectedBets.some(
      (bet) =>
        bet.gameId === game.id &&
        bet.market === odd.market &&
        bet.selection === selection
    );
  };

  const renderMarketSection = (
    marketName: string,
    odds: Map<string, GroupedOdd>
  ) => {
    return (
      <Collapsible key={marketName} className="w-full mb-4">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-4 bg-card hover:bg-accent rounded-lg">
          <span className="font-semibold">{marketName}</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="rounded-lg border bg-card">
            <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-4">PLAYER</div>
              <div className="col-span-4 text-center">OVER</div>
              <div className="col-span-4 text-center">UNDER</div>
            </div>
            {Array.from(odds.values()).map((group) => (
              <div
                key={group.playerName}
                className="grid grid-cols-12 gap-4 p-4 border-t items-center"
              >
                <div className="col-span-4 font-medium">{group.playerName}</div>
                <div className="col-span-4">
                  {group.overOdd && (
                    <button
                      onClick={() =>
                        onSelectBet({
                          gameId: game.id,
                          market: group.overOdd.market,
                          selection: `${group.playerName} Over ${group.overOdd.points}`,
                          price: Number(group.overOdd.price),
                          homeTeam: game.teams.home.name,
                          awayTeam: game.teams.away.name,
                          points: group.overOdd.points,
                        })
                      }
                      className={`w-full p-2 rounded flex items-center justify-between ${
                        isBetSelected(
                          group.overOdd,
                          `${group.playerName} Over ${group.overOdd.points}`
                        )
                          ? "bg-primary/20"
                          : "hover:bg-accent"
                      }`}
                    >
                      <span>O {group.overOdd.points}</span>
                      <span className="text-green-500">
                        {formatPrice(group.overOdd.price)}
                      </span>
                    </button>
                  )}
                </div>
                <div className="col-span-4">
                  {group.underOdd && (
                    <button
                      onClick={() =>
                        onSelectBet({
                          gameId: game.id,
                          market: group.underOdd.market,
                          selection: `${group.playerName} Under ${group.underOdd.points}`,
                          price: Number(group.underOdd.price),
                          homeTeam: game.teams.home.name,
                          awayTeam: game.teams.away.name,
                          points: group.underOdd.points,
                        })
                      }
                      className={`w-full p-2 rounded flex items-center justify-between ${
                        isBetSelected(
                          group.underOdd,
                          `${group.playerName} Under ${group.underOdd.points}`
                        )
                          ? "bg-primary/20"
                          : "hover:bg-accent"
                      }`}
                    >
                      <span>U {group.underOdd.points}</span>
                      <span className="text-green-500">
                        {formatPrice(group.underOdd.price)}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const renderOdds = (odds: Odd[]) => {
    const groupedMarkets = groupOddsByMarketAndPlayer(odds);

    return Object.entries(groupedMarkets).map(([marketName, playerOdds]) =>
      renderMarketSection(marketName, playerOdds)
    );
  };

  const getFilteredOdds = () => {
    const marketCategory = nflMarkets[selectedTab as keyof NFLMarkets];
    if (Array.isArray(marketCategory)) {
      return filteredOdds.filter((odd) => marketCategory.includes(odd.market));
    } else if (typeof marketCategory === "object" && marketCategory !== null) {
      if (selectedSubcategory && marketCategory[selectedSubcategory]) {
        // Filter by specific subcategory
        return filteredOdds.filter((odd) =>
          marketCategory[selectedSubcategory].some((market) =>
            odd.market.toLowerCase().includes(market.toLowerCase())
          )
        );
      }
    }
    return [];
  };

  const renderSubcategories = () => {
    const marketCategory = nflMarkets[selectedTab as keyof NFLMarkets];
    if (
      typeof marketCategory === "object" &&
      marketCategory !== null &&
      !Array.isArray(marketCategory)
    ) {
      return (
        <div className="mb-4 border-b">
          <div className="flex overflow-x-auto space-x-2 p-2">
            {Object.keys(marketCategory).map((subCategory) => (
              <button
                key={subCategory}
                onClick={() => setSelectedSubcategory(subCategory)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-md
                  ${
                    selectedSubcategory === subCategory
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
              >
                {subCategory}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {categories.map((category) => (
          <TabsTrigger key={category} value={category}>
            {category}
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map((category) => (
        <TabsContent key={category} value={category}>
          {renderSubcategories()}
          <div className="space-y-4">{renderOdds(getFilteredOdds())}</div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default AdditionalBetOptions;
