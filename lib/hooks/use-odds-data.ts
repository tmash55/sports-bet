"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "@/components/ui/use-toast"
import type { SportKey, GameMarketKey } from "@/lib/constants/odds-api"

export function useOddsData(sport: SportKey, events: any[]) {
  const [eventsOdds, setEventsOdds] = useState<Record<string, any>>({})
  const [loadingOdds, setLoadingOdds] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Use a ref to track if a refresh is in progress to prevent infinite loops
  const isRefreshingRef = useRef(false)

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
        })

        setEventsOdds(oddsMap)
        return data
      } catch (error) {
        console.error("Error fetching batch odds:", error)
        setErrorMessage("Failed to load odds data")
        return null
      } finally {
        setLoadingOdds(false)
      }
    },
    [sport],
  )

  // Fetch odds when events change
  useEffect(() => {
    if (events.length > 0 && !isRefreshingRef.current) {
      fetchBatchOdds(events)
    }
  }, [events, fetchBatchOdds])

  // Create a function to handle refreshing data
  const refreshData = useCallback(async () => {
    // If already refreshing, don't start another refresh
    if (isRefreshingRef.current) return

    try {
      isRefreshingRef.current = true
      setRefreshing(true)

      // Refetch events - this will be handled by the parent component
      // We'll just refetch the odds data here
      if (events.length > 0) {
        await fetchBatchOdds(events)
      }

      toast({
        title: "Data refreshed",
        description: "The latest odds have been loaded",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Refresh failed",
        description: "Failed to refresh odds data",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
      isRefreshingRef.current = false
    }
  }, [events, fetchBatchOdds])

  return {
    eventsOdds,
    loadingOdds,
    errorMessage,
    refreshing,
    refreshData,
  }
}

