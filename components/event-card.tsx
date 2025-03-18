"use client"

import { CardContent } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { SportKey, BookmakerKey } from "@/lib/constants/odds-api"
import { type ParlayLeg, formatOdds } from "@/lib/utils/parlay-utils"
import { cn } from "@/lib/utils"
import { formatEventDateTime } from "@/lib/utils/date-utils"

import { Users } from "lucide-react"
import { PlayerPropsModal } from "./player-props/player-props-modal"

interface EventCardProps {
  event: {
    id: string
    sport_key: string
    commence_time: string
    home_team: string
    away_team: string
  }
  sport: SportKey
  parlayLegs: ParlayLeg[]
  eventOdds: any
  selectedBookmaker: BookmakerKey | null
  onAddToParlayMoneyline: (eventId: string, teamName: string, isHome: boolean) => void
  onAddToParlaySpread: (eventId: string, teamName: string, point: number, price: number) => void
  onAddToParlayTotal: (eventId: string, isOver: boolean, point: number) => void
  onAddToParlayPlayerProp: (
    eventId: string,
    playerName: string,
    market: string,
    isOver: boolean,
    point: number,
    price: number,
  ) => void
}

export function EventCard({
  event,
  sport,
  parlayLegs,
  eventOdds,
  selectedBookmaker,
  onAddToParlayMoneyline,
  onAddToParlaySpread,
  onAddToParlayTotal,
  onAddToParlayPlayerProp,
}: EventCardProps) {
  const [dataSource, setDataSource] = useState<"cache" | "api" | null>(null)
  const [playerPropsOpen, setPlayerPropsOpen] = useState(false)

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return formatEventDateTime(dateString)
  }

  // Set data source when odds data changes
  useEffect(() => {
    if (eventOdds) {
      setDataSource(eventOdds.source || "api")
    }
  }, [eventOdds])

  // Get the selected bookmaker data
  const getBookmakerData = () => {
    if (!eventOdds || !selectedBookmaker) return null
    return eventOdds.bookmakers?.find((b: any) => b.key === selectedBookmaker)
  }

  const bookmakerData = getBookmakerData()

  // Get moneyline odds
  const getMoneylineOdds = (teamName: string) => {
    if (!bookmakerData) return null
    const moneylineMarket = bookmakerData.markets?.find((m: any) => m.key === "h2h")
    if (!moneylineMarket) return null
    const outcome = moneylineMarket.outcomes?.find((o: any) => o.name === teamName)
    return outcome ? outcome.price : null
  }

  // Get spread odds
  const getSpreadData = (teamName: string) => {
    if (!bookmakerData) return null
    const spreadMarket = bookmakerData.markets?.find((m: any) => m.key === "spreads")
    if (!spreadMarket) return null
    const outcome = spreadMarket.outcomes?.find((o: any) => o.name === teamName)
    return outcome ? { point: outcome.point, price: outcome.price } : null
  }

  // Get total odds
  const getTotalData = (isOver: boolean) => {
    if (!bookmakerData) return null
    const totalMarket = bookmakerData.markets?.find((m: any) => m.key === "totals")
    if (!totalMarket) return null
    const outcome = totalMarket.outcomes?.find((o: any) => o.name === (isOver ? "Over" : "Under"))
    return outcome ? { point: outcome.point, price: outcome.price } : null
  }

  // Check if a moneyline bet is already in the parlay
  const isMoneylineSelected = (teamName: string) => {
    return parlayLegs.some(
      (leg) =>
        leg.eventId === event.id &&
        leg.market === "h2h" &&
        leg.selection === teamName &&
        leg.bookmaker === selectedBookmaker,
    )
  }

  // Check if a spread bet is already in the parlay
  const isSpreadSelected = (teamName: string, point: number) => {
    return parlayLegs.some(
      (leg) =>
        leg.eventId === event.id &&
        leg.market === "spreads" &&
        leg.selection === teamName &&
        leg.point === point &&
        leg.bookmaker === selectedBookmaker,
    )
  }

  // Check if a total bet is already in the parlay
  const isTotalSelected = (isOver: boolean, point: number) => {
    return parlayLegs.some(
      (leg) =>
        leg.eventId === event.id &&
        leg.market === "totals" &&
        leg.selection === (isOver ? "Over" : "Under") &&
        leg.point === point &&
        leg.bookmaker === selectedBookmaker,
    )
  }

  const homeMoneyline = getMoneylineOdds(event.home_team)
  const awayMoneyline = getMoneylineOdds(event.away_team)
  const homeSpread = getSpreadData(event.home_team)
  const awaySpread = getSpreadData(event.away_team)
  const overTotal = getTotalData(true)
  const underTotal = getTotalData(false)

  // Check if bets are already selected
  const isAwayMoneylineSelected = isMoneylineSelected(event.away_team)
  const isHomeMoneylineSelected = isMoneylineSelected(event.home_team)
  const isAwaySpreadSelected = isSpreadSelected(event.away_team, awaySpread?.point || 0)
  const isHomeSpreadSelected = isSpreadSelected(event.home_team, homeSpread?.point || 0)
  const isOverTotalSelected = isTotalSelected(true, overTotal?.point || 0)
  const isUnderTotalSelected = isTotalSelected(false, underTotal?.point || 0)

  // If no odds data is available yet, show loading state
  if (!eventOdds) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 bg-muted/30">
          <div className="flex justify-between items-center">
            <div className="text-base flex items-center gap-2">
              {sport === "baseball_mlb" && <Badge variant="outline">MLB</Badge>}
              {sport === "basketball_nba" && <Badge variant="outline">NBA</Badge>}
              {sport === "americanfootball_nfl" && <Badge variant="outline">NFL</Badge>}
              {sport === "icehockey_nhl" && <Badge variant="outline">NHL</Badge>}
              <span>Loading...</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="h-24 flex items-center justify-center">
            <div className="animate-pulse">Loading odds data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If no bookmaker is selected or the selected bookmaker doesn't have odds for this event
  if (!selectedBookmaker || !bookmakerData) {
    return (
      <Card className="overflow-hidden bg-white">
        <div className="px-4 py-2.5 flex items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <span className="font-medium text-sm">{sport === "basketball_nba" ? "NBA" : sport.toUpperCase()}</span>
            <span className="text-sm text-muted-foreground">{formatDate(event.commence_time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-xs"
              onClick={() => setPlayerPropsOpen(true)}
            >
              <Users className="h-3 w-3" />
              Player Props
            </Button>
            <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4">
              Alt
            </Badge>
            {dataSource && (
              <Badge variant="outline" className="text-xs font-normal">
                {dataSource === "cache" ? "CACHED" : "API"}
              </Badge>
            )}
          </div>
        </div>
        <div className="p-6 text-center text-muted-foreground">
          {!selectedBookmaker
            ? "Please select a sportsbook to view odds"
            : `No odds available from ${selectedBookmaker.toUpperCase()} for this event`}
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden bg-white">
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm">{sport === "basketball_nba" ? "NBA" : sport.toUpperCase()}</span>
          <span className="text-sm text-muted-foreground">{formatDate(event.commence_time)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-xs"
            onClick={() => setPlayerPropsOpen(true)}
          >
            <Users className="h-3 w-3" />
            Player Props
          </Button>
          {selectedBookmaker && (
            <Badge variant="secondary" className="text-xs font-normal">
              {selectedBookmaker.toUpperCase()}
            </Badge>
          )}
          {dataSource && (
            <Badge variant="outline" className="text-xs font-normal">
              {dataSource === "cache" ? "CACHED" : "API"}
            </Badge>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-[1.5fr,1fr,1fr,1fr] gap-px bg-muted/10">
        {/* Teams column */}
        <div className="bg-background p-4 flex flex-col">
          <div className="text-xs font-medium text-muted-foreground mb-3">TEAMS</div>
          <div className="flex-1 flex flex-col justify-center space-y-6">
            <div className="text-sm">{event.away_team}</div>
            <div className="text-sm">{event.home_team}</div>
          </div>
        </div>

        {/* Spread column */}
        <div className="bg-background p-4">
          <div className="text-xs font-medium text-muted-foreground mb-3">SPREAD</div>
          <div className="space-y-4">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-between h-8 font-normal hover:bg-muted/5",
                isAwaySpreadSelected && "ring-1 ring-primary",
              )}
              onClick={() =>
                awaySpread && onAddToParlaySpread(event.id, event.away_team, awaySpread.point, awaySpread.price)
              }
              disabled={!awaySpread}
            >
              <span className="text-xs">
                {awaySpread ? `${awaySpread.point > 0 ? "+" : ""}${awaySpread.point}` : "N/A"}
              </span>
              <span
                className={cn(
                  "text-xs",
                  awaySpread?.price && awaySpread.price > 0 ? "text-emerald-600" : "text-red-600",
                )}
              >
                {awaySpread ? formatOdds(awaySpread.price) : "N/A"}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-between h-8 font-normal hover:bg-muted/5",
                isHomeSpreadSelected && "ring-1 ring-primary",
              )}
              onClick={() =>
                homeSpread && onAddToParlaySpread(event.id, event.home_team, homeSpread.point, homeSpread.price)
              }
              disabled={!homeSpread}
            >
              <span className="text-xs">
                {homeSpread ? `${homeSpread.point > 0 ? "+" : ""}${homeSpread.point}` : "N/A"}
              </span>
              <span
                className={cn(
                  "text-xs",
                  homeSpread?.price && homeSpread.price > 0 ? "text-emerald-600" : "text-red-600",
                )}
              >
                {homeSpread ? formatOdds(homeSpread.price) : "N/A"}
              </span>
            </Button>
          </div>
        </div>

        {/* Total column */}
        <div className="bg-background p-4">
          <div className="text-xs font-medium text-muted-foreground mb-3">TOTAL</div>
          <div className="space-y-4">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-between h-8 font-normal hover:bg-muted/5",
                isOverTotalSelected && "ring-1 ring-primary",
              )}
              onClick={() => overTotal && onAddToParlayTotal(event.id, true, overTotal.point)}
              disabled={!overTotal}
            >
              <span className="text-xs">O {overTotal?.point || "N/A"}</span>
              <span
                className={cn("text-xs", overTotal?.price && overTotal.price > 0 ? "text-emerald-600" : "text-red-600")}
              >
                {overTotal ? formatOdds(overTotal.price) : "N/A"}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-between h-8 font-normal hover:bg-muted/5",
                isUnderTotalSelected && "ring-1 ring-primary",
              )}
              onClick={() => underTotal && onAddToParlayTotal(event.id, false, underTotal.point)}
              disabled={!underTotal}
            >
              <span className="text-xs">U {underTotal?.point || "N/A"}</span>
              <span
                className={cn(
                  "text-xs",
                  underTotal?.price && underTotal.price > 0 ? "text-emerald-600" : "text-red-600",
                )}
              >
                {underTotal ? formatOdds(underTotal.price) : "N/A"}
              </span>
            </Button>
          </div>
        </div>

        {/* Moneyline column */}
        <div className="bg-background p-4">
          <div className="text-xs font-medium text-muted-foreground mb-3">MONEYLINE</div>
          <div className="space-y-4">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-center h-8 font-normal hover:bg-muted/5",
                isAwayMoneylineSelected && "ring-1 ring-primary",
              )}
              onClick={() => onAddToParlayMoneyline(event.id, event.away_team, false)}
              disabled={!awayMoneyline}
            >
              <span className={cn("text-xs", awayMoneyline && awayMoneyline > 0 ? "text-emerald-600" : "text-red-600")}>
                {awayMoneyline ? formatOdds(awayMoneyline) : "N/A"}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-center h-8 font-normal hover:bg-muted/5",
                isHomeMoneylineSelected && "ring-1 ring-primary",
              )}
              onClick={() => onAddToParlayMoneyline(event.id, event.home_team, true)}
              disabled={!homeMoneyline}
            >
              <span className={cn("text-xs", homeMoneyline && homeMoneyline > 0 ? "text-emerald-600" : "text-red-600")}>
                {homeMoneyline ? formatOdds(homeMoneyline) : "N/A"}
              </span>
            </Button>
          </div>
        </div>
      </div>
      <PlayerPropsModal
        open={playerPropsOpen}
        onOpenChange={setPlayerPropsOpen}
        event={{
          ...event,
          sport_key: event.sport_key as SportKey,
        }}
        selectedBookmaker={selectedBookmaker}
        parlayLegs={parlayLegs}
        onAddToParlayPlayerProp={onAddToParlayPlayerProp}
      />
    </Card>
  )
}

