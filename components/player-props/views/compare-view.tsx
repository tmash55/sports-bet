"use client"

import React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { MARKET_INFO } from "@/lib/constants/odds-api"
import type { PlayerData } from "../use-player-props"

interface CompareViewProps {
  player?: PlayerData
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
  findBestOdds: (
    player: PlayerData,
    point: number,
    isOver: boolean,
  ) => { odds: number | null; bookmaker: string | null }
}

export function CompareView({
  player,
  activeMarket,
  formatOdds,
  isPlayerPropSelected,
  onAddToParlayPlayerProp,
  eventId,
  findBestOdds,
}: CompareViewProps) {
  if (!player) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Select a player to compare odds across bookmakers</p>
      </div>
    )
  }

  // Get all available bookmakers for this player
  const bookmakers = Object.keys(player.bookmakers)

  // Get all unique point values across all bookmakers
  const allPoints = new Set<number>()

  bookmakers.forEach((bookmaker) => {
    const data = player.bookmakers[bookmaker]

    // Add points from standard line
    if (data.standardLine) {
      if (data.standardLine.over?.point) allPoints.add(data.standardLine.over.point)
      if (data.standardLine.under?.point) allPoints.add(data.standardLine.under.point)
    }

    // Add points from alternate lines
    if (data.alternateLines) {
      data.alternateLines.forEach((line) => {
        allPoints.add(line.point)
      })
    }

    // For backward compatibility
    if (data.lines) {
      data.lines.forEach((line) => {
        allPoints.add(line.point)
      })
    }
  })

  // Sort points in ascending order
  const sortedPoints = Array.from(allPoints).sort((a, b) => a - b)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/5 px-4 py-3 border-b flex flex-row justify-between items-center">
        <div className="font-medium">{player.name}</div>
        <Badge variant="outline">{MARKET_INFO[activeMarket as keyof typeof MARKET_INFO]?.name || activeMarket}</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-muted/20">
                <th className="px-4 py-2 text-left font-medium text-sm">Line</th>
                {bookmakers.map((bookmaker) => (
                  <th key={bookmaker} className="px-4 py-2 text-center font-medium text-sm capitalize">
                    {bookmaker}
                  </th>
                ))}
                <th className="px-4 py-2 text-center font-medium text-sm">Best Odds</th>
              </tr>
            </thead>
            <tbody>
              {sortedPoints.map((point) => {
                // Find best odds for this point
                const bestOverOdds = findBestOdds(player, point, true)
                const bestUnderOdds = findBestOdds(player, point, false)

                return (
                  <React.Fragment key={point}>
                    {/* Over row */}
                    <tr className="border-b">
                      <td className="px-4 py-2 font-medium">
                        <div className="flex items-center">
                          <span>Over {point}</span>
                          {bookmakers.some((bookie) => {
                            const standardLine = player.bookmakers[bookie]?.standardLine
                            return (
                              standardLine &&
                              (standardLine.over?.point === point || standardLine.under?.point === point)
                            )
                          }) && (
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-4">
                              Standard
                            </Badge>
                          )}
                        </div>
                      </td>
                      {bookmakers.map((bookmaker) => {
                        const data = player.bookmakers[bookmaker]
                        const lines = data.lines || []
                        const line = lines.find((l) => l.point === point)
                        const odds = line?.over?.price
                        const isSelected = isPlayerPropSelected(player.name, activeMarket, true, point, bookmaker)
                        const isBest = bestOverOdds.bookmaker === bookmaker && bestOverOdds.odds === odds
                        const isStandardLine =
                          data.standardLine &&
                          (data.standardLine.over?.point === point || data.standardLine.under?.point === point)

                        return (
                          <td key={`${bookmaker}-over`} className="px-4 py-2 text-center">
                            {odds ? (
                              <Button
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                  "h-8 px-2 min-w-[80px]",
                                  isBest && !isSelected && "border-green-500",
                                  !isStandardLine && !isSelected && "border-amber-200 bg-amber-50/30",
                                )}
                                onClick={() =>
                                  onAddToParlayPlayerProp(
                                    eventId,
                                    player.name,
                                    activeMarket,
                                    true,
                                    point,
                                    odds,
                                    bookmaker,
                                  )
                                }
                              >
                                <span
                                  className={cn(
                                    "text-xs",
                                    isSelected ? "" : odds > 0 ? "text-emerald-600" : "text-red-600",
                                  )}
                                >
                                  {formatOdds(odds)}
                                </span>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 text-center">
                        {bestOverOdds.odds ? (
                          <Badge
                            className={cn(
                              "px-2 py-1",
                              bestOverOdds.odds > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800",
                            )}
                          >
                            {formatOdds(bestOverOdds.odds)}
                            <span className="ml-1 text-[10px] opacity-70 capitalize">{bestOverOdds.bookmaker}</span>
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>

                    {/* Under row */}
                    <tr className="border-b bg-muted/5">
                      <td className="px-4 py-2 font-medium">
                        <div className="flex items-center">
                          <span>Under {point}</span>
                          {bookmakers.some((bookie) => {
                            const standardLine = player.bookmakers[bookie]?.standardLine
                            return (
                              standardLine &&
                              (standardLine.over?.point === point || standardLine.under?.point === point)
                            )
                          }) && (
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-4">
                              Standard
                            </Badge>
                          )}
                        </div>
                      </td>
                      {bookmakers.map((bookmaker) => {
                        const data = player.bookmakers[bookmaker]
                        const lines = data.lines || []
                        const line = lines.find((l) => l.point === point)
                        const odds = line?.under?.price
                        const isSelected = isPlayerPropSelected(player.name, activeMarket, false, point, bookmaker)
                        const isBest = bestUnderOdds.bookmaker === bookmaker && bestUnderOdds.odds === odds
                        const isStandardLine =
                          data.standardLine &&
                          (data.standardLine.over?.point === point || data.standardLine.under?.point === point)

                        return (
                          <td key={`${bookmaker}-under`} className="px-4 py-2 text-center">
                            {odds ? (
                              <Button
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                  "h-8 px-2 min-w-[80px]",
                                  isBest && !isSelected && "border-green-500",
                                  !isStandardLine && !isSelected && "border-amber-200 bg-amber-50/30",
                                )}
                                onClick={() =>
                                  onAddToParlayPlayerProp(
                                    eventId,
                                    player.name,
                                    activeMarket,
                                    false,
                                    point,
                                    odds,
                                    bookmaker,
                                  )
                                }
                              >
                                <span
                                  className={cn(
                                    "text-xs",
                                    isSelected ? "" : odds > 0 ? "text-emerald-600" : "text-red-600",
                                  )}
                                >
                                  {formatOdds(odds)}
                                </span>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 text-center">
                        {bestUnderOdds.odds ? (
                          <Badge
                            className={cn(
                              "px-2 py-1",
                              bestUnderOdds.odds > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800",
                            )}
                          >
                            {formatOdds(bestUnderOdds.odds)}
                            <span className="ml-1 text-[10px] opacity-70 capitalize">{bestUnderOdds.bookmaker}</span>
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

