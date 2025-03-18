"use client"

import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import type { BookmakerKey } from "@/lib/constants/odds-api"
import type { ParlayLeg } from "@/lib/utils/parlay-utils"

export function useParlayState() {
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([])

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
  const clearParlay = () => {
    setParlayLegs([])
    toast({
      title: "Parlay cleared",
      description: "All selections have been removed from your parlay",
      duration: 2000,
    })
  }

  // Find the best odds for a specific leg across all bookmakers
  const findBestOddsForLeg = (leg: ParlayLeg) => {
    if (!leg.odds) return { bookmaker: leg.bookmaker, odds: 0 }

    let bestBookmaker = leg.bookmaker
    let bestOdds = leg.odds[leg.bookmaker] || 0

    // Check all bookmakers for this leg
    Object.entries(leg.odds).forEach(([bookmaker, odds]) => {
      // For American odds, higher is better
      if (odds > bestOdds) {
        bestOdds = odds
        bestBookmaker = bookmaker as BookmakerKey
      }
    })

    return { bookmaker: bestBookmaker, odds: bestOdds }
  }

  // Switch a leg to a different bookmaker
  const switchLegBookmaker = (legId: string, newBookmaker: BookmakerKey) => {
    setParlayLegs((prev) =>
      prev.map((leg) => {
        if (leg.id === legId) {
          // If this leg has the new bookmaker's odds
          if (leg.odds && leg.odds[newBookmaker]) {
            return {
              ...leg,
              bookmaker: newBookmaker,
            }
          }
        }
        return leg
      }),
    )

    toast({
      title: "Bookmaker switched",
      description: `Switched to ${newBookmaker.toUpperCase()} for better odds`,
      duration: 2000,
    })
  }

  // Check for conflicting bets and remove them
  const removeConflictingBets = (
    events: any[],
    eventId: string,
    market: string,
    selection: string,
    point?: number,
  ): ParlayLeg[] => {
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

  return {
    parlayLegs,
    setParlayLegs,
    removeLeg,
    clearParlay,
    findBestOddsForLeg,
    switchLegBookmaker,
    removeConflictingBets,
  }
}

