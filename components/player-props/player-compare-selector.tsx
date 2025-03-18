"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PlayerData } from "./use-player-props"

interface PlayerCompareSelectorProps {
  players: PlayerData[]
  selectedPlayer: string | null
  setSelectedPlayer: (player: string | null) => void
}

export function PlayerCompareSelector({ players, selectedPlayer, setSelectedPlayer }: PlayerCompareSelectorProps) {
  return (
    <div className="px-6 py-3 border-b shrink-0">
      <label className="text-sm font-medium mb-2 block">Select Player to Compare</label>
      <Select value={selectedPlayer || ""} onValueChange={(value) => setSelectedPlayer(value || null)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a player to compare across sportsbooks" />
        </SelectTrigger>
        <SelectContent>
          {players.map((player) => (
            <SelectItem key={player.name} value={player.name}>
              {player.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

