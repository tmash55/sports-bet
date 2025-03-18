"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import type { SportKey, BookmakerKey } from "@/lib/constants/odds-api"
import { useEvents } from "@/lib/hooks/use-odds-api"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LayoutGrid,
  Table2,
  ArrowUpDown,
  Filter,
  ChevronDown,
  RefreshCw,
  ShoppingBasketIcon as Basketball,
  ClubIcon as Football,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { REGIONS, type RegionKey } from "@/lib/constants/odds-api"

// Player markets by sport
const PLAYER_MARKETS: { [key: string]: { [key: string]: string } } = {
  basketball_nba: {
    player_points: "player_points",
    player_rebounds: "player_rebounds",
    player_assists: "player_assists",
    player_threes: "player_threes",
    player_blocks: "player_blocks",
    player_steals: "player_steals",
    player_turnovers: "player_turnovers",
    player_double_double: "player_double_double",
    player_triple_double: "player_triple_double",
    player_points_rebounds: "player_points_rebounds",
    player_points_assists: "player_points_assists",
    player_rebounds_assists: "player_rebounds_assists",
    player_points_rebounds_assists: "player_points_rebounds_assists",
    player_first_basket: "player_first_basket",
  },
  americanfootball_nfl: {
    player_pass_yards: "player_pass_yards",
    player_pass_tds: "player_pass_tds",
    player_pass_completions: "player_pass_completions",
    player_pass_attempts: "player_pass_interceptions",
    player_rush_yards: "player_rush_tds",
    player_rush_attempts: "player_receiving_yards",
    player_receiving_tds: "player_receptions",
    player_kicking_points: "player_kicking_points",
    player_tackles_assists: "player_tackles_assists",
    player_sacks: "player_sacks",
  },
  baseball_mlb:{
    pitcher_strikeouts: "Pitcher Strikeouts",
    batter_hits: "Hits",
    batter_home_runs: "Homeruns",
    batter_runs: "Runs",
    batter_rbis: "RBI's",
    batter_total_bases: "Total Bases",

  }
}

// Market display names
const MARKET_INFO: { [key: string]: { name: string } } = {
  // NBA markets
  player_points: { name: "Points" },
  player_rebounds: { name: "Rebounds" },
  player_assists: { name: "Assists" },
  player_threes: { name: "3-Pointers Made" },
  player_blocks: { name: "Blocks" },
  player_steals: { name: "Steals" },
  player_turnovers: { name: "Turnovers" },
  player_double_double: { name: "Double-Double" },
  player_triple_double: { name: "Triple-Double" },
  player_points_rebounds: { name: "Points + Rebounds" },
  player_points_assists: { name: "Points + Assists" },
  player_rebounds_assists: { name: "Rebounds + Assists" },
  player_points_rebounds_assists: { name: "Points + Rebounds + Assists" },
  player_first_basket: { name: "First Basket" },

  // NFL markets
  player_pass_yards: { name: "Passing Yards" },
  player_pass_tds: { name: "Passing TDs" },
  player_pass_completions: { name: "Pass Completions" },
  player_pass_attempts: { name: "Pass Attempts" },
  player_pass_interceptions: { name: "Interceptions Thrown" },
  player_rush_yards: { name: "Rushing Yards" },
  player_rush_tds: { name: "Rushing TDs" },
  player_rush_attempts: { name: "Rush Attempts" },
  player_receiving_yards: { name: "Receiving Yards" },
  player_receiving_tds: { name: "Receiving TDs" },
  player_receptions: { name: "Receptions" },
  player_kicking_points: { name: "Kicking Points" },
  player_tackles_assists: { name: "Tackles + Assists" },
  player_sacks: { name: "Sacks" },

  //MLB markets: 
  pitcher_strikeouts: {name:"Pitcher Strikeouts"},
  batter_hits: {name:"Hits"},
  batter_home_runs: {name:"Homeruns"},
  batter_runs: {name:"Runs"},
  batter_rbis: {name:"RBI's"},
  batter_total_bases: {name:"Total Bases"},
}

// Function to get sport options
const getSportOptions = () => {
  return [
    { value: "basketball_nba", label: "NBA", icon: <Basketball className="h-4 w-4 mr-2" /> },
    { value: "baseball_mlb", label: "MLB", icon: <Football className="h-4 w-4 mr-2" /> },
    
  ]
}

