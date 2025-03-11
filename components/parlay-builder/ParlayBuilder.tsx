"use client";

import { useState, useEffect } from "react";
import { fetchOdds } from "@/lib/api";
import { Game } from "@/lib/oddsblaze-utils";
import MainBetDisplay from "./MainBetDisplay";
import ParlaySlip from "./ParlaySlip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sportsbooks = ["draftkings", "fanduel", "betmgm"];
const sports = ["nfl", "nba", "mlb", "nhl"];

export interface SelectedBet {
  gameId: string;
  market: string;
  selection: string;
  price: number;
  homeTeam: string;
  awayTeam: string;
  points?: number | null;
}

export default function ParlayBuilder() {
  const [selectedBets, setSelectedBets] = useState<SelectedBet[]>([]);
  const [selectedSportsbook, setSelectedSportsbook] = useState("fanduel");
  const [selectedSport, setSelectedSport] = useState("nfl");
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOdds() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchOdds(selectedSport, selectedSportsbook);
        setGames(data.games);
      } catch (err) {
        setError("Failed to load odds");
      } finally {
        setIsLoading(false);
      }
    }

    loadOdds();
  }, [selectedSport, selectedSportsbook]);

  const handleSelectBet = (bet: SelectedBet) => {
    setSelectedBets((prev) => {
      const existingBetIndex = prev.findIndex(
        (b) => b.gameId === bet.gameId && b.market === bet.market
      );

      if (existingBetIndex > -1) {
        // Remove the bet if it's already selected
        return prev.filter((_, index) => index !== existingBetIndex);
      } else {
        // Check for conflicting bets
        const conflictingBet = prev.find(
          (b) =>
            b.gameId === bet.gameId &&
            ((b.market === "Moneyline" && bet.market === "Moneyline") ||
              (b.market === "Point Spread" && bet.market === "Point Spread") ||
              (b.market === "Total Points" && bet.market === "Total Points"))
        );

        if (conflictingBet) {
          // Remove the conflicting bet and add the new one
          return [...prev.filter((b) => b !== conflictingBet), bet];
        } else {
          // Add the new bet
          return [...prev, bet];
        }
      }
    });
  };

  const handleRemoveBet = (index: number) => {
    setSelectedBets((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Parlay Builder</h1>
      <div className="flex space-x-4 mb-8">
        <Select
          onValueChange={setSelectedSportsbook}
          defaultValue={selectedSportsbook}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Sportsbook" />
          </SelectTrigger>
          <SelectContent>
            {sportsbooks.map((book) => (
              <SelectItem key={book} value={book}>
                {book.charAt(0).toUpperCase() + book.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setSelectedSport} defaultValue={selectedSport}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Sport" />
          </SelectTrigger>
          <SelectContent>
            {sports.map((sport) => (
              <SelectItem key={sport} value={sport}>
                {sport.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <h2 className="text-2xl font-bold mb-4">Available Games</h2>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">Error: {error}</div>
          ) : games.length === 0 ? (
            <div className="text-center py-4">No games available</div>
          ) : (
            <div className="space-y-8">
              {games.map((game) => (
                <MainBetDisplay
                  key={game.id}
                  game={game}
                  onSelectBet={handleSelectBet}
                  selectedBets={selectedBets}
                />
              ))}
            </div>
          )}
        </div>
        <div className="lg:w-1/3">
          <ParlaySlip bets={selectedBets} onRemoveBet={handleRemoveBet} />
        </div>
      </div>
    </div>
  );
}
