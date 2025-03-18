"use client"

import { useState } from "react"
import type { SportKey } from "@/lib/constants/odds-api"

export function usePlayerProps(sport: SportKey) {
  const [playerPropsData, setPlayerPropsData] = useState<Record<string, any>>({})
  const [loadingPlayerProps, setLoadingPlayerProps] = useState(false)

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

  return {
    playerPropsData,
    loadingPlayerProps,
    fetchPlayerProps,
    findClosestLine,
  }
}

