"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { RefreshCw, Trash2, ArrowRightLeft, Calendar, Filter, Settings } from "lucide-react"
import type { SportKey, BookmakerKey, GameMarketKey } from "@/lib/constants/odds-api"
import { useEvents, getSportOptions } from "@/lib/hooks/use-odds-api"
import { ParlayDrawer } from "./parlay-drawer"
import { EventCard } from "./event-card"
import { type ParlayLeg, DEFAULT_BOOKMAKERS } from "@/lib/utils/parlay-utils"
import { SportsbookPreferences } from "./sportsbook-preferences"
import { MARKET_INFO } from "@/lib/constants/odds-api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useParlayState } from "@/lib/hooks/use-parlay-state"
import { groupEventsByDate, isDateToday, isDateTomorrow } from "@/lib/utils/date-utils"
import { format } from "date-fns"

export default function ParlayBuilder() {
  const [sport, setSport] = useState<SportKey>("basketball_nba")
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([])
  const [availableBookmakers, setAvailableBookmakers] = useState<BookmakerKey[]>([])
  const [selectedBookmaker, setSelectedBookmaker] = useState<BookmakerKey | null>(null)
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "tomorrow">("all")
  const [refreshing, setRefreshing] = useState(false)
  const [eventsOdds, setEventsOdds] = useState<Record<string, any>>({})
  const [loadingOdds, setLoadingOdds] = useState(false)
  const [playerPropsData, setPlayerPropsData] = useState<Record<string, any>>({})
  const [loadingPlayerProps, setLoadingPlayerProps] = useState(false)
  const [activeTab, setActiveTab] = useState<"games" | "props">("games")
  const [searchTerm, setSearchTerm] = useState("")

  const {clearParlay, switchLegBookmaker, findBestOddsForLeg } = useParlayState()

  // Fetch events for the selected sport
  const { events, loading: loadingEvents, error: eventsError, refetch } = useEvents(sport)

  // Get sport options
  const sportOptions = getSportOptions()

  // Fetch odds for all events in a batch
  const fetchBatchOdds = useCallback(
    async (eventsList: any[]) => {
      if (!eventsList || eventsList.length === 0) return

      setLoadingOdds(true)

      try {
        const eventIds = eventsList.map((event) => event.id)
        const markets: GameMarketKey[] = ["h2h", "spreads", "totals"]

        const response = await fetch("/api/batch-odds", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sport,
            eventIds,
            markets,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to fetch batch odds")
        }

        const data = await response.json()

        // Create a map of event ID to odds data
        const oddsMap: Record<string, any> = {}
        data.data.forEach((event: any) => {
          // Make sure to include the source from the API response
          oddsMap[event.id] = {
            ...event,
            source: data.source, // Add the source from the response
          }

          // Update available bookmakers
          if (event.bookmakers && event.bookmakers.length > 0) {
            updateAvailableBookmakers(event.bookmakers)
          }
        })

        setEventsOdds(oddsMap)
      } catch (error) {
        console.error("Error fetching batch odds:", error)
        toast({
          title: "Error",
          description: "Failed to load odds data",
          variant: "destructive",
        })
      } finally {
        setLoadingOdds(false)
      }
    },
    [sport],
  )

  // Fetch odds when events change
  useEffect(() => {
    if (events.length > 0) {
      fetchBatchOdds(events)
    }
  }, [events, fetchBatchOdds])

  // Set default bookmaker when available bookmakers change
  useEffect(() => {
    if (availableBookmakers.length > 0 && !selectedBookmaker) {
      setSelectedBookmaker(availableBookmakers[0])
    }
  }, [availableBookmakers, selectedBookmaker])

  // Handle sport change
  const handleSportChange = (newSport: string) => {
    setSport(newSport as SportKey)
    setEventsOdds({}) // Clear odds when sport changes
    setPlayerPropsData({}) // Clear player props data when sport changes
  }

  // Filter events based on search term and date
  const filteredEvents = events.filter((event) => {
    // Filter out live games
    const eventTime = new Date(event.commence_time)
    const now = new Date()
    if (eventTime <= now) return false

    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      event.home_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.away_team.toLowerCase().includes(searchTerm.toLowerCase())

    // Date filter
    if (dateFilter === "all") return matchesSearch

    const eventDate = new Date(event.commence_time)

    if (dateFilter === "today") {
      return matchesSearch && isDateToday(eventDate)
    }

    if (dateFilter === "tomorrow") {
      return matchesSearch && isDateTomorrow(eventDate)
    }

    return matchesSearch
  })

  // Group events by date
  const eventsByDate = groupEventsByDate(filteredEvents)

  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort()

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    // After events are refreshed, the useEffect will trigger fetchBatchOdds
    setRefreshing(false)
    toast({
      title: "Data refreshed",
      description: "The latest odds have been loaded",
    })
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
    if (!selectedBookmaker) {
      toast({
        title: "Error",
        description: "Please select a sportsbook first",
        variant: "destructive",
      })
      return
    }

    // Check if this bet is already in the parlay
    const existingLeg = parlayLegs.find(
      (leg) =>
        leg.eventId === eventId &&
        leg.market === "h2h" &&
        leg.selection === teamName &&
        leg.bookmaker === selectedBookmaker,
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

    // Get odds from the cached data instead of making a new request
    const eventOdds = eventsOdds[eventId]
    if (!eventOdds) {
      toast({
        title: "Error",
        description: "Odds data not available for this event",
        variant: "destructive",
      })
      return
    }

    // Find the selected bookmaker data
    const bookmakerData = eventOdds.bookmakers?.find((b: any) => b.key === selectedBookmaker)
    if (!bookmakerData) {
      toast({
        title: "Error",
        description: `Odds not available for ${selectedBookmaker}`,
        variant: "destructive",
      })
      return
    }

    // Get the moneyline market
    const moneylineMarket = bookmakerData.markets?.find((m: any) => m.key === "h2h")
    if (!moneylineMarket) {
      toast({
        title: "Error",
        description: "Moneyline odds not available",
        variant: "destructive",
      })
      return
    }

    // Get the outcome for the selected team
    const outcome = moneylineMarket.outcomes?.find((o: any) => o.name === teamName)
    if (!outcome) {
      toast({
        title: "Error",
        description: `Odds not available for ${teamName}`,
        variant: "destructive",
      })
      return
    }

    // Create a unique ID for this leg
    const legId = `${eventId}-${teamName}-ml-${selectedBookmaker}-${Date.now()}`

    // Create odds object for each bookmaker with proper initialization
    const oddsObj: Record<BookmakerKey, number> = {} as Record<BookmakerKey, number>

    // Store odds for all available bookmakers, not just the selected one
    eventOdds.bookmakers.forEach((bookie: any) => {
      const bookieMarket = bookie.markets?.find((m: any) => m.key === "h2h")
      if (bookieMarket) {
        const bookieOutcome = bookieMarket.outcomes?.find((o: any) => o.name === teamName)
        if (bookieOutcome) {
          oddsObj[bookie.key as BookmakerKey] = bookieOutcome.price
        }
      }
    })

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
      bookmaker: selectedBookmaker,
    }

    setParlayLegs([...updatedLegs, newLeg])

    toast({
      title: "Added to parlay",
      description: `${teamName} moneyline (${selectedBookmaker.toUpperCase()}) added to your parlay`,
      duration: 2000,
    })
  }

  // Add spread bet to parlay
  const addToParlaySpread = (eventId: string, teamName: string, point: number, price: number) => {
    if (!selectedBookmaker) {
      toast({
        title: "Error",
        description: "Please select a sportsbook first",
        variant: "destructive",
      })
      return
    }

    // Check if this bet is already in the parlay
    const existingLeg = parlayLegs.find(
      (leg) =>
        leg.eventId === eventId &&
        leg.market === "spreads" &&
        leg.selection === teamName &&
        leg.point === point &&
        leg.bookmaker === selectedBookmaker,
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

    // Get odds from the cached data instead of making a new request
    const eventOdds = eventsOdds[eventId]
    if (!eventOdds) {
      toast({
        title: "Error",
        description: "Odds data not available for this event",
        variant: "destructive",
      })
      return
    }

    // Find the selected bookmaker data
    const bookmakerData = eventOdds.bookmakers?.find((b: any) => b.key === selectedBookmaker)
    if (!bookmakerData) {
      toast({
        title: "Error",
        description: `Odds not available for ${selectedBookmaker}`,
        variant: "destructive",
      })
      return
    }

    // Get the spread market
    const spreadMarket = bookmakerData.markets?.find((m: any) => m.key === "spreads")
    if (!spreadMarket) {
      toast({
        title: "Error",
        description: "Spread odds not available",
        variant: "destructive",
      })
      return
    }

    // Get the outcome for the selected team
    const outcome = spreadMarket.outcomes?.find((o: any) => o.name === teamName)
    if (!outcome) {
      toast({
        title: "Error",
        description: `Odds not available for ${teamName}`,
        variant: "destructive",
      })
      return
    }

    // Create a unique ID for this leg
    const legId = `${eventId}-${teamName}-spread-${selectedBookmaker}-${Date.now()}`

    // Create odds object for each bookmaker
    const oddsObj: Record<BookmakerKey, number> = {} as Record<BookmakerKey, number>

    // Store odds for all available bookmakers, not just the selected one
    eventOdds.bookmakers.forEach((bookie: any) => {
      const bookieMarket = bookie.markets?.find((m: any) => m.key === "spreads")
      if (bookieMarket) {
        const bookieOutcome = bookieMarket.outcomes?.find((o: any) => o.name === teamName)
        if (bookieOutcome && bookieOutcome.point === point) {
          oddsObj[bookie.key as BookmakerKey] = bookieOutcome.price
        }
      }
    })

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
      bookmaker: selectedBookmaker,
    }

    setParlayLegs([...updatedLegs, newLeg])

    toast({
      title: "Added to parlay",
      description: `${teamName} ${point > 0 ? "+" : ""}${point} (${selectedBookmaker.toUpperCase()}) added to your parlay`,
      duration: 2000,
    })
  }

  // Add total bet to parlay
  const addToParlayTotal = (eventId: string, isOver: boolean, point: number) => {
    if (!selectedBookmaker) {
      toast({
        title: "Error",
        description: "Please select a sportsbook first",
        variant: "destructive",
      })
      return
    }

    const selection = isOver ? "Over" : "Under"

    // Check if this bet is already in the parlay
    const existingLeg = parlayLegs.find(
      (leg) =>
        leg.eventId === eventId &&
        leg.market === "totals" &&
        leg.selection === selection &&
        leg.point === point &&
        leg.bookmaker === selectedBookmaker,
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

    // Get odds from the cached data instead of making a new request
    const eventOdds = eventsOdds[eventId]
    if (!eventOdds) {
      toast({
        title: "Error",
        description: "Odds data not available for this event",
        variant: "destructive",
      })
      return
    }

    // Find the selected bookmaker data
    const bookmakerData = eventOdds.bookmakers?.find((b: any) => b.key === selectedBookmaker)
    if (!bookmakerData) {
      toast({
        title: "Error",
        description: `Odds not available for ${selectedBookmaker}`,
        variant: "destructive",
      })
      return
    }

    // Get the totals market
    const totalsMarket = bookmakerData.markets?.find((m: any) => m.key === "totals")
    if (!totalsMarket) {
      toast({
        title: "Error",
        description: "Totals odds not available",
        variant: "destructive",
      })
      return
    }

    // Get the outcome for the selected total
    const outcome = totalsMarket.outcomes?.find((o: any) => o.name === selection)
    if (!outcome) {
      toast({
        title: "Error",
        description: `Odds not available for ${selection}`,
        variant: "destructive",
      })
      return
    }

    // Create a unique ID for this leg
    const legId = `${eventId}-${isOver ? "over" : "under"}-${selectedBookmaker}-${Date.now()}`

    // Create odds object for each bookmaker
    const oddsObj: Record<BookmakerKey, number> = {} as Record<BookmakerKey, number>

    // Store odds for all available bookmakers, not just the selected one
    eventOdds.bookmakers.forEach((bookie: any) => {
      const bookieMarket = bookie.markets?.find((m: any) => m.key === "totals")
      if (bookieMarket) {
        const bookieOutcome = bookieMarket.outcomes?.find((o: any) => o.name === selection)
        if (bookieOutcome && bookieOutcome.point === point) {
          oddsObj[bookie.key as BookmakerKey] = bookieOutcome.price
        }
      }
    })

    const newLeg: ParlayLeg = {
      id: legId,
      sport,
      eventId,
      eventName: `${selectedEvent.away_team} @ ${selectedEvent.home_team}`,
      market: "totals",
      marketDisplayName: "Total",
      selection,
      selectionDisplayName: `${selection} ${point}`,
      type: isOver ? "over" : "under",
      odds: oddsObj,
      point,
      bookmaker: selectedBookmaker,
    }

    setParlayLegs([...updatedLegs, newLeg])

    toast({
      title: "Added to parlay",
      description: `${selection} ${point} (${selectedBookmaker.toUpperCase()}) added to your parlay`,
      duration: 2000,
    })
  }

  // Fetch player props data for an event
  const fetchPlayerProps = async (eventId: string, market: string) => {
    if (!eventId || !market) return null

    // Check if we already have this data cached
    if (playerPropsData[`${eventId}-${market}`]) {
      return playerPropsData[`${eventId}-${market}`]
    }

    setLoadingPlayerProps(true)

    try {
      const response = await fetch(`/api/player-props?sport=${sport}&eventId=${eventId}&markets=${market}`)

      if (!response.ok) {
        throw new Error("Failed to fetch player props")
      }

      const data = await response.json()

      // Cache the data
      setPlayerPropsData((prev) => ({
        ...prev,
        [`${eventId}-${market}`]: data.data,
      }))

      return data.data
    } catch (error) {
      console.error("Error fetching player props:", error)
      return null
    } finally {
      setLoadingPlayerProps(false)
    }
  }

  // Find the closest matching line for a player prop
  const findClosestLine = (
    propData: any,
    playerName: string,
    market: string,
    targetPoint: number,
    isOver: boolean,
    targetBookmaker: string,
  ) => {
    if (!propData || !propData.bookmakers) return null

    // Find the bookmaker data
    const bookmakerData = propData.bookmakers.find((b: any) => b.key === targetBookmaker)
    if (!bookmakerData) return null

    // Find all markets for this player
    const playerMarkets: any[] = []

    bookmakerData.markets.forEach((market: any) => {
      // Group outcomes by player
      const playerOutcomes = market.outcomes.filter((o: any) => o.description === playerName)
      if (playerOutcomes.length > 0) {
        playerMarkets.push({
          market,
          outcomes: playerOutcomes,
        })
      }
    })

    if (playerMarkets.length === 0) return null

    // Find exact matching line for this player
    let exactMatch: { point: number; price: number } | null = null

    playerMarkets.forEach(({ market, outcomes }) => {
      outcomes.forEach((outcome: any) => {
        if (outcome.name === (isOver ? "Over" : "Under") && outcome.point === targetPoint) {
          exactMatch = {
            point: outcome.point,
            price: outcome.price,
          }
        }
      })
    })

    // Only return exact matches
    return exactMatch
      ? {
          point: exactMatch.point,
          price: exactMatch.price,
          diff: 0,
        }
      : null
  }

  // Add player prop bet to parlay with dynamic line matching
  const addToParlayPlayerProp = async (
    eventId: string,
    playerName: string,
    market: string,
    isOver: boolean,
    point: number,
    price: number,
    bookmaker?: string,
  ) => {
    // Use the selected bookmaker if none is provided
    const effectiveBookmaker = bookmaker || selectedBookmaker

    if (!effectiveBookmaker) {
      toast({
        title: "Error",
        description: "Please select a sportsbook first",
        variant: "destructive",
      })
      return
    }

    const selection = isOver ? "Over" : "Under"
    const marketDisplayName =
      MARKET_INFO[market as keyof typeof MARKET_INFO]?.name ||
      market.replace("player_", "").charAt(0).toUpperCase() + market.replace("player_", "").slice(1)

    // Check if this bet is already in the parlay
    const existingLeg = parlayLegs.find(
      (leg) =>
        leg.eventId === eventId &&
        leg.market === market &&
        leg.selection === selection &&
        leg.point === point &&
        leg.selectionDisplayName.includes(playerName) &&
        leg.bookmaker === effectiveBookmaker,
    )

    // If it exists, remove it (toggle behavior)
    if (existingLeg) {
      setParlayLegs((prev) => prev.filter((leg) => leg.id !== existingLeg.id))
      return
    }

    const selectedEvent = events.find((e) => e.id === eventId)
    if (!selectedEvent) return

    // Create a unique ID for this leg
    const legId = `${eventId}-${playerName}-${market}-${isOver ? "over" : "under"}-${effectiveBookmaker}-${Date.now()}`

    // Create odds object for each bookmaker
    const oddsObj: Record<BookmakerKey, number> = {} as Record<BookmakerKey, number>

    // For player props, we need to fetch data for all bookmakers
    const propData = await fetchPlayerProps(eventId, market)

    if (!propData) {
      toast({
        title: "Error",
        description: "Failed to fetch player props data",
        variant: "destructive",
      })
      return
    }

    // First, add the selected bookmaker's odds
    oddsObj[effectiveBookmaker as BookmakerKey] = price

    // Then, try to find matching or closest lines for other bookmakers
    const alternateLines: { bookmaker: string; point: number; price: number; diff: number }[] = []

    // Get all available bookmakers from the prop data
    const availableBookmakers = propData.bookmakers.map((b: any) => b.key as BookmakerKey)

    // For each available bookmaker (except the selected one), find the closest line
    for (const bookie of availableBookmakers) {
      if (bookie === effectiveBookmaker) continue

      const closestLine = findClosestLine(propData, playerName, market, point, isOver, bookie)

      if (closestLine) {
        // Add to odds object
        oddsObj[bookie as BookmakerKey] = closestLine.price

        // Add to alternate lines for display
        alternateLines.push({
          bookmaker: bookie,
          point: closestLine.point,
          price: closestLine.price,
          diff: closestLine.diff,
        })
      }
    }

    // Sort alternate lines by difference
    alternateLines.sort((a, b) => a.diff - b.diff)

    // Create the parlay leg
    const newLeg: ParlayLeg = {
      id: legId,
      sport,
      eventId,
      eventName: `${selectedEvent.away_team} @ ${selectedEvent.home_team}`,
      market,
      marketDisplayName,
      selection,
      selectionDisplayName: `${playerName} ${selection} ${point} ${marketDisplayName}`,
      type: isOver ? "over" : "under",
      odds: oddsObj,
      point,
      bookmaker: effectiveBookmaker as BookmakerKey,
      alternateLines, // Add alternate lines to the leg
    }

    setParlayLegs((prev) => [...prev, newLeg])

    // Show toast with info about alternate lines
    if (alternateLines.length > 0) {
      const exactMatches = alternateLines.filter((line) => line.diff === 0).length
      const closeMatches = alternateLines.filter((line) => line.diff > 0).length

      toast({
        title: "Added to parlay",
        description: `${playerName} ${selection} ${point} ${marketDisplayName} (${effectiveBookmaker.toUpperCase()}) added with ${exactMatches} exact and ${closeMatches} close line matches across bookmakers`,
        duration: 3000,
      })
    } else {
      toast({
        title: "Added to parlay",
        description: `${playerName} ${selection} ${point} ${marketDisplayName} (${effectiveBookmaker.toUpperCase()}) added to your parlay`,
        duration: 2000,
      })
    }
  }

  // Remove a leg from the parlay
  const removeLeg = (legId: string) => {
    const legToRemove = parlayLegs.find((leg) => leg.id === legId)
    setParlayLegs((prev) => prev.filter((leg) => leg.id !== legId))

    if (legToRemove) {
      toast({
        title: "Removed from parlay",
        description: `${legToRemove.selectionDisplayName} removed from your parlay`,
        duration: 2000,
      })
    }
  }

  // Clear the entire parlay
  // const clearParlay = () => {
  //   setParlayLegs([])
  //   toast({
  //     title: "Parlay cleared",
  //     description: "All selections have been removed from your parlay",
  //     duration: 2000,
  //   })
  // }

  // Find the best odds for a specific leg across all bookmakers
  // const findBestOddsForLeg = (leg: ParlayLeg) => {
  //   if (!leg.odds) return { bookmaker: leg.bookmaker, odds: 0 }

  //   let bestBookmaker = leg.bookmaker
  //   let bestOdds = leg.odds[leg.bookmaker] || 0

  //   // Check all bookmakers for this leg
  //   Object.entries(leg.odds).forEach(([bookmaker, odds]) => {
  //     // For American odds, higher is better
  //     if (odds > bestOdds) {
  //       bestOdds = odds
  //       bestBookmaker = bookmaker as BookmakerKey
  //     }
  //   })

  //   return { bookmaker: bestBookmaker, odds: bestOdds }
  // }

  // Switch a leg to a different bookmaker
  // const switchLegBookmaker = (legId: string, newBookmaker: BookmakerKey) => {
  //   setParlayLegs((prev) =>
  //     prev.map((leg) => {
  //       if (leg.id === legId) {
  //         // If this leg has the new bookmaker's odds
  //         if (leg.odds && leg.odds[newBookmaker]) {
  //           return {
  //             ...leg,
  //             bookmaker: newBookmaker,
  //           }
  //         }
  //       }
  //       return leg
  //     }),
  //   )

  //   toast({
  //     title: "Bookmaker switched",
  //     description: `Switched to ${newBookmaker.toUpperCase()} for better odds`,
  //     duration: 2000,
  //   })
  // }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Parlay Builder & Odds Comparison</CardTitle>
        <CardDescription>Build your parlay and compare odds across sportsbooks</CardDescription>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "games" | "props")} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="games">Game by Game</TabsTrigger>
            <TabsTrigger value="props">Player Props Search</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "games" | "props")}>
          <TabsContent value="games">
            <div className="space-y-6">
              {/* Modern Filter Controls */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Filters & Settings</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                      {refreshing ? "Refreshing..." : "Refresh Odds"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
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
                      <p className="text-xs text-muted-foreground mt-1">Select the sport to view available games</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium mb-1 block">Odds Display</label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Filter className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-[200px] text-xs">
                                Select which sportsbook&apos;s odds to display. You can compare odds across books.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select
                        value={selectedBookmaker || ""}
                        onValueChange={(value) => setSelectedBookmaker(value as BookmakerKey)}
                        disabled={availableBookmakers.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Sportsbook" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBookmakers.map((bookie) => (
                            <SelectItem key={bookie} value={bookie}>
                              {bookie.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">Odds shown are from your selected sportsbook</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium mb-1 block">Date Filter</label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-[200px] text-xs">Filter games by date. Only upcoming games are shown.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Upcoming Games</SelectItem>
                          <SelectItem value="today">Today&apos;s Games</SelectItem>
                          <SelectItem value="tomorrow">Tomorrow&apos;s Games</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">Only upcoming games are displayed</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Sportsbook Preferences:</span>
                      <SportsbookPreferences />
                    </div>
                    <div className="text-xs text-muted-foreground">Configure which sportsbooks to compare</div>
                  </div>
                </div>
              </div>

              {/* Events Grid */}
              {loadingEvents || loadingOdds ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                  ))}
                </div>
              ) : eventsError ? (
                <div className="text-red-500 py-4">{eventsError}</div>
              ) : filteredEvents.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-muted-foreground">No upcoming events found for the selected sport and filters.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {sortedDates.map((date) => {
                    const dateObj = new Date(date)
                    const isToday = isDateToday(dateObj)
                    const isTomorrow = isDateTomorrow(dateObj)

                    return (
                      <div key={date} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-medium">
                            {isToday ? "Today" : isTomorrow ? "Tomorrow" : format(dateObj, "EEEE, MMMM d, yyyy")}
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {eventsByDate[date].map((event) => (
                            <EventCard
                              key={event.id}
                              event={event}
                              sport={sport}
                              parlayLegs={parlayLegs}
                              eventOdds={eventsOdds[event.id]}
                              selectedBookmaker={selectedBookmaker}
                              onAddToParlayMoneyline={addToParlayMoneyline}
                              onAddToParlaySpread={addToParlaySpread}
                              onAddToParlayTotal={addToParlayTotal}
                              onAddToParlayPlayerProp={addToParlayPlayerProp}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Parlay Summary */}
        {parlayLegs.length > 0 && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Current Parlay</h3>
              <Badge>{parlayLegs.length} Legs</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {parlayLegs.map((leg) => {
                // Find best odds for this leg
                const bestOdds = findBestOddsForLeg(leg)
                const hasBetterOdds = bestOdds.bookmaker !== leg.bookmaker

                return (
                  <Badge key={leg.id} variant="outline" className="flex items-center gap-1">
                    {leg.selectionDisplayName}
                    <span className="text-xs ml-1 opacity-70">({leg.bookmaker?.toUpperCase()})</span>
                    {hasBetterOdds && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 ml-1 text-amber-500"
                        title={`Switch to ${bestOdds.bookmaker} for better odds`}
                        onClick={() => switchLegBookmaker(leg.id, bestOdds.bookmaker)}
                      >
                        <ArrowRightLeft className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => removeLeg(leg.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>

      {/* Parlay Drawer */}
      <ParlayDrawer
        parlayLegs={parlayLegs}
        availableBookmakers={availableBookmakers}
        onRemoveLeg={removeLeg}
        onClearParlay={clearParlay}
        onSwitchBookmaker={switchLegBookmaker}
        findBestOddsForLeg={findBestOddsForLeg}
      />
    </Card>
  )
}

