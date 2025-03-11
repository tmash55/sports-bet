"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import type { SportKey, BookmakerKey } from "@/lib/constants/odds-api"
import { useEvents, getSportOptions } from "@/lib/hooks/use-odds-api"
import { ParlayDrawer } from "./parlay-drawer"
import { EventCard } from "./event-card"
import { type ParlayLeg, DEFAULT_BOOKMAKERS } from "@/lib/utils/parlay-utils"

export default function ParlayBuilder() {
  const [sport, setSport] = useState<SportKey>("basketball_nba")
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([])
  const [availableBookmakers, setAvailableBookmakers] = useState<BookmakerKey[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch events for the selected sport
  const { events, loading: loadingEvents, error: eventsError } = useEvents(sport)

  // Get sport options
  const sportOptions = getSportOptions()

  // Handle sport change
  const handleSportChange = (newSport: string) => {
    setSport(newSport as SportKey)
  }

  // Check for conflicting bets and remove them
  const removeConflictingBets = (eventId: string, market: string, selection: string, point?: number): ParlayLeg[] => {
    // Get the current event details
    const event = events.find((e) => e.id === eventId)
    if (!event) return parlayLegs

    // Find any conflicting legs to remove
    const conflictingLegs = parlayLegs.filter((leg) => {
      // Same event but different selection
      if (leg.eventId !== eventId) return false

      // For moneyline, any other team selection from the same game is conflicting
      if (market === "h2h" && leg.market === "h2h" && leg.selection !== selection) {
        return true
      }

      // For spreads, the opposite team's spread is conflicting
      if (market === "spreads" && leg.market === "spreads") {
        const oppositeTeam = selection === event.home_team ? event.away_team : event.home_team
        return leg.selection === oppositeTeam
      }

      // For totals, the opposite bet (over/under) on the same point is conflicting
      if (market === "totals" && leg.market === "totals") {
        const isOver = selection === "Over"
        return (isOver && leg.selection === "Under") || (!isOver && leg.selection === "Over")
      }

      return false
    })

    // If we found conflicting legs, notify the user
    if (conflictingLegs.length > 0) {
      const conflictingBets = conflictingLegs.map((leg) => leg.selectionDisplayName).join(", ")
      toast({
        title: "Conflicting bet removed",
        description: `Removed conflicting bet: ${conflictingBets}`,
        duration: 3000,
      })

      // Return the legs with conflicts removed
      return parlayLegs.filter((leg) => !conflictingLegs.includes(leg))
    }

    // No conflicts found
    return parlayLegs
  }

  // Fetch event odds
  const fetchEventOdds = async (eventId: string) => {
    try {
      const response = await fetch(`/api/event-odds?sport=${sport}&eventId=${eventId}`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        throw new Error(errorData.error || "Failed to fetch odds data")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching event odds:", error)
      setErrorMessage("Failed to load odds data")
      return null
    }
  }

  // Update the list of available bookmakers
  const updateAvailableBookmakers = (bookmakers: any[]) => {
    if (!bookmakers || bookmakers.length === 0) return

    const bookmakerKeys = bookmakers.map((b) => b.key as BookmakerKey)

    setAvailableBookmakers((prev) => {
      // Create a Set and then convert back to array to remove duplicates
      const uniqueBookmakers = Array.from(new Set([...prev, ...bookmakerKeys]))

      // Sort by our preferred order
      return uniqueBookmakers.sort((a, b) => {
        const indexA = DEFAULT_BOOKMAKERS.indexOf(a)
        const indexB = DEFAULT_BOOKMAKERS.indexOf(b)
        if (indexA === -1 && indexB === -1) return 0
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })
    })
  }

  // Add moneyline bet to parlay
  const addToParlayMoneyline = (eventId: string, teamName: string, isHome: boolean) => {
    // Check if this bet is already in the parlay
    const existingLeg = parlayLegs.find(
      (leg) => leg.eventId === eventId && leg.market === "h2h" && leg.selection === teamName,
    )

    // If it exists, remove it (toggle behavior)
    if (existingLeg) {
      setParlayLegs((prev) => prev.filter((leg) => leg.id !== existingLeg.id))
      return
    }

    // Check for and remove conflicting bets
    const updatedLegs = removeConflictingBets(eventId, "h2h", teamName)

    const selectedEvent = events.find((e) => e.id === eventId)
    if (!selectedEvent) return

    // Create a unique ID for this leg
    const legId = `${eventId}-${teamName}-ml-${Date.now()}`

    // Fetch odds for this specific event
    fetchEventOdds(eventId).then((eventOdds) => {
      if (!eventOdds) return

      // Create odds object for each bookmaker with proper initialization
      const oddsObj: Record<BookmakerKey, number> = {} as Record<BookmakerKey, number>

      eventOdds.bookmakers.forEach((bookmaker: any) => {
        const moneylineMarket = bookmaker.markets.find((m: any) => m.key === "h2h")
        if (moneylineMarket) {
          const outcome = moneylineMarket.outcomes.find((o: any) => o.name === teamName)
          if (outcome) {
            oddsObj[bookmaker.key as BookmakerKey] = outcome.price
          }
        }
      })

      // Update available bookmakers
      updateAvailableBookmakers(eventOdds.bookmakers)

      const newLeg: ParlayLeg = {
        id: legId,
        sport,
        eventId,
        eventName: `${selectedEvent.away_team} @ ${selectedEvent.home_team}`,
        market: "h2h",
        marketDisplayName: "Moneyline",
        selection: teamName,
        selectionDisplayName: `${teamName} ML`,
        type: "moneyline",
        odds: oddsObj,
      }

      setParlayLegs([...updatedLegs, newLeg])
    })
  }

  // Add spread bet to parlay
  const addToParlaySpread = (eventId: string, teamName: string, point: number, price: number) => {
    // Check if this bet is already in the parlay
    const existingLeg = parlayLegs.find(
      (leg) => leg.eventId === eventId && leg.market === "spreads" && leg.selection === teamName && leg.point === point,
    )

    // If it exists, remove it (toggle behavior)
    if (existingLeg) {
      setParlayLegs((prev) => prev.filter((leg) => leg.id !== existingLeg.id))
      return
    }

    // Check for and remove conflicting bets
    const updatedLegs = removeConflictingBets(eventId, "spreads", teamName, point)

    const selectedEvent = events.find((e) => e.id === eventId)
    if (!selectedEvent) return

    // Create a unique ID for this leg
    const legId = `${eventId}-${teamName}-spread-${Date.now()}`

    // Fetch odds for this specific event
    fetchEventOdds(eventId).then((eventOdds) => {
      if (!eventOdds) return

      // Create odds object for each bookmaker
      const oddsObj: Record<BookmakerKey, number> = {} as Record<BookmakerKey, number>
      const pointsObj: Record<BookmakerKey, number> = {} as Record<BookmakerKey, number>

      eventOdds.bookmakers.forEach((bookmaker: any) => {
        const spreadsMarket = bookmaker.markets.find((m: any) => m.key === "spreads")
        if (spreadsMarket) {
          const outcome = spreadsMarket.outcomes.find((o: any) => o.name === teamName)
          if (outcome) {
            oddsObj[bookmaker.key as BookmakerKey] = outcome.price
            pointsObj[bookmaker.key as BookmakerKey] = outcome.point
          }
        }
      })

      // Update available bookmakers
      updateAvailableBookmakers(eventOdds.bookmakers)

      const newLeg: ParlayLeg = {
        id: legId,
        sport,
        eventId,
        eventName: `${selectedEvent.away_team} @ ${selectedEvent.home_team}`,
        market: "spreads",
        marketDisplayName: "Spread",
        selection: teamName,
        selectionDisplayName: `${teamName} ${point > 0 ? "+" : ""}${point}`,
        type: "spread",
        odds: oddsObj,
        point,
      }

      setParlayLegs([...updatedLegs, newLeg])
    })
  }

  // Add total bet to parlay
  const addToParlayTotal = (eventId: string, isOver: boolean, point: number) => {
    const selection = isOver ? "Over" : "Under"

    // Check if this bet is already in the parlay
    const existingLeg = parlayLegs.find(
      (leg) => leg.eventId === eventId && leg.market === "totals" && leg.selection === selection && leg.point === point,
    )

    // If it exists, remove it (toggle behavior)
    if (existingLeg) {
      setParlayLegs((prev) => prev.filter((leg) => leg.id !== existingLeg.id))
      return
    }

    // Check for and remove conflicting bets
    const updatedLegs = removeConflictingBets(eventId, "totals", selection, point)

    const selectedEvent = events.find((e) => e.id === eventId)
    if (!selectedEvent) return

    // Create a unique ID for this leg
    const legId = `${eventId}-${isOver ? "over" : "under"}-${Date.now()}`

    // Fetch odds for this specific event
  }

  // Remove a leg from the parlay
  const removeLeg = (legId: string) => {
    setParlayLegs((prev) => prev.filter((leg) => leg.id !== legId))
  }

  // Clear the entire parlay
  const clearParlay = () => {
    setParlayLegs([])
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Parlay Builder & Odds Comparison</CardTitle>
        <CardDescription>Build your parlay and compare odds across sportsbooks</CardDescription>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="w-full sm:w-1/3">
            <label className="text-sm font-medium mb-1 block">Sport</label>
            <Select value={sport} onValueChange={handleSportChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Sport" />
              </SelectTrigger>
              <SelectContent>
                {sportOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Events Grid */}
          {loadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : eventsError ? (
            <div className="text-red-500 py-4">{eventsError}</div>
          ) : events.length === 0 ? (
            <div className="py-4 text-center">No upcoming events found for the selected sport.</div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Games</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      sport={sport}
                      parlayLegs={parlayLegs} // Pass the parlayLegs to check for selected bets
                      onAddToParlayMoneyline={addToParlayMoneyline}
                      onAddToParlaySpread={addToParlaySpread}
                      onAddToParlayTotal={addToParlayTotal}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="today" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events
                    .filter((event) => {
                      const today = new Date()
                      const eventDate = new Date(event.commence_time)
                      return (
                        eventDate.getDate() === today.getDate() &&
                        eventDate.getMonth() === today.getMonth() &&
                        eventDate.getFullYear() === today.getFullYear()
                      )
                    })
                    .map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        sport={sport}
                        parlayLegs={parlayLegs} // Pass the parlayLegs to check for selected bets
                        onAddToParlayMoneyline={addToParlayMoneyline}
                        onAddToParlaySpread={addToParlaySpread}
                        onAddToParlayTotal={addToParlayTotal}
                      />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="tomorrow" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events
                    .filter((event) => {
                      const tomorrow = new Date()
                      tomorrow.setDate(tomorrow.getDate() + 1)
                      const eventDate = new Date(event.commence_time)
                      return (
                        eventDate.getDate() === tomorrow.getDate() &&
                        eventDate.getMonth() === tomorrow.getMonth() &&
                        eventDate.getFullYear() === tomorrow.getFullYear()
                      )
                    })
                    .map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        sport={sport}
                        parlayLegs={parlayLegs} // Pass the parlayLegs to check for selected bets
                        onAddToParlayMoneyline={addToParlayMoneyline}
                        onAddToParlaySpread={addToParlaySpread}
                        onAddToParlayTotal={addToParlayTotal}
                      />
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>

      {/* Parlay Drawer */}
      <ParlayDrawer
        parlayLegs={parlayLegs}
        availableBookmakers={availableBookmakers}
        onRemoveLeg={removeLeg}
        onClearParlay={clearParlay}
      />
    </Card>
  )
}

