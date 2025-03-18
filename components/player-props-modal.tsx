"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, SortAsc, RefreshCw, Info, Filter, ArrowUpDown } from "lucide-react"
import type { SportKey, BookmakerKey } from "@/lib/constants/odds-api"
import { PLAYER_MARKETS, MARKET_INFO } from "@/lib/constants/odds-api"
import type { ParlayLeg } from "@/lib/utils/parlay-utils"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Define types for the player props data
interface PlayerLine {
  point: number
  over: { price: number; point: number } | null
  under: { price: number; point: number } | null
  isAlternate?: boolean
}

interface BookmakerData {
  standardLine: {
    over: { price: number; point: number } | null
    under: { price: number; point: number } | null
  } | null
  alternateLines: PlayerLine[]
  lines?: PlayerLine[] // For backward compatibility
}

interface PlayerData {
  name: string
  bookmakers: Record<string, BookmakerData>
}

interface PlayerPropsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: {
    id: string
    sport_key: string
    home_team: string
    away_team: string
  }
  selectedBookmaker: BookmakerKey | null
  parlayLegs: ParlayLeg[]
  onAddToParlayPlayerProp: (
    eventId: string,
    playerName: string,
    market: string,
    isOver: boolean,
    point: number,
    price: number,
    bookmaker?: string,
  ) => void
}

