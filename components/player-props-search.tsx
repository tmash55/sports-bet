"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import type { SportKey, BookmakerKey } from "@/lib/constants/odds-api"

interface PlayerPropsSearchProps {
  sport: SportKey
  events: any[]
  selectedBookmaker: BookmakerKey | null
  availableBookmakers: BookmakerKey[]
  onSearch: (eventId: string, playerName: string, market: string) => void
}

export function PlayerPropsSearch({
  sport,
  events,
  selectedBookmaker,
  availableBookmakers,
  onSearch,
}: PlayerPropsSearchProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [playerName, setPlayerName] = useState<string>("")
  const [selectedMarket, setSelectedMarket] = useState<string>("player_points")

  // Get available markets for the selected sport
  const getAvailableMarkets = () => {
    const markets = []

    if (sport === "basketball_nba") {
      markets.push(
        { value: "player_points", label: "Points" },
        { value: "player_rebounds", label: "Rebounds" },
        { value: "player_assists", label: "Assists" },
        { value: "player_threes", label: "Three Pointers" },
        { value: "player_blocks", label: "Blocks" },
        { value: "player_steals", label: "Steals" },
        { value: "player_turnovers", label: "Turnovers" },
        { value: "player_points_rebounds_assists", label: "PRA" },
      )
    } else if (sport === "americanfootball_nfl") {
      markets.push(
        { value: "player_pass_tds", label: "Passing TDs" },
        { value: "player_pass_yds", label: "Passing Yards" },
        { value: "player_pass_completions", label: "Pass Completions" },
        { value: "player_pass_attempts", label: "Pass Attempts" },
        { value: "player_rush_yds", label: "Rushing Yards" },
        { value: "player_rush_attempts", label: "Rush Attempts" },
        { value: "player_rush_tds", label: "Rushing TDs" },
        { value: "player_reception_yds", label: "Receiving Yards" },
        { value: "player_receptions", label: "Receptions" },
      )
    } else if (sport === "baseball_mlb") {
      markets.push(
        { value: "player_hits", label: "Hits" },
        { value: "player_home_runs", label: "Home Runs" },
        { value: "player_runs", label: "Runs" },
        { value: "player_rbis", label: "RBIs" },
        { value: "player_strikeouts", label: "Strikeouts" },
        { value: "player_total_bases", label: "Total Bases" },
      )
    } else if (sport === "icehockey_nhl") {
      markets.push(
        { value: "player_points", label: "Points" },
        { value: "player_goals", label: "Goals" },
        { value: "player_assists", label: "Assists" },
        { value: "player_shots_on_goal", label: "Shots on Goal" },
      )
    }

    return markets
  }

  const markets = getAvailableMarkets()

  const handleSearch = () => {
    if (!selectedEvent) {
      return
    }

    onSearch(selectedEvent, playerName, selectedMarket)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Game</label>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger>
              <SelectValue placeholder="Select Game" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.away_team} @ {event.home_team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Market</label>
          <Select value={selectedMarket} onValueChange={setSelectedMarket}>
            <SelectTrigger>
              <SelectValue placeholder="Select Market" />
            </SelectTrigger>
            <SelectContent>
              {markets.map((market) => (
                <SelectItem key={market.value} value={market.value}>
                  {market.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Player Name</label>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for player..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Button onClick={handleSearch} disabled={!selectedEvent} className="w-full">
        Search Player Props
      </Button>
    </div>
  )
}

