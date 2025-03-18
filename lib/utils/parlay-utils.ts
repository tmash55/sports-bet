import type { SportKey, BookmakerKey } from "@/lib/constants/odds-api"

// Define the default bookmakers
export const DEFAULT_BOOKMAKERS: BookmakerKey[] = [
  "fanduel",
  "draftkings",
  "betmgm",
  "caesars",
  "pointsbet",
  "bet365",
  "pinnacle",
  "bovada",
  "betonline",
  "fanatics",
  "caesars",
  "betrivers",
]

// Define the BetType type
export type BetType = "spread" | "moneyline" | "over" | "under" | "player_prop"

// Define the ParlayLeg type
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
  odds: Partial<Record<BookmakerKey, number>>
  point?: number
  bookmaker: BookmakerKey // Changed from optional to required
  alternateLines?: Array<{
    bookmaker: string
    point: number
    price: number
    diff: number
  }>
}

// Calculate parlay odds (American format)
export function calculateParlayOdds(parlayLegs: ParlayLeg[], bookmaker?: BookmakerKey): number {
  if (!parlayLegs || parlayLegs.length === 0) return 0

  // Get odds for each leg from the specified bookmaker, or use the leg's bookmaker if not specified
  const odds = parlayLegs.map((leg) => {
    if (bookmaker && leg.odds[bookmaker] !== undefined) {
      return leg.odds[bookmaker]
    }
    return leg.odds[leg.bookmaker]
  })

  // Convert all American odds to decimal
  const decimalOdds = odds.map((odd) => americanToDecimal(odd))

  // Multiply all decimal odds together
  const combinedDecimalOdds = decimalOdds.reduce((acc, odd) => acc * odd, 1)

  // Convert back to American odds
  if (combinedDecimalOdds > 2) {
    return Math.round((combinedDecimalOdds - 1) * 100)
  } else {
    return Math.round(-100 / (combinedDecimalOdds - 1))
  }
}

// Convert American odds to decimal format
export const americanToDecimal = (americanOdds: number): number => {
  if (americanOdds === 0) return 1
  if (americanOdds > 0) {
    return 1 + americanOdds / 100
  } else {
    return 1 + 100 / Math.abs(americanOdds) // Fixed formula for negative odds
  }
}

// Format odds for display
export function formatOdds(odds: number): string {
  if (!odds) return "N/A"
  return odds > 0 ? `+${odds}` : `${odds}`
}

