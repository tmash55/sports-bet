"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import type { SportKey, BookmakerKey } from "@/lib/constants/odds-api"
import { useEvents, getSportOptions, getMarketsForSport } from "@/lib/hooks/use-odds-api"
import { cn } from "@/lib/utils"

type PlayerPropData = {
  name: string
  bookmakers: {
    [key: string]: {
      over: { price: number; point: number }
      under: { price: number; point: number }
    }
  }
}

// Format odds for display
const formatOdds = (price: number): string => {
  // If the price is already in American format
  if (Number.isInteger(price)) {
    if (price === 1) return "(1)"
    return price > 0 ? `(+${price})` : `(${price})`
  }

  // If we need to convert from decimal to American
  if (price >= 2) {
    return `(+${Math.round((price - 1) * 100)})`
  } else {
    return `(${Math.round(-100 / (price - 1))})`
  }
}

// Helper function to organize props by player
const organizePlayerProps = (propData: any) => {
  if (!propData?.bookmakers) return []

  const playerMap = new Map<string, PlayerPropData>()

  propData.bookmakers.forEach((bookmaker: any) => {
    const market = bookmaker.markets[0] // Assuming we're only looking at one market type
    if (!market) return

    // Group outcomes by player (using description field)
    const playerOutcomes = new Map<string, any[]>()
    market.outcomes.forEach((outcome: any) => {
      const playerName = outcome.description
      if (!playerOutcomes.has(playerName)) {
        playerOutcomes.set(playerName, [])
      }
      playerOutcomes.get(playerName)?.push(outcome)
    })

    // Process each player's outcomes
    playerOutcomes.forEach((outcomes, playerName) => {
      if (!playerMap.has(playerName)) {
        playerMap.set(playerName, {
          name: playerName,
          bookmakers: {},
        })
      }

      const player = playerMap.get(playerName)!
      const overOutcome = outcomes.find((o) => o.name === "Over")
      const underOutcome = outcomes.find((o) => o.name === "Under")

      if (overOutcome && underOutcome) {
        player.bookmakers[bookmaker.key] = {
          over: {
            price: overOutcome.price,
            point: overOutcome.point,
          },
          under: {
            price: underOutcome.price,
            point: underOutcome.point,
          },
        }
      }
    })
  })

  return Array.from(playerMap.values())
}

