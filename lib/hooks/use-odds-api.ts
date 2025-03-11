"use client"

import { useState, useEffect } from "react"
import { type SportKey, SPORTS, PLAYER_MARKETS, SPORT_INFO, MARKET_INFO } from "../constants/odds-api"
import type { Event, PlayerProps } from "../types/odds-api"

// Generic fetch function
async function fetchApi<T>(url: string): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to fetch data")
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    console.error("API fetch error:", error)
    return {
      data: null,
      error: (error as Error).message || "An error occurred while fetching data",
    }
  }
}

// Hook for fetching sports
export function useSports() {
  const [sports, setSports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSports = async () => {
      setLoading(true)
      const { data, error } = await fetchApi<any[]>("/api/sports")

      if (error) {
        setError(error)
      } else {
        setSports(data || [])
      }

      setLoading(false)
    }

    fetchSports()
  }, [])

  return { sports, loading, error }
}

// Hook for fetching events
export function useEvents(sportKey: SportKey) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      const { data, error } = await fetchApi<Event[]>(`/api/events?sport=${sportKey}`)

      if (error) {
        setError(error)
      } else {
        setEvents(data || [])
      }

      setLoading(false)
    }

    fetchEvents()
  }, [sportKey])

  return { events, loading, error }
}

// Update the usePlayerProps hook to include oddsFormat
export function usePlayerProps(sportKey: SportKey, eventId: string | null, markets: string[]) {
  const [propData, setPropData] = useState<PlayerProps | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return

    const fetchPlayerProps = async () => {
      setLoading(true)
      const { data, error } = await fetchApi<PlayerProps>(
        `/api/player-props?sport=${sportKey}&eventId=${eventId}&markets=${markets.join(",")}&oddsFormat=american`,
      )

      if (error) {
        setError(error)
      } else {
        setPropData(data)
      }

      setLoading(false)
    }

    fetchPlayerProps()
  }, [sportKey, eventId, markets.join(",")])

  return { propData, loading, error }
}

// Helper function to get available markets for a sport
export function getMarketsForSport(sportKey: SportKey): { value: string; label: string }[] {
  if (sportKey in PLAYER_MARKETS) {
    const markets = PLAYER_MARKETS[sportKey as keyof typeof PLAYER_MARKETS]
    return Object.values(markets).map((market) => ({
      value: market,
      label: MARKET_INFO[market as keyof typeof MARKET_INFO]?.name || market,
    }))
  }
  return []
}

// Helper function to get sport options for UI
export function getSportOptions(): { value: string; label: string }[] {
  return Object.entries(SPORTS).map(([key, value]) => ({
    value,
    label: SPORT_INFO[value as keyof typeof SPORT_INFO]?.name || key,
  }))
}

