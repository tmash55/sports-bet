/**
 * Kelly Criterion calculator for optimal bet sizing
 */

// Convert American odds to decimal odds
export function americanToDecimal(americanOdds: number): number {
    if (americanOdds > 0) {
      return 1 + americanOdds / 100
    } else {
      return 1 + 100 / Math.abs(americanOdds)
    }
  }
  
  // Convert American odds to implied probability
  export function americanToImpliedProbability(americanOdds: number): number {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100)
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100)
    }
  }
  
  // Calculate Kelly stake (fraction of bankroll to bet)
  export function calculateKellyStake(bookmakerOdds: number, estimatedProbability: number, kellyFraction = 1): number {
    // Convert American odds to decimal
    const decimalOdds = americanToDecimal(bookmakerOdds)
  
    // Calculate b (net decimal return)
    const b = decimalOdds - 1
  
    // Calculate Kelly fraction
    const kellyFull = (b * estimatedProbability - (1 - estimatedProbability)) / b
  
    // Apply fractional Kelly (common to use 1/4 or 1/2 Kelly for more conservative approach)
    const kelly = kellyFull * kellyFraction
  
    // Kelly can be negative if there's no edge - in that case, don't bet
    return Math.max(0, kelly)
  }
  
  // Calculate recommended wager amount based on bankroll
  export function calculateWagerAmount(
    bankroll: number,
    bookmakerOdds: number,
    consensusOdds: number,
    kellyFraction = 0.25, // Default to quarter Kelly for safety
  ): {
    stake: number
    wagerAmount: number
    expectedValue: number
    bookmakerProbability: number
    estimatedProbability: number
  } {
    // Get implied probabilities
    const bookmakerProbability = americanToImpliedProbability(bookmakerOdds)
    const estimatedProbability = americanToImpliedProbability(consensusOdds)
  
    // Calculate EV percentage
    const decimalOdds = americanToDecimal(bookmakerOdds)
    const expectedValue = (estimatedProbability * decimalOdds - 1) * 100
  
    // Calculate Kelly stake
    const stake = calculateKellyStake(bookmakerOdds, estimatedProbability, kellyFraction)
  
    // Calculate wager amount
    const wagerAmount = bankroll * stake
  
    return {
      stake,
      wagerAmount,
      expectedValue,
      bookmakerProbability,
      estimatedProbability,
    }
  }
  
  