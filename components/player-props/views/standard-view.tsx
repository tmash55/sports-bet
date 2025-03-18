"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { BookmakerKey } from "@/lib/constants/odds-api"
import type { PlayerData } from "../use-player-props"

interface StandardViewProps {
  players: PlayerData[]
  selectedBookmaker: BookmakerKey | null
  activeMarket: string
  formatOdds: (price: number) => string
  isPlayerPropSelected: (
    playerName: string,
    market: string,
    isOver: boolean,
    point: number,
    bookmaker?: string,
  ) => boolean
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
  setViewMode: (mode: "standard" | "alternate" | "compare") => void
  setSelectedPlayer: (player: string | null) => void
}

export function StandardView({
  players,
  selectedBookmaker,
  activeMarket,
  formatOdds,
  isPlayerPropSelected,
  onAddToParlayPlayerProp,
  eventId,
  setViewMode,
  setSelectedPlayer,
}: StandardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {players.map((player) => {
        const bookieData = selectedBookmaker ? player.bookmakers[selectedBookmaker] : null
        if (!bookieData || !bookieData.standardLine) return null

        // Get the standard line for display
        const standardLine = bookieData.standardLine

        // Count how many alternate lines are available
        const alternateLines = bookieData.lines?.filter((line) => line.isAlternate) || []
        const hasAlternateLines = alternateLines.length > 0

        const overSelected = isPlayerPropSelected(
          player.name,
          activeMarket,
          true,
          standardLine.over?.point || 0,
          selectedBookmaker,
        )
        const underSelected = isPlayerPropSelected(
          player.name,
          activeMarket,
          false,
          standardLine.under?.point || 0,
          selectedBookmaker,
        )

        return (
          <Card key={player.name} className="overflow-hidden border-none shadow-md">
            <CardHeader className="bg-muted/5 px-4 py-3 border-b flex flex-row justify-between items-center">
              <div className="font-medium truncate">{player.name}</div>
              {hasAlternateLines && (
                <Badge variant="outline" className="text-xs">
                  {alternateLines.length} alt lines
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={overSelected ? "default" : "outline"}
                  size="sm"
                  className={cn("justify-between h-10 font-normal", !overSelected && "hover:border-primary/50")}
                  onClick={() =>
                    onAddToParlayPlayerProp(
                      eventId,
                      player.name,
                      activeMarket,
                      true,
                      standardLine.over?.point || 0,
                      standardLine.over?.price || 0,
                      selectedBookmaker || undefined,
                    )
                  }
                >
                  <span className="font-medium">Over {standardLine.over?.point}</span>
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      overSelected
                        ? "bg-primary-foreground/20"
                        : standardLine.over?.price && standardLine.over.price > 0
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600",
                    )}
                  >
                    {formatOdds(standardLine.over?.price || 0)}
                  </span>
                </Button>

                <Button
                  variant={underSelected ? "default" : "outline"}
                  size="sm"
                  className={cn("justify-between h-10 font-normal", !underSelected && "hover:border-primary/50")}
                  onClick={() =>
                    onAddToParlayPlayerProp(
                      eventId,
                      player.name,
                      activeMarket,
                      false,
                      standardLine.under?.point || 0,
                      standardLine.under?.price || 0,
                      selectedBookmaker || undefined,
                    )
                  }
                >
                  <span className="font-medium">Under {standardLine.under?.point}</span>
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      underSelected
                        ? "bg-primary-foreground/20"
                        : standardLine.under?.price && standardLine.under.price > 0
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600",
                    )}
                  >
                    {formatOdds(standardLine.under?.price || 0)}
                  </span>
                </Button>
              </div>

              {hasAlternateLines && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs h-7 text-muted-foreground mt-2"
                  onClick={() => {
                    setViewMode("alternate")
                    setSelectedPlayer(player.name)
                  }}
                >
                  View {alternateLines.length} alternate lines
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