// Function to get markets for a sport
const getMarketsForSport = (sport: SportKey) => {
  if (sport in PLAYER_MARKETS) {
    // Filter out alternate markets from the options
    return Object.entries(PLAYER_MARKETS[sport as keyof typeof PLAYER_MARKETS])
      .filter(([key, value]) => !value.endsWith("_alternate"))
      .map(([key, value]) => ({
        value,
        label: MARKET_INFO[value as keyof typeof MARKET_INFO]?.name || value,
      }))
  }
  return []
}

type PlayerPropData = {
  name: string
  bookmakers: {
    [key: string]: {
      standardLine: {
        over: { price: number; point: number }
        under: { price: number; point: number }
      } | null
      alternateLines: Array<{
        over: { price: number; point: number }
        under: { price: number; point: number }
      }>
    }
  }
}

// Format odds for display
const formatOdds = (price: number): string => {
  // If the price is already in American format
  if (Number.isInteger(price)) {
    if (price === 1) return "(1)"
    return price > 0 ? `+${price}` : `${price}`
  }

  // If we need to convert from decimal to American
  if (price >= 2) {
    return `+${Math.round((price - 1) * 100)}`
  } else {
    return `${Math.round(-100 / (price - 1))}`
  }
}

// Helper function to organize props by player
const organizePlayerProps = (propData: any) => {
  if (!propData?.bookmakers) return []

  const playerMap = new Map<string, PlayerPropData>()

  propData.bookmakers.forEach((bookmaker: any) => {
    // Group markets by key and isAlternate flag
    const standardMarkets: any[] = []
    const alternateMarkets: any[] = []

    bookmaker.markets.forEach((market: any) => {
      if (market.isAlternate) {
        alternateMarkets.push(market)
      } else {
        standardMarkets.push(market)
      }
    })

    // Process standard markets first
    standardMarkets.forEach((market) => {
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

        if (!player.bookmakers[bookmaker.key]) {
          player.bookmakers[bookmaker.key] = {
            standardLine: null,
            alternateLines: [],
          }
        }

        const overOutcome = outcomes.find((o) => o.name === "Over")
        const underOutcome = outcomes.find((o) => o.name === "Under")

        if (overOutcome && underOutcome) {
          player.bookmakers[bookmaker.key].standardLine = {
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

    // Then process alternate markets
    alternateMarkets.forEach((market) => {
      // Group outcomes by player (using description field)
      const playerOutcomes = new Map<string, any[]>()
      market.outcomes.forEach((outcome: any) => {
        const playerName = outcome.description
        if (!playerOutcomes.has(playerName)) {
          playerOutcomes.set(playerName, [])
        }
        playerOutcomes.get(playerName)?.push(outcome)
      })

      // Group outcomes by point value
      playerOutcomes.forEach((outcomes, playerName) => {
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
          }
        }

        // Group outcomes by point value
        const pointMap = new Map<number, { over: any; under: any }>()

        outcomes.forEach((outcome) => {
          const point = outcome.point
          if (!pointMap.has(point)) {
            pointMap.set(point, { over: null, under: null })
          }

          const pointEntry = pointMap.get(point)!
          if (outcome.name === "Over") {
            pointEntry.over = outcome
          } else if (outcome.name === "Under") {
            pointEntry.under = outcome
          }
        })

        // Convert the map to an array of lines
        pointMap.forEach((value, point) => {
          if (value.over && value.under) {
            player.bookmakers[bookmaker.key].alternateLines.push({
              over: {
                price: value.over.price,
                point: value.over.point,
              },
              under: {
                price: value.under.price,
                point: value.under.point,
              },
            })
          } else if (value.over) {
            // Handle case where we only have over but not under
            player.bookmakers[bookmaker.key].alternateLines.push({
              over: {
                price: value.over.price,
                point: value.over.point,
              },
              under: {
                price: 0,
                point: value.over.point,
              },
            })
          } else if (value.under) {
            // Handle case where we only have under but not over
            player.bookmakers[bookmaker.key].alternateLines.push({
              over: {
                price: 0,
                point: value.under.point,
              },
              under: {
                price: value.under.price,
                point: value.under.point,
              },
            })
          }
        })

        // Sort alternate lines by point value
        player.bookmakers[bookmaker.key].alternateLines.sort((a, b) => a.over.point - b.over.point)
      })
    })
  })

  return Array.from(playerMap.values())
}

// Function to group points into ranges
const groupPointsIntoRanges = (points: number[], marketName: string): { label: string; min: number; max: number }[] => {
  if (points.length === 0) return []

  // Sort points in ascending order
  const sortedPoints = [...points].sort((a, b) => a - b)

  // Determine the range size based on the market and data spread
  const minPoint = sortedPoints[0]
  const maxPoint = sortedPoints[sortedPoints.length - 1]
  const totalRange = maxPoint - minPoint

  // Adjust range size based on the total spread and market type
  let rangeSize = 5 // Default range size

  if (marketName === "Points") {
    // For points, use larger ranges if the spread is wide
    if (totalRange > 30) rangeSize = 10
    else if (totalRange > 15) rangeSize = 5
    else rangeSize = 2.5
  } else if (marketName === "Rebounds" || marketName === "Assists") {
    // For rebounds and assists, use smaller ranges
    if (totalRange > 15) rangeSize = 5
    else if (totalRange > 8) rangeSize = 2.5
    else rangeSize = 1
  } else {
    // For other markets, adjust based on the spread
    if (totalRange > 50) rangeSize = 20
    else if (totalRange > 20) rangeSize = 10
    else rangeSize = 5
  }

  // Create ranges
  const ranges: { label: string; min: number; max: number }[] = []
  let currentMin = Math.floor(minPoint / rangeSize) * rangeSize

  while (currentMin <= maxPoint) {
    const currentMax = currentMin + rangeSize
    ranges.push({
      label: `${currentMin}-${currentMax} ${marketName}`,
      min: currentMin,
      max: currentMax,
    })
    currentMin = currentMax
  }

  return ranges
}

// Function to find the best odds across all players and bookmakers
const findBestOdds = (
  players: PlayerPropData[],
  point: number,
  isOver: boolean,
  bookmakers: string[],
): { odds: number; bookmaker: string; player: string } | null => {
  let bestOdds = Number.NEGATIVE_INFINITY
  let bestBookmaker = ""
  let bestPlayer = ""

  players.forEach((player) => {
    bookmakers.forEach((bookie) => {
      const bookieData = player.bookmakers[bookie]
      if (!bookieData?.alternateLines) return

      const matchingLine = bookieData.alternateLines.find(
        (line) => Math.abs(isOver ? line.over.point - point : line.under.point - point) < 0.01,
      )

      if (matchingLine) {
        const odds = isOver ? matchingLine.over.price : matchingLine.under.price
        if (odds > bestOdds) {
          bestOdds = odds
          bestBookmaker = bookie
          bestPlayer = player.name
        }
      }
    })
  })

  return bestOdds !== Number.NEGATIVE_INFINITY ? { odds: bestOdds, bookmaker: bestBookmaker, player: bestPlayer } : null
}

export default function PlayerPropsExplorer() {
  const [sport, setSport] = useState<SportKey>("basketball_nba")
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedMarket, setSelectedMarket] = useState("player_points")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [highlightMode, setHighlightMode] = useState<"line" | "odds">("line")
  const [dataSource, setDataSource] = useState<"cache" | "api" | null>(null)
  const [viewMode, setViewMode] = useState<"standard" | "alternate">("standard")
  const [alternateDisplayMode, setAlternateDisplayMode] = useState<"card" | "table">("table")
  const [selectedPointRange, setSelectedPointRange] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isRefreshing, setIsRefreshing] = useState(false)
  // Add this new state variable after the other useState declarations (around line 390)
  const [availableRegions] = useState<RegionKey[]>([REGIONS.US, REGIONS.US2, REGIONS.EU])
  const [selectedRegions, setSelectedRegions] = useState<RegionKey[]>([REGIONS.US])
  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>([])

  // Fetch events for the selected sport
  const { events, loading: loadingEvents, error: eventsError, refetch } = useEvents(sport)

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

  // Set default event when events load
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id)
    }
  }, [events, selectedEventId])

  // Custom hook for player props with error handling
  const usePlayerPropsWithErrorHandling = (sportKey: SportKey, eventId: string | null, markets: string[]) => {
    const [propData, setPropData] = useState<any | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [source, setSource] = useState<"cache" | "api" | null>(null)
    // Update the fetch URL to include regions:
    useEffect(() => {
      if (!eventId) return

      const fetchPlayerProps = async () => {
        setLoading(true)
        setError(null)
        setErrorMessage(null)

        try {
          // Always fetch both standard and alternate markets
          const marketsToFetch = markets.flatMap((market) => {
            const baseMarket = market.endsWith("_alternate") ? market.replace("_alternate", "") : market
            return [baseMarket, `${baseMarket}_alternate`]
          })

          // Remove duplicates
          const uniqueMarkets = Array.from(new Set(marketsToFetch))

          const response = await fetch(
            `/api/player-props?sport=${sportKey}&eventId=${eventId}&markets=${uniqueMarkets.join(",")}&oddsFormat=american&regions=us,us2`,
          )

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to fetch player props")
          }

          const data = await response.json()
          setPropData(data.data)
          setSource(data.source || "api")
          setDataSource(data.source || "api") // Update the component-level state
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
    }, [sportKey, eventId, markets.join(","), selectedRegions.join(",")])

    return { propData, loading, error, source }
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
    setSelectedPointRange(null) // Reset point range when market changes
  }

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }

  // Find this line:
  // const bookmakers = propData?.bookmakers?.map((b: any) => b.key) || []
  // Replace it with:
  const bookmakers = useMemo(() => {
    return propData?.bookmakers?.map((b: any) => b.key) || []
  }, [propData])

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
        if (!data.standardLine) return

        const { over, under } = data.standardLine

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

  // Organize player props
  const players = useMemo(() => {
    return organizePlayerProps(propData)
  }, [propData])

  const bestValues = findBestValues(players)

  // Get all unique point values for the selected market
  const getAllPointValues = () => {
    const allPoints = new Set<number>()

    players.forEach((player) => {
      Object.values(player.bookmakers).forEach((bookieData) => {
        bookieData.alternateLines.forEach((line) => {
          allPoints.add(line.over.point)
        })
      })
    })

    return Array.from(allPoints)
  }

  // Get point ranges for the selected market
  const pointRanges = useMemo(() => {
    const allPoints = getAllPointValues()
    const marketName = MARKET_INFO[selectedMarket as keyof typeof MARKET_INFO]?.name || selectedMarket
    return groupPointsIntoRanges(allPoints, marketName)
  }, [selectedMarket, players])

  // Set default point range if none is selected
  useEffect(() => {
    if (pointRanges.length > 0 && !selectedPointRange) {
      setSelectedPointRange(pointRanges[0].label)
    }
  }, [pointRanges, selectedPointRange])

  // Filter points based on selected range
  const filterPointsByRange = (points: number[]) => {
    if (!selectedPointRange) return points

    const selectedRange = pointRanges.find((range) => range.label === selectedPointRange)
    if (!selectedRange) return points

    return points.filter((point) => point >= selectedRange.min && point < selectedRange.max)
  }

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  }

  // Add this function to toggle bookmaker selection
  // Add this after the toggleSortDirection function (around line 650)
  const toggleBookmaker = (bookie: string) => {
    if (selectedBookmakers.includes(bookie)) {
      // If all bookmakers would be deselected, don't allow it
      if (selectedBookmakers.length === 1) return
      setSelectedBookmakers(selectedBookmakers.filter((b) => b !== bookie))
    } else {
      setSelectedBookmakers([...selectedBookmakers, bookie])
    }
  }

  // Add this function to toggle all bookmakers
  const toggleAllBookmakers = () => {
    if (selectedBookmakers.length === bookmakers.length) {
      // If all are selected, select only the first one
      setSelectedBookmakers(bookmakers.length > 0 ? [bookmakers[0]] : [])
    } else {
      // Otherwise select all
      setSelectedBookmakers([...bookmakers])
    }
  }

  // Get the sport icon
  const getSportIcon = (sportKey: SportKey) => {
    const option = sportOptions.find((opt) => opt.value === sportKey)
    return option?.icon || null
  }

  // Add this effect to set default selected bookmakers when data loads
  // Add this after the other useEffect hooks (around line 440)
  // Find this useEffect:
  // useEffect(() => {
  //   if (bookmakers.length > 0) {
  //     // Always update selected bookmakers when bookmakers list changes
  //     setSelectedBookmakers([...bookmakers]);
  //     console.log("Updated selected bookmakers:", bookmakers);
  //   }
  // }, [bookmakers]); // Remove the selectedBookmakers.length dependency

  // Replace it with:
  useEffect(() => {
    if (bookmakers.length > 0 && selectedBookmakers.length === 0) {
      // Only set selected bookmakers if none are currently selected
      setSelectedBookmakers([...bookmakers])
      console.log("Updated selected bookmakers:", bookmakers)
    } else if (bookmakers.length > 0) {
      // If we already have selected bookmakers, only keep the ones that still exist
      const validBookmakers = selectedBookmakers.filter((bookie) => bookmakers.includes(bookie))

      // If all selected bookmakers were filtered out, select all available ones
      if (validBookmakers.length === 0) {
        setSelectedBookmakers([...bookmakers])
      } else if (validBookmakers.length !== selectedBookmakers.length) {
        setSelectedBookmakers(validBookmakers)
      }
    }
  }, [bookmakers, selectedBookmakers])

  // Also add a useEffect to log the bookmakers when they change
  useEffect(() => {
    if (bookmakers.length > 0) {
      console.log("Available bookmakers:", bookmakers)
    }
  }, [bookmakers])

  useEffect(() => {
    // Only refresh if we already have data and the regions change
    if (propData && selectedRegions.length > 0) {
      // This will cause the usePlayerPropsWithErrorHandling hook to refetch data
      setErrorMessage(null)
    }
  }, [selectedRegions, selectedEventId])

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <CardTitle>Player Props Explorer</CardTitle>
            <CardDescription>Compare player props across different sportsbooks</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh data from the API</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {dataSource && (
              <Badge variant={dataSource === "cache" ? "secondary" : "outline"} className="h-8">
                {dataSource === "cache" ? "From Cache" : "From API"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Filters Section */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sport Selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sport</label>
                <Select value={sport} onValueChange={handleSportChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select Sport">
                      <div className="flex items-center">
                        {getSportIcon(sport)}
                        <span>{sportOptions.find((opt) => opt.value === sport)?.label}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {sportOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="flex items-center">
                        <div className="flex items-center">
                          {option.icon}
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Game Selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">Game</label>
                {loadingEvents ? (
                  <Skeleton className="h-10 w-full" />
                ) : events.length === 0 ? (
                  <div className="text-sm text-muted-foreground h-10 flex items-center px-3 border rounded-md">
                    No games available
                  </div>
                ) : (
                  <Select
                    value={selectedEventId || ""}
                    onValueChange={setSelectedEventId}
                    disabled={events.length === 0}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select Game">
                        {selectedEvent ? (
                          <div className="truncate">
                            {selectedEvent.away_team} @ {selectedEvent.home_team}
                          </div>
                        ) : (
                          "Select Game"
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          <div className="flex flex-col">
                            <span>
                              {event.away_team} @ {event.home_team}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDate(event.commence_time)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Market Selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">Prop Type</label>
                <Select
                  value={selectedMarket}
                  onValueChange={handleMarketChange}
                  disabled={!selectedEventId || marketOptions.length === 0}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select Market">
                      {MARKET_INFO[selectedMarket as keyof typeof MARKET_INFO]?.name || selectedMarket}
                    </SelectValue>
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
          </div>

          {/* Content Section */}
          {selectedEvent ? (
            <div className="space-y-4">
              {/* Game Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-full">{getSportIcon(sport)}</div>
                  <div>
                    <h3 className="text-lg font-medium">
                      {selectedEvent.away_team} @ {selectedEvent.home_team}
                    </h3>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedEvent.commence_time)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "standard" | "alternate")}>
                    <TabsList>
                      <TabsTrigger value="standard" className="text-xs">
                        Standard Lines
                      </TabsTrigger>
                      <TabsTrigger value="alternate" className="text-xs">
                        Alternate Lines
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Options
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setHighlightMode("line")}>
                        <div className="flex items-center">
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full mr-2",
                              highlightMode === "line" ? "bg-primary" : "border",
                            )}
                          />
                          Highlight Best Lines
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setHighlightMode("odds")}>
                        <div className="flex items-center">
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full mr-2",
                              highlightMode === "odds" ? "bg-primary" : "border",
                            )}
                          />
                          Highlight Best Odds
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                        <Filter className="h-4 w-4 mr-2" />
                        Sportsbooks
                        <Badge className="ml-2 h-5 text-xs">{selectedBookmakers.length}</Badge>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="p-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Sportsbooks</span>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={toggleAllBookmakers}>
                            {selectedBookmakers.length === bookmakers.length ? "Deselect All" : "Select All"}
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {bookmakers.map((bookie: any) => (
                            <div
                              key={bookie}
                              className="flex items-center space-x-2 rounded-md p-1 hover:bg-muted cursor-pointer"
                              onClick={() => toggleBookmaker(bookie)}
                            >
                              <div
                                className={cn(
                                  "h-4 w-4 rounded-sm border flex items-center justify-center",
                                  selectedBookmakers.includes(bookie) && "bg-primary border-primary",
                                )}
                              >
                                {selectedBookmakers.includes(bookie) && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-3 w-3 text-primary-foreground"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm uppercase">{bookie}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                   
                   
                  </DropdownMenu>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  <p className="font-medium">Error loading props</p>
                  <p className="text-sm">{errorMessage}</p>
                  <p className="text-sm mt-2">This market may not be available for this game or sport.</p>
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <span>Best Over Line</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-100 rounded"></div>
                  <span>Best Under Line</span>
                </div>
              </div>

              {/* Content Tabs */}
              {loadingProps ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : propsError && !errorMessage ? (
                <div className="text-red-500 py-4">{propsError}</div>
              ) : players.length > 0 ? (
                <Tabs value={viewMode} className="w-full">
                  {/* Standard Lines Tab */}
                  <TabsContent value="standard">
                    <div className="border rounded-md overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Player</TableHead>
                            {selectedBookmakers.map((bookie: BookmakerKey) => (
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
                              {selectedBookmakers.map((bookie: BookmakerKey) => (
                                <TableCell key={bookie} className="text-center p-0">
                                  {player.bookmakers[bookie]?.standardLine ? (
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
                                        O {player.bookmakers[bookie].standardLine!.over.point}
                                        <span
                                          className={cn(
                                            "text-sm ml-1",
                                            player.bookmakers[bookie].standardLine!.over.price > 0
                                              ? "text-emerald-600"
                                              : "text-red-600",
                                          )}
                                        >
                                          {formatOdds(player.bookmakers[bookie].standardLine!.over.price)}
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
                                        U {player.bookmakers[bookie].standardLine!.under.point}
                                        <span
                                          className={cn(
                                            "text-sm ml-1",
                                            player.bookmakers[bookie].standardLine!.under.price > 0
                                              ? "text-emerald-600"
                                              : "text-red-600",
                                          )}
                                        >
                                          {formatOdds(player.bookmakers[bookie].standardLine!.under.price)}
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
                  </TabsContent>

                  {/* Alternate Lines Tab */}
                  <TabsContent value="alternate">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={alternateDisplayMode === "table" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAlternateDisplayMode("table")}
                          className="flex items-center gap-1"
                        >
                          <Table2 className="h-4 w-4" />
                          <span>Table View</span>
                        </Button>
                        <Button
                          variant={alternateDisplayMode === "card" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAlternateDisplayMode("card")}
                          className="flex items-center gap-1"
                        >
                          <LayoutGrid className="h-4 w-4" />
                          <span>Card View</span>
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleSortDirection}
                          className="flex items-center gap-1"
                        >
                          <ArrowUpDown className="h-4 w-4" />
                          <span>Sort {sortDirection === "asc" ? "Ascending" : "Descending"}</span>
                        </Button>

                        {pointRanges.length > 0 && (
                          <Select value={selectedPointRange || ""} onValueChange={setSelectedPointRange}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent>
                              {pointRanges.map((range) => (
                                <SelectItem key={range.label} value={range.label}>
                                  {range.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>

                    {alternateDisplayMode === "table" ? (
                      // TABLE VIEW
                      <div className="border rounded-md overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-24">Line</TableHead>
                              {selectedBookmakers.map((bookie: BookmakerKey) => (
                                <TableHead key={bookie} className="text-center">
                                  {bookie.toUpperCase()}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              // Get all unique points across all players
                              const allPoints = new Set<number>()
                              players.forEach((player) => {
                                Object.values(player.bookmakers).forEach((bookieData) => {
                                  bookieData.alternateLines.forEach((line) => {
                                    allPoints.add(line.over.point)
                                  })
                                })
                              })

                              // Filter and sort points
                              const filteredPoints = filterPointsByRange(Array.from(allPoints))
                              const sortedPoints = [...filteredPoints].sort((a, b) =>
                                sortDirection === "asc" ? a - b : b - a,
                              )

                              return sortedPoints.map((point) => {
                                // Find best odds for this point across all players
                                const bestOverOdds = findBestOdds(players, point, true, bookmakers)
                                const bestUnderOdds = findBestOdds(players, point, false, bookmakers)

                                return (
                                  <TableRow key={point}>
                                    <TableCell className="font-medium">{point}</TableCell>

                                    {selectedBookmakers.map((bookie: BookmakerKey) => {
                                      // Find any player that has this point/bookmaker combination
                                      let matchingLine = null
                                      let matchingPlayer = null

                                      for (const player of players) {
                                        const bookieData = player.bookmakers[bookie]
                                        if (!bookieData?.alternateLines) continue

                                        const line = bookieData.alternateLines.find(
                                          (line) => Math.abs(line.over.point - point) < 0.01,
                                        )

                                        if (line) {
                                          matchingLine = line
                                          matchingPlayer = player
                                          break
                                        }
                                      }

                                      const isOverBest = bestOverOdds?.bookmaker === bookie
                                      const isUnderBest = bestUnderOdds?.bookmaker === bookie

                                      return (
                                        <TableCell key={bookie} className="text-center p-0">
                                          {matchingLine ? (
                                            <div className="flex flex-col">
                                              <div className={cn("py-2 px-3", isOverBest && "bg-green-100")}>
                                                <span className="text-xs font-medium">O</span>{" "}
                                                <span
                                                  className={cn(
                                                    "font-medium",
                                                    matchingLine.over.price > 0 ? "text-emerald-600" : "text-red-600",
                                                  )}
                                                >
                                                  {formatOdds(matchingLine.over.price)}
                                                </span>
                                              </div>
                                              <div
                                                className={cn(
                                                  "py-2 px-3 border-t border-muted",
                                                  isUnderBest && "bg-blue-100",
                                                )}
                                              >
                                                <span className="text-xs font-medium">U</span>{" "}
                                                <span
                                                  className={cn(
                                                    "font-medium",
                                                    matchingLine.under.price > 0 ? "text-emerald-600" : "text-red-600",
                                                  )}
                                                >
                                                  {formatOdds(matchingLine.under.price)}
                                                </span>
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-muted-foreground p-3 block">-</span>
                                          )}
                                        </TableCell>
                                      )
                                    })}
                                  </TableRow>
                                )
                              })
                            })()}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      // CARD VIEW
                      <div className="space-y-8">
                        {players.map((player) => {
                          // Check if this player has any alternate lines
                          const hasAlternateLines = Object.values(player.bookmakers).some(
                            (bookie) => bookie.alternateLines && bookie.alternateLines.length > 0,
                          )

                          if (!hasAlternateLines) return null

                          // Get all unique point values for this player
                          const allPoints = new Set<number>()
                          Object.values(player.bookmakers).forEach((bookie) => {
                            bookie.alternateLines.forEach((line) => {
                              allPoints.add(line.over.point)
                            })
                          })

                          // Filter points based on selected range
                          const filteredPoints = filterPointsByRange(Array.from(allPoints))

                          // Sort points based on direction
                          const sortedPoints = [...filteredPoints].sort((a, b) =>
                            sortDirection === "asc" ? a - b : b - a,
                          )

                          if (sortedPoints.length === 0) return null

                          return (
                            <div key={player.name} className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">{player.name}</h3>
                                <Badge variant="outline">{sortedPoints.length} alternate lines</Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sortedPoints.map((point) => {
                                  // Find best odds for this point
                                  const bestOverOdds = findBestOdds(players, point, true, bookmakers)
                                  const bestUnderOdds = findBestOdds(players, point, false, bookmakers)

                                  return (
                                    <Card key={point} className="overflow-hidden">
                                      <CardHeader className="bg-muted/20 py-2">
                                        <div className="flex items-center justify-between">
                                          <CardTitle className="text-sm font-medium">Line: {point}</CardTitle>
                                          <Badge variant="outline" className="text-xs">
                                            {MARKET_INFO[selectedMarket as keyof typeof MARKET_INFO]?.name}
                                          </Badge>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <h4 className="text-sm font-medium mb-2">Over</h4>
                                            <div className="space-y-2">
                                              {selectedBookmakers.map((bookie: BookmakerKey) => {
                                                // Find the player that has this bookie and point
                                                let matchingPlayer = null
                                                let matchingLine = null

                                                for (const player of players) {
                                                  const bookieData = player.bookmakers[bookie]
                                                  if (!bookieData?.alternateLines) continue

                                                  const line = bookieData.alternateLines.find(
                                                    (line) => Math.abs(line.over.point - point) < 0.01,
                                                  )

                                                  if (line) {
                                                    matchingPlayer = player
                                                    matchingLine = line
                                                    break
                                                  }
                                                }

                                                if (!matchingLine) return null

                                                const isBestOdds =
                                                  bestOverOdds?.bookmaker === bookie &&
                                                  bestOverOdds?.player === matchingPlayer?.name

                                                return (
                                                  <div
                                                    key={`${bookie}-over`}
                                                    className="flex justify-between items-center"
                                                  >
                                                    <span className="text-sm capitalize">{bookie}</span>
                                                    <span
                                                      className={cn(
                                                        "px-2 py-1 rounded font-medium text-sm",
                                                        isBestOdds && "bg-green-100",
                                                        matchingLine.over.price > 0
                                                          ? "text-emerald-600"
                                                          : "text-red-600",
                                                      )}
                                                    >
                                                      {formatOdds(matchingLine.over.price)}
                                                    </span>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          </div>

                                          <div>
                                            <h4 className="text-sm font-medium mb-2">Under</h4>
                                            <div className="space-y-2">
                                              {selectedBookmakers.map((bookie: BookmakerKey) => {
                                                // Find the player that has this bookie and point
                                                let matchingPlayer = null
                                                let matchingLine = null

                                                for (const player of players) {
                                                  const bookieData = player.bookmakers[bookie]
                                                  if (!bookieData?.alternateLines) continue

                                                  const line = bookieData.alternateLines.find(
                                                    (line) => Math.abs(line.under.point - point) < 0.01,
                                                  )

                                                  if (line) {
                                                    matchingPlayer = player
                                                    matchingLine = line
                                                    break
                                                  }
                                                }

                                                if (!matchingLine) return null

                                                const isBestOdds =
                                                  bestUnderOdds?.bookmaker === bookie &&
                                                  bestUnderOdds?.player === matchingPlayer?.name

                                                return (
                                                  <div
                                                    key={`${bookie}-under`}
                                                    className="flex justify-between items-center"
                                                  >
                                                    <span className="text-sm capitalize">{bookie}</span>
                                                    <span
                                                      className={cn(
                                                        "px-2 py-1 rounded font-medium text-sm",
                                                        isBestOdds && "bg-blue-100",
                                                        matchingLine.under.price > 0
                                                          ? "text-emerald-600"
                                                          : "text-red-600",
                                                      )}
                                                    >
                                                      {formatOdds(matchingLine.under.price)}
                                                    </span>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}

                        {players.every(
                          (player) =>
                            !Object.values(player.bookmakers).some(
                              (bookie) => bookie.alternateLines && bookie.alternateLines.length > 0,
                            ),
                        ) && (
                          <div className="py-4 text-center text-muted-foreground">
                            No alternate lines available for this game and market.
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : !errorMessage ? (
                <div className="py-4 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Sparkles className="h-12 w-12 mb-2 text-muted-foreground/50" />
                    <p>No player props available for this game and market.</p>
                    <p className="text-sm">Try selecting a different market or game.</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Filter className="h-12 w-12 mb-2 text-muted-foreground/50" />
                <p>Select a sport and game to view player props</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

