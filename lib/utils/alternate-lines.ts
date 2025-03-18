import type { BookmakerKey } from "@/lib/constants/odds-api"

// Types for alternate lines
export interface AlternateLine {
  point: number
  price: number
  isAlternate: boolean
}

export interface NormalizedOdds {
  bookmaker: BookmakerKey
  line: AlternateLine | null
  isAlternate: boolean
}

/**
 * Checks if two line points are similar within a tolerance
 * @param point1 - First point value
 * @param point2 - Second point value
 * @param tolerance - Tolerance for similarity (default: 0.01)
 * @returns Boolean indicating if the points are similar
 */
export function areSimilarLines(point1: number, point2: number, tolerance = 0.01): boolean {
  return Math.abs(point1 - point2) < tolerance
}

/**
 * Finds matching lines across different sportsbooks for a specific target point
 * @param targetPoint - The point value to match (e.g., 217.5 for O/U)
 * @param market - The market type (e.g., "totals", "spreads")
 * @param bookmakers - Array of bookmaker data from the API
 * @param selection - For totals, whether it's "Over" or "Under"
 * @returns Array of normalized odds for each bookmaker
 */
export function findMatchingLines(
  targetPoint: number,
  market: string,
  bookmakers: any[],
  selection?: string,
): NormalizedOdds[] {
  if (!bookmakers || bookmakers.length === 0) return []

  // Determine the alternate market key based on the standard market
  const alternateMarketKey = getAlternateMarketKey(market)

  return bookmakers.map((bookie) => {
    // Find the standard market
    const standardMarket = bookie.markets?.find((m: any) => m.key === market)

    // For totals, we need to filter by Over/Under
    let standardLine = null
    if (standardMarket) {
      if (selection) {
        // For markets like totals that have Over/Under
        standardLine = standardMarket.outcomes?.find(
          (o: any) => o.name === selection && areSimilarLines(o.point, targetPoint),
        )
      } else {
        // For markets like spreads
        standardLine = standardMarket.outcomes?.find((o: any) => areSimilarLines(o.point, targetPoint))
      }
    }

    // Check for alternate lines
    let alternateLine = null
    if (!standardLine && alternateMarketKey) {
      const alternateMarket = bookie.markets?.find((m: any) => m.key === alternateMarketKey)

      if (alternateMarket) {
        if (selection) {
          // For totals
          alternateLine = alternateMarket.outcomes?.find(
            (o: any) => o.name === selection && areSimilarLines(o.point, targetPoint),
          )
        } else {
          // For spreads
          alternateLine = alternateMarket.outcomes?.find((o: any) => areSimilarLines(o.point, targetPoint))
        }
      }
    }

    // Return the normalized odds
    return {
      bookmaker: bookie.key,
      line: standardLine
        ? {
            point: standardLine.point,
            price: standardLine.price,
            isAlternate: false,
          }
        : alternateLine
          ? {
              point: alternateLine.point,
              price: alternateLine.price,
              isAlternate: true,
            }
          : null,
      isAlternate: !standardLine && !!alternateLine,
    }
  })
}

/**
 * Get the alternate market key for a standard market
 */
export function getAlternateMarketKey(market: string): string | null {
  switch (market) {
    case "totals":
      return "alternate_totals"
    case "spreads":
      return "alternate_spreads"
    default:
      return null
  }
}

/**
 * Finds the best odds for a specific line across all bookmakers
 * @param normalizedOdds - Array of normalized odds from findMatchingLines
 * @returns The bookmaker with the best odds and the odds value
 */
export function findBestOddsForLine(
  normalizedOdds: NormalizedOdds[],
): { bookmaker: BookmakerKey; odds: number } | null {
  if (!normalizedOdds || normalizedOdds.length === 0) return null

  let bestBookmaker: BookmakerKey | null = null
  let bestOdds = Number.NEGATIVE_INFINITY

  normalizedOdds.forEach((odds) => {
    if (odds.line && odds.line.price > bestOdds) {
      bestOdds = odds.line.price
      bestBookmaker = odds.bookmaker
    }
  })

  return bestBookmaker ? { bookmaker: bestBookmaker, odds: bestOdds } : null
}

/**
 * Calculates parlay odds using normalized lines to ensure all sportsbooks
 * are compared using the same exact lines
 */
export function calculateNormalizedParlayOdds(
  legs: any[],
  bookmaker: BookmakerKey,
  eventOddsMap: Record<string, any>,
): number | null {
  // Check if we have odds for all legs
  const allLegsHaveOdds = legs.every((leg) => {
    const eventOdds = eventOddsMap[leg.eventId]
    if (!eventOdds) return false

    // Find matching line for this leg
    const normalizedOdds = findMatchingLines(
      leg.point || 0,
      leg.market,
      eventOdds.bookmakers,
      leg.market === "totals" ? leg.selection : undefined,
    )

    // Check if this bookmaker has odds for this line
    const bookieOdds = normalizedOdds.find((odds) => odds.bookmaker === bookmaker)
    return bookieOdds && bookieOdds.line !== null
  })

  if (!allLegsHaveOdds) return null

  // Calculate the parlay odds
  let decimalOdds = 1

  legs.forEach((leg) => {
    const eventOdds = eventOddsMap[leg.eventId]
    const normalizedOdds = findMatchingLines(
      leg.point || 0,
      leg.market,
      eventOdds.bookmakers,
      leg.market === "totals" ? leg.selection : undefined,
    )

    const bookieOdds = normalizedOdds.find((odds) => odds.bookmaker === bookmaker)
    if (bookieOdds && bookieOdds.line) {
      // Convert American odds to decimal
      const americanOdds = bookieOdds.line.price
      const legDecimalOdds = americanToDecimal(americanOdds)
      decimalOdds *= legDecimalOdds
    }
  })

  // Convert back to American odds
  return decimalToAmerican(decimalOdds)
}

/**
 * Convert American odds to decimal format
 */
function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return americanOdds / 100 + 1
  } else {
    return 100 / Math.abs(americanOdds) + 1
  }
}

/**
 * Convert decimal odds to American format
 */
function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100)
  } else {
    return Math.round(-100 / (decimalOdds - 1))
  }
}

