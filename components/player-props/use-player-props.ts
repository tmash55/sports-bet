"use client"

import { useState, useEffect, useMemo } from "react"
import type { SportKey, BookmakerKey } from "@/lib/constants/odds-api"
import { PLAYER_MARKETS, MARKET_INFO } from "@/lib/constants/odds-api"
import type { ParlayLeg } from "@/lib/utils/parlay-utils"

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

export interface PlayerData {
  name: string
  bookmakers: Record<string, BookmakerData>
}

interface UsePlayerPropsProps {
  event: {
    id: string
    sport_key: string
    home_team: string
    away_team: string
  }
  activeMarket: string
  viewMode: "standard" | "alternate" | "compare"
  searchTerm: string
  sortBy: "name" | "point"
  selectedBookmaker: BookmakerKey | null
  selectedPlayer: string | null
  parlayLegs: ParlayLeg[]
  open: boolean
}

export function usePlayerProps({
  event,
  activeMarket,
  viewMode,
  searchTerm,
  sortBy,
  selectedBookmaker,
  selectedPlayer,
  parlayLegs,
  open,
}: UsePlayerPropsProps) {
  const [playerProps, setPlayerProps] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [tabLoading, setTabLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<"cache" | "api" | null>(null)
  const [refreshing, setRefreshing] = useState(false)

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

  return {
    playerProps,
    players,
    allPlayers,
    loading,
    tabLoading,
    error,
    dataSource,
    refreshing,
    availableMarkets,
    availableBookmakers,
    handleRefresh,
    formatOdds,
    isPlayerPropSelected,
    findBestOdds,
    getMarketDisplayName,
  }
}

