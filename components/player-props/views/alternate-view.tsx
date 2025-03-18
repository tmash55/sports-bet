"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { PlayerData } from "../use-player-props"

interface AlternateViewProps {
  players: PlayerData[]
  selectedPlayer: string | null
  activeMarket: string
  formatOdds: (price: number) => string
  onAddToParlayPlayerProp: (
    eventId: string,
    playerName: string,
    market: string,
    isOver: boolean,
    point: number,
    price: number,
    bookmaker?: string,
  ) => void
  eventId: string
  getMarketDisplayName: (market: string) => string
}

export function AlternateView({
  players,
  selectedPlayer,
  activeMarket,
  formatOdds,
  onAddToParlayPlayerProp,
  eventId,
  getMarketDisplayName,
}: AlternateViewProps) {
  return (
    <div className="space-y-8">
      {players.map((player) => {
        // Skip if not the selected player when a player is selected
        if (selectedPlayer && player.name !== selectedPlayer) return null

        // Check if this player has any alternate lines
        const hasAlternateLines = Object.values(player.bookmakers).some(
          (bookie: any) => bookie.alternateLines && bookie.alternateLines.length > 0,
        )

        if (!hasAlternateLines) return null

        return (
          <div key={player.name} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{player.name}</h3>
              <Badge variant="outline">{getMarketDisplayName(activeMarket)}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {Object.entries(player.bookmakers).map(([bookmaker, data]: [string, any]) => {
                if (!data.alternateLines || data.alternateLines.length === 0) return null

                // Sort alternate lines by point value
                const sortedLines = [...data.alternateLines].sort((a, b) => a.point - b.point)

                return (
                  <Card key={bookmaker} className="overflow-hidden">
                    <CardHeader className="bg-muted/5 px-4 py-3 border-b">
                      <div className="font-medium capitalize">{bookmaker}</div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {sortedLines.map((line, index) => (
                          <div key={index} className="border rounded-md p-2 bg-card">
                            <div className="text-sm font-medium mb-1">{line.point}</div>
                            <div className="grid grid-cols-2 gap-2">
                              {line.over && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    onAddToParlayPlayerProp(
                                      eventId,
                                      player.name,
                                      activeMarket,
                                      true,
                                      line.point,
                                      line.over.price,
                                      bookmaker,
                                    )
                                  }
                                >
                                  <span className={cn(line.over.price > 0 ? "text-emerald-600" : "text-red-600")}>
                                    O {formatOdds(line.over.price)}
                                  </span>
                                </Button>
                              )}
                              {line.under && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    onAddToParlayPlayerProp(
                                      eventId,
                                      player.name,
                                      activeMarket,
                                      false,
                                      line.point,
                                      line.under.price,
                                      bookmaker,
                                    )
                                  }
                                >
                                  <span className={cn(line.under.price > 0 ? "text-emerald-600" : "text-red-600")}>
                                    U {formatOdds(line.under.price)}
                                  </span>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