export function PlayerPropsModal({
  open,
  onOpenChange,
  event,
  selectedBookmaker,
  parlayLegs,
  onAddToParlayPlayerProp,
}: PlayerPropsModalProps) {
  const [activeMarket, setActiveMarket] = useState<string>("player_points")
  const [viewMode, setViewMode] = useState<"standard" | "alternate" | "compare">("standard")
  const [playerProps, setPlayerProps] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [tabLoading, setTabLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<"cache" | "api" | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "point">("name")
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  // Get available markets for the sport
  const getAvailableMarkets = () => {
    if (!event?.sport_key) return []

    const sportKey = event.sport_key as SportKey
    if (sportKey in PLAYER_MARKETS) {
      // Filter out alternate markets from the tabs
      const markets = Object.values(PLAYER_MARKETS[sportKey as keyof typeof PLAYER_MARKETS]).filter(
        (market) => !market.endsWith("_alternate"),
      )

      return markets.map((market) => ({
        value: market,
        label: MARKET_INFO[market as keyof typeof MARKET_INFO]?.name || market,
      }))
    }
    return []
  }

  const availableMarkets = getAvailableMarkets()

  // Get the alternate market for a given market
  const getAlternateMarket = (market: string): string | null => {
    const alternateMarket = `${market}_alternate`

    const sportKey = event.sport_key as SportKey
    if (sportKey in PLAYER_MARKETS) {
      const markets = Object.values(PLAYER_MARKETS[sportKey as keyof typeof PLAYER_MARKETS])
      if (markets.includes(alternateMarket as any)) {
        return alternateMarket
      }
    }

    return null
  }

  // Fetch player props when the modal is opened and market changes
  useEffect(() => {
    if (!open || !event?.id || !activeMarket) return

    const fetchPlayerProps = async () => {
      setTabLoading(true)
      setLoading(true)
      setError(null)

      try {
        // Check if there's an alternate market available
        const alternateMarket = getAlternateMarket(activeMarket)

        // When in alternate or compare view and alternate market exists, fetch both
        const marketsToFetch =
          (viewMode === "alternate" || viewMode === "compare") && alternateMarket
            ? [activeMarket, alternateMarket]
            : activeMarket

        // Add cache-busting parameter and ensure fresh data
        const response = await fetch(
          `/api/player-props?sport=${event.sport_key}&eventId=${event.id}&markets=${Array.isArray(marketsToFetch) ? marketsToFetch.join(",") : marketsToFetch}&refresh=true&_=${Date.now()}`,
          { cache: "no-store" },
        )

        if (!response.ok) {
          throw new Error("Failed to fetch player props")
        }

        const data = await response.json()
        setPlayerProps(data.data)
        setDataSource(data.source || "api")
      } catch (err) {
        console.error("Error fetching player props:", err)
        setError("Failed to load player props data")
      } finally {
        setTabLoading(false)
        setLoading(false)
      }
    }

    // Fetch data immediately when modal opens
    fetchPlayerProps()
  }, [open, event?.id, event?.sport_key, activeMarket, viewMode])

  // Initial loading state when modal opens
  useEffect(() => {
    if (open && !playerProps) {
      setLoading(true)
    } else {
      setLoading(false)
    }
  }, [open, playerProps])

  // Get available bookmakers from the data
  const availableBookmakers = useMemo(() => {
    if (!playerProps?.bookmakers) return []

    return playerProps.bookmakers.map((bookmaker: any) => ({
      key: bookmaker.key,
      title: bookmaker.title,
    }))
  }, [playerProps])

  // Organize player props by player with alternate lines
  const organizePlayerProps = () => {
    if (!playerProps?.bookmakers) return []

    const playerMap = new Map<string, PlayerData>()

    playerProps.bookmakers.forEach((bookmaker: any) => {
      if (viewMode !== "compare" && selectedBookmaker && bookmaker.key !== selectedBookmaker) return

      // Group markets by key (e.g., player_points)
      const marketsByKey = new Map<string, any[]>()

      // Inside the organizePlayerProps function, update the market processing:
      bookmaker.markets.forEach((market: any) => {
        const isAlternate = market.isAlternate === true || market.key.endsWith("_alternate")
        const marketKey = isAlternate ? market.key.replace("_alternate", "") : market.key

        if (marketKey === activeMarket) {
          market.outcomes.forEach((outcome: any) => {
            const playerName = outcome.description
            if (!playerMap.has(playerName)) {
              playerMap.set(playerName, {
                name: playerName,
                bookmakers: {},
              })
            }

            const player = playerMap.get(playerName)!

            if (!player.bookmakers[bookmaker.key]) {
              player.bookmakers[bookmaker.key] = {
                standardLine: null,
                alternateLines: [],
                lines: [], // For backward compatibility
              }
            }

            // Group outcomes by point value
            const point = outcome.point
            const price = outcome.price
            const isOver = outcome.name === "Over"

            // Create a line object
            const line: PlayerLine = {
              point,
              over: isOver ? { price, point } : null,
              under: !isOver ? { price, point } : null,
              isAlternate,
            }

            // Add to alternateLines if it's an alternate line
            if (isAlternate) {
              player.bookmakers[bookmaker.key].alternateLines.push(line)
            } else {
              // Set as standard line
              if (!player.bookmakers[bookmaker.key].standardLine) {
                player.bookmakers[bookmaker.key].standardLine = {
                  over: null,
                  under: null,
                }
              }

              if (isOver) {
                player.bookmakers[bookmaker.key].standardLine!.over = { price, point }
              } else {
                player.bookmakers[bookmaker.key].standardLine!.under = { price, point }
              }
            }

            // Also add to lines array for backward compatibility
            player.bookmakers[bookmaker.key].lines = player.bookmakers[bookmaker.key].lines || []
            player.bookmakers[bookmaker.key].lines.push(line)
          })
        }
      })
    })

    return Array.from(playerMap.values())
  }

  const allPlayers = organizePlayerProps()

  // Filter and sort players
  const players = useMemo(() => {
    let filtered = allPlayers

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      filtered = filtered.filter((player) => player.name.toLowerCase().includes(lowerSearch))
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      } else if (sortBy === "point") {
        // Get the standard line for sorting
        const getStandardPoint = (player: any) => {
          if (viewMode === "compare") {
            // Use the first available bookmaker
            const firstBookmaker = Object.keys(player.bookmakers)[0]
            if (!firstBookmaker) return 0

            const standardLine = player.bookmakers[firstBookmaker]?.standardLine
            return standardLine?.over?.point || standardLine?.under?.point || 0
          } else {
            // Use the selected bookmaker
            const standardLine = player.bookmakers[selectedBookmaker as string]?.standardLine
            return standardLine?.over?.point || standardLine?.under?.point || 0
          }
        }

        const aPoint = getStandardPoint(a)
        const bPoint = getStandardPoint(b)

        return bPoint - aPoint // Sort by point descending
      }
      return 0
    })
  }, [allPlayers, searchTerm, sortBy, selectedBookmaker, viewMode])

  // Check if a player prop is already in the parlay
  const isPlayerPropSelected = (
    playerName: string,
    market: string,
    isOver: boolean,
    point: number,
    bookmaker?: string,
  ) => {
    return parlayLegs.some(
      (leg) =>
        leg.eventId === event.id &&
        leg.market === market &&
        leg.selection === (isOver ? "Over" : "Under") &&
        leg.point === point &&
        leg.selectionDisplayName.includes(playerName) &&
        (!bookmaker || leg.bookmaker === bookmaker),
    )
  }

  // Format odds for display
  const formatOdds = (price: number): string => {
    if (price === 0) return "N/A"
    return price > 0 ? `+${price}` : `${price}`
  }

  // Refresh the current market data
  const handleRefresh = async () => {
    if (!event?.id || !activeMarket) return

    setRefreshing(true)
    setError(null)

    try {
      // Check if there's an alternate market available
      const alternateMarket = getAlternateMarket(activeMarket)

      // If in alternate or compare view and alternate market exists, fetch both
      const marketsToFetch =
        (viewMode === "alternate" || viewMode === "compare") && alternateMarket
          ? `${activeMarket},${alternateMarket}`
          : activeMarket

      // Add a cache-busting parameter
      const response = await fetch(
        `/api/player-props?sport=${event.sport_key}&eventId=${event.id}&markets=${marketsToFetch}&_=${Date.now()}`,
        { cache: "no-store" },
      )

      if (!response.ok) {
        throw new Error("Failed to refresh player props")
      }

      const data = await response.json()
      setPlayerProps(data.data)
      setDataSource(data.source || "api")
    } catch (err) {
      console.error("Error refreshing player props:", err)
      setError("Failed to refresh player props data")
    } finally {
      setRefreshing(false)
    }
  }

  // Get the market display name
  const getMarketDisplayName = (marketKey: string) => {
    return MARKET_INFO[marketKey as keyof typeof MARKET_INFO]?.name || marketKey
  }

  // Find the best odds for a specific point value across bookmakers
  const findBestOdds = (
    player: PlayerData,
    point: number,
    isOver: boolean,
  ): { odds: number | null; bookmaker: string | null } => {
    let bestOdds = Number.NEGATIVE_INFINITY
    let bestBookmaker: string | null = null

    Object.entries(player.bookmakers).forEach(([key, data]: [string, BookmakerData]) => {
      // Check standard line
      if (data.standardLine) {
        const standardPoint = isOver ? data.standardLine.over?.point : data.standardLine.under?.point
        const standardPrice = isOver ? data.standardLine.over?.price : data.standardLine.under?.price

        if (standardPoint === point && standardPrice && standardPrice > bestOdds) {
          bestOdds = standardPrice
          bestBookmaker = key
        }
      }

      // Check alternate lines
      if (data.alternateLines) {
        data.alternateLines.forEach((line) => {
          const linePoint = line.point
          const linePrice = isOver ? line.over?.price : line.under?.price

          if (linePoint === point && linePrice && linePrice > bestOdds) {
            bestOdds = linePrice
            bestBookmaker = key
          }
        })
      }

      // For backward compatibility
      if (data.lines) {
        const matchingLine = data.lines.find((line) => line.point === point)
        if (matchingLine) {
          const odds = isOver ? matchingLine.over?.price : matchingLine.under?.price
          if (odds && odds > bestOdds) {
            bestOdds = odds
            bestBookmaker = key
          }
        }
      }
    })

    return { odds: bestOdds !== Number.NEGATIVE_INFINITY ? bestOdds : null, bookmaker: bestBookmaker }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Player Props</DialogTitle>
            <Badge variant="outline" className="text-xs">
              {event?.away_team} @ {event?.home_team}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Compare player props across different sportsbooks</p>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-3 border-b bg-muted/5 shrink-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Tabs
                value={activeMarket}
                onValueChange={(value) => {
                  setActiveMarket(value)
                  setSearchTerm("")
                  setViewMode("standard")
                  setSelectedPlayer(null)
                }}
                className="w-full sm:w-auto"
              >
                <TabsList className="h-9 overflow-x-auto flex-wrap">
                  {availableMarkets.map((market) => (
                    <TabsTrigger key={market.value} value={market.value} className="px-3 py-1.5 text-xs">
                      {market.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                {dataSource && (
                  <Badge variant={dataSource === "cache" ? "secondary" : "outline"} className="text-xs">
                    {dataSource === "cache" ? "Cached" : "Live"}
                  </Badge>
                )}
                <Button variant="outline" size="sm" className="h-8 px-2" onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  <span className="sr-only">Refresh</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="px-6 py-3 border-b shrink-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={`Search ${getMarketDisplayName(activeMarket)} props...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1"
                  onClick={() => setSortBy(sortBy === "name" ? "point" : "name")}
                >
                  <SortAsc className="h-3.5 w-3.5" />
                  <span className="text-xs">{sortBy === "name" ? "Name" : "Line"}</span>
                </Button>
                <Button
                  variant={viewMode === "standard" ? "default" : "outline"}
                  size="sm"
                  className="h-9 gap-1"
                  onClick={() => setViewMode("standard")}
                >
                  <span className="text-xs">Standard</span>
                </Button>
                <Button
                  variant={viewMode === "alternate" ? "default" : "outline"}
                  size="sm"
                  className="h-9 gap-1"
                  onClick={() => setViewMode("alternate")}
                >
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Alt Lines</span>
                </Button>
                <Button
                  variant={viewMode === "compare" ? "default" : "outline"}
                  size="sm"
                  className="h-9 gap-1"
                  onClick={() => setViewMode("compare")}
                >
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Compare</span>
                </Button>
              </div>
            </div>
          </div>

          {viewMode === "compare" && (
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
          )}

          <ScrollArea className="flex-1 overflow-auto">
            <div className="px-6 py-4">
              {loading || tabLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  <p className="font-medium">Error loading props</p>
                  <p className="text-sm">{error}</p>
                  <p className="text-sm mt-2">This market may not be available for this game or sport.</p>
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                    <Info className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No player props available</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm
                      ? `No players found matching "${searchTerm}"`
                      : "There are no player props available for this market."}
                  </p>
                  {searchTerm && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearchTerm("")}>
                      Clear search
                    </Button>
                  )}
                </div>
              ) : viewMode === "standard" ? (
                // STANDARD VIEW - Show one line per player
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
                              className={cn(
                                "justify-between h-10 font-normal",
                                !overSelected && "hover:border-primary/50",
                              )}
                              onClick={() =>
                                onAddToParlayPlayerProp(
                                  event.id,
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
                              className={cn(
                                "justify-between h-10 font-normal",
                                !underSelected && "hover:border-primary/50",
                              )}
                              onClick={() =>
                                onAddToParlayPlayerProp(
                                  event.id,
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
              ) : viewMode === "alternate" ? (
                // ALTERNATE VIEW - Show all lines grouped by player
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
                          {Object.entries(player.bookmakers).map(([bookmaker, data]: [string, BookmakerData]) => {
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
                                                  event.id,
                                                  player.name,
                                                  activeMarket,
                                                  true,
                                                  line.point,
                                                  line.over.price,
                                                  bookmaker,
                                                )
                                              }
                                            >
                                              <span
                                                className={cn(
                                                  line.over.price > 0 ? "text-emerald-600" : "text-red-600",
                                                )}
                                              >
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
                                                  event.id,
                                                  player.name,
                                                  activeMarket,
                                                  false,
                                                  line.point,
                                                  line.under.price,
                                                  bookmaker,
                                                )
                                              }
                                            >
                                              <span
                                                className={cn(
                                                  line.under.price > 0 ? "text-emerald-600" : "text-red-600",
                                                )}
                                              >
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
              ) : (
                // COMPARE VIEW - Show one player across all bookmakers
                <CompareView
                  player={players.find((p) => p.name === selectedPlayer)}
                  activeMarket={activeMarket}
                  formatOdds={formatOdds}
                  isPlayerPropSelected={isPlayerPropSelected}
                  onAddToParlayPlayerProp={onAddToParlayPlayerProp}
                  eventId={event.id}
                  findBestOdds={findBestOdds}
                />
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Component for comparing a player's props across bookmakers
function CompareView({
  player,
  activeMarket,
  formatOdds,
  isPlayerPropSelected,
  onAddToParlayPlayerProp,
  eventId,
  findBestOdds,
}: {
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
}) {
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

