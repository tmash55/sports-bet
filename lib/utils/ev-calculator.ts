import type { BookmakerKey } from "@/lib/constants/odds-api"

/**
 * Converts American odds to implied probability
 * @param americanOdds - American odds format (e.g. +150, -110)
 * @returns Implied probability as a decimal (0-1)
 */
export function oddsToImpliedProbability(americanOdds: number): number {
  if (americanOdds === 0) return 0

  if (americanOdds > 0) {
    // Positive odds (e.g. +150)
    return 100 / (americanOdds + 100)
  } else {
    // Negative odds (e.g. -110)
    return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100)
  }
}

/**
 * Converts implied probability to American odds
 * @param probability - Implied probability as a decimal (0-1)
 * @returns American odds format
 */
export function impliedProbabilityToOdds(probability: number): number {
  if (probability <= 0 || probability >= 1) {
    throw new Error("Probability must be between 0 and 1 exclusive")
  }

  if (probability < 0.5) {
    // Positive odds
    return Math.round(100 / probability - 100)
  } else {
    // Negative odds
    return Math.round(-1 * ((probability * 100) / (1 - probability)))
  }
}

/**
 * Calculates the expected value of a bet
 * @param betAmount - Amount wagered
 * @param americanOdds - American odds format
 * @param estimatedProbability - Your estimated probability of the outcome
 * @returns Expected value of the bet
 */
export function calculateEV(betAmount: number, americanOdds: number, estimatedProbability: number): number {
  const impliedProbability = oddsToImpliedProbability(americanOdds)

  // Calculate potential profit
  let potentialProfit: number
  if (americanOdds > 0) {
    potentialProfit = (betAmount * americanOdds) / 100
  } else {
    potentialProfit = (betAmount * 100) / Math.abs(americanOdds)
  }

  // Calculate EV
  const winEV = estimatedProbability * potentialProfit
  const loseEV = (1 - estimatedProbability) * -betAmount

  return winEV + loseEV
}

/**
 * Calculates the "fair" odds based on estimated probability
 * @param estimatedProbability - Your estimated probability of the outcome
 * @returns Fair odds in American format
 */
export function calculateFairOdds(estimatedProbability: number): number {
  return impliedProbabilityToOdds(estimatedProbability)
}

/**
 * Calculates the "no-vig" probability from a set of odds
 * @param homeOdds - American odds for home team
 * @param awayOdds - American odds for away team
 * @returns No-vig probabilities for home and away
 */
export function calculateNoVigProbabilities(homeOdds: number, awayOdds: number): { home: number; away: number } {
  const homeProb = oddsToImpliedProbability(homeOdds)
  const awayProb = oddsToImpliedProbability(awayOdds)

  // Calculate the vig (margin)
  const vig = homeProb + awayProb - 1

  // Calculate no-vig probabilities
  const homeNoVig = homeProb / (homeProb + awayProb)
  const awayNoVig = awayProb / (homeProb + awayProb)

  return { home: homeNoVig, away: awayNoVig }
}

/**
 * Calculates the bookmaker's margin (vig)
 * @param odds - Array of odds for all outcomes
 * @returns The margin as a percentage
 */
export function calculateMargin(odds: number[]): number {
  const probabilities = odds.map(oddsToImpliedProbability)
  const sum = probabilities.reduce((acc, prob) => acc + prob, 0)

  return (sum - 1) * 100
}

/**
 * Finds the best odds for a given market across bookmakers
 * @param market - The market data with bookmaker odds
 * @param bookmakers - List of bookmakers to consider
 * @returns The best odds and bookmaker
 */
export function findBestOdds(
  market: Record<BookmakerKey, number>,
  bookmakers: BookmakerKey[],
): { odds: number; bookmaker: BookmakerKey } | null {
  let bestOdds = Number.NEGATIVE_INFINITY
  let bestBookmaker: BookmakerKey | null = null

  bookmakers.forEach((bookmaker) => {
    const odds = market[bookmaker]
    if (odds !== undefined && odds > bestOdds) {
      bestOdds = odds
      bestBookmaker = bookmaker
    }
  })

  if (bestBookmaker === null) return null

  return {
    odds: bestOdds,
    bookmaker: bestBookmaker,
  }
}

/**
 * Calculates the Kelly Criterion bet size
 * @param probability - Your estimated probability of winning
 * @param americanOdds - American odds offered
 * @param bankroll - Your total bankroll
 * @param fraction - Kelly fraction (0.5 = half Kelly, etc.)
 * @returns Recommended bet size
 */
export function calculateKelly(probability: number, americanOdds: number, bankroll: number, fraction = 1): number {
  let b: number // Decimal odds minus 1

  if (americanOdds > 0) {
    b = americanOdds / 100
  } else {
    b = 100 / Math.abs(americanOdds)
  }

  const q = 1 - probability
  const kelly = (probability * b - q) / b

  // Apply the Kelly fraction and ensure it's not negative
  return Math.max(0, kelly * fraction) * bankroll
}

/**
 * Calculates the closing line value (CLV)
 * @param placedOdds - Odds when the bet was placed
 * @param closingOdds - Closing odds before the event
 * @returns CLV as a percentage
 */
export function calculateCLV(placedOdds: number, closingOdds: number): number {
  const placedProb = oddsToImpliedProbability(placedOdds)
  const closingProb = oddsToImpliedProbability(closingOdds)

  return ((placedProb - closingProb) / closingProb) * 100
}

