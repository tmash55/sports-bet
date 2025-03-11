import type { SportKey, BookmakerKey } from "@/lib/constants/odds-api"

// Types for our parlay builder
export type BetType = "over" | "under" | "moneyline" | "spread"

export type ParlayLeg = {
  id: string
  sport: SportKey
  eventId: string
  eventName: string
  market: string
  marketDisplayName: string
  selection: string
  selectionDisplayName: string
  type: BetType
  odds: Partial<Record<BookmakerKey, number>> // Change to Partial
  point?: number
}

// Helper function to convert American odds to decimal
export const americanToDecimal = (americanOdds: number): number => {
  if (americanOdds > 0) {
    return 1 + americanOdds / 100
  } else {
    return 1 - 100 / americanOdds
  }
}

// Helper function to convert decimal odds to American
export const decimalToAmerican = (decimalOdds: number): number => {
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100)
  } else {
    return Math.round(-100 / (decimalOdds - 1))
  }
}

// Calculate parlay odds (multiply all decimal odds and convert back to American)
export const calculateParlayOdds = (legs: ParlayLeg[], bookmaker: BookmakerKey): number => {
  if (legs.length === 0) return 0

  // Convert all odds to decimal, multiply them, then convert back to American
  const decimalOdds = legs.reduce((acc, leg) => {
    const odds = leg.odds[bookmaker] || 0
    return acc * americanToDecimal(odds)
  }, 1)

  return decimalToAmerican(decimalOdds)
}

// Format odds for display
export const formatOdds = (price: number): string => {
  if (price === 0) return "N/A"
  return price > 0 ? `+${price}` : `${price}`
}

// Default bookmakers in order of preference
export const DEFAULT_BOOKMAKERS: BookmakerKey[] = ["draftkings", "fanduel", "betmgm", "caesars", "pointsbet"]