export default function PlayerPropsExplorer() {
  const [sport, setSport] = useState<SportKey>("basketball_nba")
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedMarket, setSelectedMarket] = useState("player_points")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [highlightMode, setHighlightMode] = useState<"line" | "odds">("line")

  // Fetch events for the selected sport
  const { events, loading: loadingEvents, error: eventsError } = useEvents(sport)

  // Get sport and market options
  const sportOptions = getSportOptions()
  const marketOptions = getMarketsForSport(sport)

  // Set default market when sport changes or when markets are loaded
  useEffect(() => {
    if (marketOptions.length > 0) {
      // Check if current selectedMarket is valid for this sport
      const isMarketValid = marketOptions.some((option) => option.value === selectedMarket)

      if (!isMarketValid) {
        // If not valid, set to the first available market
        setSelectedMarket(marketOptions[0].value)
      }
    }
  }, [sport, marketOptions, selectedMarket])

  // Custom hook for player props with error handling
  const usePlayerPropsWithErrorHandling = (sportKey: SportKey, eventId: string | null, markets: string[]) => {
    const [propData, setPropData] = useState<any | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      if (!eventId) return

      const fetchPlayerProps = async () => {
        setLoading(true)
        setError(null)
        setErrorMessage(null)

        try {
          const response = await fetch(
            `/api/player-props?sport=${sportKey}&eventId=${eventId}&markets=${markets.join(",")}&oddsFormat=american`,
          )

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to fetch player props")
          }

          const data = await response.json()
          setPropData(data)
        } catch (err) {
          const errorMsg = (err as Error).message
          setError(errorMsg)
          setErrorMessage(errorMsg)
          console.error("Error fetching player props:", err)
        } finally {
          setLoading(false)
        }
      }

      fetchPlayerProps()
    }, [sportKey, eventId, markets.join(",")])

    return { propData, loading, error }
  }

  // Use our custom hook
  const {
    propData,
    loading: loadingProps,
    error: propsError,
  } = usePlayerPropsWithErrorHandling(sport, selectedEventId, [selectedMarket])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "MMM d, yyyy h:mm a")
  }

  // Get selected event
  const selectedEvent = events.find((event) => event.id === selectedEventId)

  // Handle sport change
  const handleSportChange = (newSport: string) => {
    setSport(newSport as SportKey)
    setSelectedEventId(null)
    setErrorMessage(null)

    // Reset selected market to a valid one for the new sport
    const newMarketOptions = getMarketsForSport(newSport as SportKey)
    if (newMarketOptions.length > 0) {
      setSelectedMarket(newMarketOptions[0].value)
    }
  }

  // Handle market change
  const handleMarketChange = (newMarket: string) => {
    setSelectedMarket(newMarket)
    setErrorMessage(null)
  }

  const players = organizePlayerProps(propData)
  const bookmakers = propData?.bookmakers?.map((b: any) => b.key) || []

  // Find the best lines and odds for each player
  const findBestValues = (players: PlayerPropData[]) => {
    const bestValues: Record<
      string,
      {
        bestOverLine: { value: number; bookies: Set<string> }
        bestUnderLine: { value: number; bookies: Set<string> }
        bestOverOdds: { value: number; bookies: Set<string> }
        bestUnderOdds: { value: number; bookies: Set<string> }
      }
    > = {}

    players.forEach((player) => {
      const playerName = player.name

      // Initialize with default values
      bestValues[playerName] = {
        bestOverLine: { value: Number.POSITIVE_INFINITY, bookies: new Set() },
        bestUnderLine: { value: Number.NEGATIVE_INFINITY, bookies: new Set() },
        bestOverOdds: { value: Number.NEGATIVE_INFINITY, bookies: new Set() },
        bestUnderOdds: { value: Number.NEGATIVE_INFINITY, bookies: new Set() },
      }

      // Collect all lines and odds for this player
      Object.entries(player.bookmakers).forEach(([bookie, data]) => {
        const { over, under } = data

        // For OVER bets: Lower line is better (e.g., over 16.5 is better than over 17.5)
        if (over.point < bestValues[playerName].bestOverLine.value) {
          bestValues[playerName].bestOverLine.value = over.point
          bestValues[playerName].bestOverLine.bookies = new Set([bookie])
        } else if (over.point === bestValues[playerName].bestOverLine.value) {
          bestValues[playerName].bestOverLine.bookies.add(bookie)
        }

        // For UNDER bets: Higher line is better (e.g., under 17.5 is better than under 16.5)
        if (under.point > bestValues[playerName].bestUnderLine.value) {
          bestValues[playerName].bestUnderLine.value = under.point
          bestValues[playerName].bestUnderLine.bookies = new Set([bookie])
        } else if (under.point === bestValues[playerName].bestUnderLine.value) {
          bestValues[playerName].bestUnderLine.bookies.add(bookie)
        }

        // For odds: Higher American odds are always better
        if (over.price > bestValues[playerName].bestOverOdds.value) {
          bestValues[playerName].bestOverOdds.value = over.price
          bestValues[playerName].bestOverOdds.bookies = new Set([bookie])
        } else if (over.price === bestValues[playerName].bestOverOdds.value) {
          bestValues[playerName].bestOverOdds.bookies.add(bookie)
        }

        if (under.price > bestValues[playerName].bestUnderOdds.value) {
          bestValues[playerName].bestUnderOdds.value = under.price
          bestValues[playerName].bestUnderOdds.bookies = new Set([bookie])
        } else if (under.price === bestValues[playerName].bestUnderOdds.value) {
          bestValues[playerName].bestUnderOdds.bookies.add(bookie)
        }
      })
    })

    return bestValues
  }

  const bestValues = findBestValues(players)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Player Props Explorer</CardTitle>
        <CardDescription>Compare player props across different sportsbooks</CardDescription>

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
        {loadingEvents ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : eventsError ? (
          <div className="text-red-500 py-4">{eventsError}</div>
        ) : events.length === 0 ? (
          <div className="py-4">No upcoming events found for the selected sport.</div>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Game</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id} className={selectedEventId === event.id ? "bg-muted" : ""}>
                      <TableCell>
                        {event.away_team} @ {event.home_team}
                      </TableCell>
                      <TableCell>{formatDate(event.commence_time)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={selectedEventId === event.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedEventId(event.id)}
                        >
                          View Props
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {selectedEvent && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {selectedEvent.away_team} @ {selectedEvent.home_team}
                  </h3>
                  <div className="w-1/3">
                    <Select value={selectedMarket} onValueChange={handleMarketChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Market" />
                      </SelectTrigger>
                      <SelectContent>
                        {marketOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    <p className="font-medium">Error loading props</p>
                    <p className="text-sm">{errorMessage}</p>
                    <p className="text-sm mt-2">This market may not be available for this game or sport.</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-100 rounded"></div>
                        <span>Best Over Line</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-100 rounded"></div>
                        <span>Best Under Line</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Highlight:</span>
                    <div className="flex">
                      <Button
                        variant={highlightMode === "line" ? "default" : "outline"}
                        size="sm"
                        className="rounded-r-none"
                        onClick={() => setHighlightMode("line")}
                      >
                        Best Lines
                      </Button>
                      <Button
                        variant={highlightMode === "odds" ? "default" : "outline"}
                        size="sm"
                        className="rounded-l-none"
                        onClick={() => setHighlightMode("odds")}
                      >
                        Best Odds
                      </Button>
                    </div>
                  </div>
                </div>

                {loadingProps ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : propsError && !errorMessage ? (
                  <div className="text-red-500 py-4">{propsError}</div>
                ) : players.length > 0 ? (
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player</TableHead>
                          {bookmakers.map((bookie: BookmakerKey) => (
                            <TableHead key={bookie} className="text-center">
                              {bookie.toUpperCase()}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {players.map((player) => (
                          <TableRow key={player.name}>
                            <TableCell className="font-medium">{player.name}</TableCell>
                            {bookmakers.map((bookie: BookmakerKey) => (
                              <TableCell key={bookie} className="text-center p-0">
                                {player.bookmakers[bookie] ? (
                                  <div className="space-y-0">
                                    <div
                                      className={cn(
                                        "py-2 px-3 font-medium",
                                        highlightMode === "line" &&
                                          bestValues[player.name]?.bestOverLine.bookies.has(bookie) &&
                                          "bg-green-100",
                                        highlightMode === "odds" &&
                                          bestValues[player.name]?.bestOverOdds.bookies.has(bookie) &&
                                          "bg-green-100",
                                      )}
                                    >
                                      O {player.bookmakers[bookie].over.point}
                                      <span className="text-sm text-muted-foreground ml-1">
                                        {formatOdds(player.bookmakers[bookie].over.price)}
                                      </span>
                                    </div>
                                    <div
                                      className={cn(
                                        "py-2 px-3 font-medium border-t",
                                        highlightMode === "line" &&
                                          bestValues[player.name]?.bestUnderLine.bookies.has(bookie) &&
                                          "bg-blue-100",
                                        highlightMode === "odds" &&
                                          bestValues[player.name]?.bestUnderOdds.bookies.has(bookie) &&
                                          "bg-blue-100",
                                      )}
                                    >
                                      U {player.bookmakers[bookie].under.point}
                                      <span className="text-sm text-muted-foreground ml-1">
                                        {formatOdds(player.bookmakers[bookie].under.price)}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground p-3 block">N/A</span>
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : !errorMessage ? (
                  <div className="py-4 text-center">No player props available for this game and market.</div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

