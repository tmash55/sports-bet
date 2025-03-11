"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import type { SportKey, BookmakerKey } from "@/lib/constants/odds-api"
import { type ParlayLeg, formatOdds } from "@/lib/utils/parlay-utils"
import { cn } from "@/lib/utils"

interface EventCardProps {
  event: {
    id: string
    sport_key: string
    commence_time: string
    home_team: string
    away_team: string
  }
  sport: SportKey
  parlayLegs: ParlayLeg[] // Add this to check for selected bets
  onAddToParlayMoneyline: (eventId: string, teamName: string, isHome: boolean) => void
  onAddToParlaySpread: (eventId: string, teamName: string, point: number, price: number) => void
  onAddToParlayTotal: (eventId: string, isOver: boolean, point: number) => void
}

export function EventCard({
  event,
  sport,
  parlayLegs,
  onAddToParlayMoneyline,
  onAddToParlaySpread,
  onAddToParlayTotal,
}: EventCardProps) {
  const [eventOdds, setEventOdds] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedBookmaker, setSelectedBookmaker] = useState<BookmakerKey | null>(null)

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "MMM d, yyyy h:mm a")
  }

  // Fetch odds for this event
  useEffect(() => {
    const fetchEventOdds = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/event-odds?sport=${sport}&eventId=${event.id}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch odds data")
        }

        const data = await response.json()
        setEventOdds(data)

        // Set default bookmaker
        if (data.bookmakers && data.bookmakers.length > 0) {
          setSelectedBookmaker(data.bookmakers[0].key as BookmakerKey)
        }
      } catch (error) {
        console.error("Error fetching event odds:", error)
        setError("Failed to load odds")
      } finally {
        setLoading(false)
      }
    }

    fetchEventOdds()
  }, [event.id, sport])

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
    return parlayLegs.some((leg) => leg.eventId === event.id && leg.market === "h2h" && leg.selection === teamName)
  }

  // Check if a spread bet is already in the parlay
  const isSpreadSelected = (teamName: string, point: number) => {
    return parlayLegs.some(
      (leg) =>
        leg.eventId === event.id && leg.market === "spreads" && leg.selection === teamName && leg.point === point,
    )
  }

  // Check if a total bet is already in the parlay
  const isTotalSelected = (isOver: boolean, point: number) => {
    return parlayLegs.some(
      (leg) =>
        leg.eventId === event.id &&
        leg.market === "totals" &&
        leg.selection === (isOver ? "Over" : "Under") &&
        leg.point === point,
    )
  }

  const homeMoneyline = getMoneylineOdds(event.home_team)
  const awayMoneyline = getMoneylineOdds(event.away_team)
  const homeSpread = getSpreadData(event.home_team)
  const awaySpread = getSpreadData(event.away_team)
  const overTotal = getTotalData(true)
  const underTotal = getTotalData(false)

  // Check if selections are in parlay
  const isAwayMoneylineSelected = isMoneylineSelected(event.away_team)
  const isHomeMoneylineSelected = isMoneylineSelected(event.home_team)
  const isAwaySpreadSelected = awaySpread ? isSpreadSelected(event.away_team, awaySpread.point) : false
  const isHomeSpreadSelected = homeSpread ? isSpreadSelected(event.home_team, homeSpread.point) : false
  const isOverTotalSelected = overTotal ? isTotalSelected(true, overTotal.point) : false
  const isUnderTotalSelected = underTotal ? isTotalSelected(false, underTotal.point) : false

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-between">
          <span>
            {event.away_team} @ {event.home_team}
          </span>
          <span className="text-sm text-muted-foreground">{formatDate(event.commence_time)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {/* Team columns */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Moneyline</div>
              <div className="grid grid-cols-1 gap-1">
                <Button
                  variant={isAwayMoneylineSelected ? "default" : "outline"}
                  size="sm"
                  className={cn("justify-between", isAwayMoneylineSelected && "border-2 border-primary")}
                  onClick={() => onAddToParlayMoneyline(event.id, event.away_team, false)}
                  disabled={!awayMoneyline}
                >
                  <span className="text-xs">{event.away_team}</span>
                  <span className="text-xs font-bold">{awayMoneyline ? formatOdds(awayMoneyline) : "N/A"}</span>
                </Button>
                <Button
                  variant={isHomeMoneylineSelected ? "default" : "outline"}
                  size="sm"
                  className={cn("justify-between", isHomeMoneylineSelected && "border-2 border-primary")}
                  onClick={() => onAddToParlayMoneyline(event.id, event.home_team, true)}
                  disabled={!homeMoneyline}
                >
                  <span className="text-xs">{event.home_team}</span>
                  <span className="text-xs font-bold">{homeMoneyline ? formatOdds(homeMoneyline) : "N/A"}</span>
                </Button>
              </div>
            </div>

            {/* Spread column */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Spread</div>
              <div className="grid grid-cols-1 gap-1">
                <Button
                  variant={isAwaySpreadSelected ? "default" : "outline"}
                  size="sm"
                  className={cn("justify-between", isAwaySpreadSelected && "border-2 border-primary")}
                  onClick={() =>
                    awaySpread && onAddToParlaySpread(event.id, event.away_team, awaySpread.point, awaySpread.price)
                  }
                  disabled={!awaySpread}
                >
                  <span className="text-xs">
                    {awaySpread ? `${awaySpread.point > 0 ? "+" : ""}${awaySpread.point}` : "N/A"}
                  </span>
                  <span className="text-xs font-bold">{awaySpread ? formatOdds(awaySpread.price) : "N/A"}</span>
                </Button>
                <Button
                  variant={isHomeSpreadSelected ? "default" : "outline"}
                  size="sm"
                  className={cn("justify-between", isHomeSpreadSelected && "border-2 border-primary")}
                  onClick={() =>
                    homeSpread && onAddToParlaySpread(event.id, event.home_team, homeSpread.point, homeSpread.price)
                  }
                  disabled={!homeSpread}
                >
                  <span className="text-xs">
                    {homeSpread ? `${homeSpread.point > 0 ? "+" : ""}${homeSpread.point}` : "N/A"}
                  </span>
                  <span className="text-xs font-bold">{homeSpread ? formatOdds(homeSpread.price) : "N/A"}</span>
                </Button>
              </div>
            </div>

            {/* Totals column */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Total</div>
              <div className="grid grid-cols-1 gap-1">
                <Button
                  variant={isOverTotalSelected ? "default" : "outline"}
                  size="sm"
                  className={cn("justify-between", isOverTotalSelected && "border-2 border-primary")}
                  onClick={() => overTotal && onAddToParlayTotal(event.id, true, overTotal.point)}
                  disabled={!overTotal}
                >
                  <span className="text-xs">O {overTotal?.point || "N/A"}</span>
                  <span className="text-xs font-bold">{overTotal ? formatOdds(overTotal.price) : "N/A"}</span>
                </Button>
                <Button
                  variant={isUnderTotalSelected ? "default" : "outline"}
                  size="sm"
                  className={cn("justify-between", isUnderTotalSelected && "border-2 border-primary")}
                  onClick={() => underTotal && onAddToParlayTotal(event.id, false, underTotal.point)}
                  disabled={!underTotal}
                >
                  <span className="text-xs">U {underTotal?.point || "N/A"}</span>
                  <span className="text-xs font-bold">{underTotal ? formatOdds(underTotal.price) : "N/A"}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

