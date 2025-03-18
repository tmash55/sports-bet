import { SPORTS, GAME_MARKETS } from "./odds-api"
import type { SportKey, GameMarketKey } from "./odds-api"

// Define weights for different bookmakers by sport and market
// Higher weight = more influence on the consensus odds
const DEFAULT_MARKET_WEIGHTS: Record<GameMarketKey, Record<string, number>> = Object.fromEntries(
  Object.values(GAME_MARKETS).map((market) => [market, {}])
) as Record<GameMarketKey, Record<string, number>>;
export const BOOKMAKER_WEIGHTS: Record<SportKey, Record<GameMarketKey, Record<string, number>>> = {
  [SPORTS.NBA]: {
    ...DEFAULT_MARKET_WEIGHTS,
    [GAME_MARKETS.MONEYLINE]: {
      pinnacle: 5.0, // Keep Pinnacle at 5.0 as our reference
      draftkings: 4.97, // Very close to Pinnacle
      betmgm: 4.39, // Lowest but still relatively high
      bet365: 4.7, // Not mentioned in article, estimate based on other markets
      fanduel: 4.6,
      caesars: 4.5,
      pointsbet: 4.0,
      betonline: 4.92, // Close to Pinnacle
    },
    [GAME_MARKETS.SPREADS]: {
      // Same as moneyline for NBA
      pinnacle: 5.0,
      draftkings: 4.97,
      betmgm: 4.39,
      bet365: 4.7,
      fanduel: 4.6,
      caesars: 4.5,
      pointsbet: 4.0,
      betonline: 4.92,
    },
    [GAME_MARKETS.TOTALS]: {
      // Same as moneyline for NBA
      pinnacle: 5.0,
      draftkings: 4.97,
      betmgm: 4.39,
      bet365: 4.7,
      fanduel: 4.6,
      caesars: 4.5,
      pointsbet: 4.0,
      betonline: 4.92,
    },
  },
  [SPORTS.NCAAB]: {
    ...DEFAULT_MARKET_WEIGHTS,
    [GAME_MARKETS.MONEYLINE]: {
      pinnacle: 5.0,
      bet365: 4.5,
      draftkings: 4.3,
      fanduel: 4.2,
      betmgm: 4.0,
      caesars: 4.0,
      pointsbet: 3.8,
      betrivers: 4.0,
      bovada: 3.9,
      fanatics: 3.8,
      williamhill_us: 4.1,
      mybookieag: 3.7,
      betonline: 3.8,
      betonlineag: 3.8,
      betus: 3.7,
      lowvig: 4.1,
    },
    [GAME_MARKETS.SPREADS]: {
      pinnacle: 5.0,
      bet365: 4.5,
      draftkings: 4.4,
      fanduel: 4.2,
      betmgm: 4.0,
      caesars: 4.0,
      pointsbet: 3.8,
      betrivers: 4.0,
      bovada: 3.9,
      fanatics: 3.8,
      williamhill_us: 4.1,
      mybookieag: 3.7,
      betonline: 3.8,
      betonlineag: 3.8,
      betus: 3.7,
      lowvig: 4.1,
    },
    [GAME_MARKETS.TOTALS]: {
      pinnacle: 5.0,
      bet365: 4.5,
      draftkings: 4.3,
      fanduel: 4.2,
      betmgm: 4.0,
      caesars: 4.0,
      pointsbet: 3.8,
      betrivers: 4.0,
      bovada: 3.9,
      fanatics: 3.8,
      williamhill_us: 4.1,
      mybookieag: 3.7,
      betonline: 3.8,
      betonlineag: 3.8,
      betus: 3.7,
      lowvig: 4.1,
    },
  },
  [SPORTS.NFL]: {
    ...DEFAULT_MARKET_WEIGHTS,
    [GAME_MARKETS.MONEYLINE]: {
      pinnacle: 5.0,
      bet365: 2.0,
      draftkings: 1.8,
      fanduel: 1.8,
      betmgm: 1.5,
      caesars: 1.5,
      pointsbet: 1.0,
    },
    [GAME_MARKETS.SPREADS]: {
      pinnacle: 5.0,
      bet365: 2.0,
      draftkings: 2.0,
      fanduel: 1.8,
      betmgm: 1.5,
      caesars: 1.5,
      pointsbet: 1.0,
    },
    [GAME_MARKETS.TOTALS]: {
      pinnacle: 5.0,
      bet365: 2.0,
      draftkings: 1.8,
      fanduel: 1.8,
      betmgm: 1.5,
      caesars: 1.5,
      pointsbet: 1.0,
    },
  },
  [SPORTS.MLB]: {
    ...DEFAULT_MARKET_WEIGHTS,
    [GAME_MARKETS.MONEYLINE]: {
      pinnacle: 5.0, // Keep Pinnacle at 5.0 as our reference
      draftkings: 4.34, // Notably lower
      fanduel: 4.33, // Similar to DraftKings
      betmgm: 3.97, // Lowest
      bet365: 4.3, // Not mentioned in article, estimate
      caesars: 4.2,
      pointsbet: 4.0,
    },
    [GAME_MARKETS.SPREADS]: {
      // Same as moneyline for MLB
      pinnacle: 5.0,
      draftkings: 4.34,
      fanduel: 4.33,
      betmgm: 3.97,
      bet365: 4.3,
      caesars: 4.2,
      pointsbet: 4.0,
    },
    [GAME_MARKETS.TOTALS]: {
      // Same as moneyline for MLB
      pinnacle: 5.0,
      draftkings: 4.34,
      fanduel: 4.33,
      betmgm: 3.97,
      bet365: 4.3,
      caesars: 4.2,
      pointsbet: 4.0,
    },
  },
  [SPORTS.NHL]: {
    ...DEFAULT_MARKET_WEIGHTS,
    [GAME_MARKETS.MONEYLINE]: {
      pinnacle: 5.0,
      bet365: 4.6,
      draftkings: 4.4,
      fanduel: 4.3,
      betmgm: 4.1,
      caesars: 4.1,
      pointsbet: 3.9,
      betrivers: 4.0,
      bovada: 3.9,
      fanatics: 3.8,
      williamhill_us: 4.2,
      mybookieag: 3.7,
      betonline: 3.8,
      betonlineag: 3.8,
      betus: 3.7,
      lowvig: 4.2,
    },
    [GAME_MARKETS.SPREADS]: {
      pinnacle: 5.0,
      bet365: 4.6,
      draftkings: 4.4,
      fanduel: 4.3,
      betmgm: 4.1,
      caesars: 4.1,
      pointsbet: 3.9,
      betrivers: 4.0,
      bovada: 3.9,
      fanatics: 3.8,
      williamhill_us: 4.2,
      mybookieag: 3.7,
      betonline: 3.8,
      betonlineag: 3.8,
      betus: 3.7,
      lowvig: 4.2,
    },
    [GAME_MARKETS.TOTALS]: {
      pinnacle: 5.0,
      bet365: 4.6,
      draftkings: 4.4,
      fanduel: 4.3,
      betmgm: 4.1,
      caesars: 4.1,
      pointsbet: 3.9,
      betrivers: 4.0,
      bovada: 3.9,
      fanatics: 3.8,
      williamhill_us: 4.2,
      mybookieag: 3.7,
      betonline: 3.8,
      betonlineag: 3.8,
      betus: 3.7,
      lowvig: 4.2,
    },
  },
  [SPORTS.NCAAF]: {
    ...DEFAULT_MARKET_WEIGHTS,
    [GAME_MARKETS.MONEYLINE]: {
      pinnacle: 5.0,
      bet365: 2.0,
      draftkings: 1.8,
      fanduel: 1.8,
      betmgm: 1.5,
      caesars: 1.5,
      pointsbet: 1.0,
    },
    [GAME_MARKETS.SPREADS]: {
      pinnacle: 5.0,
      bet365: 2.0,
      draftkings: 2.0,
      fanduel: 1.8,
      betmgm: 1.5,
      caesars: 1.5,
      pointsbet: 1.0,
    },
    [GAME_MARKETS.TOTALS]: {
      pinnacle: 5.0,
      bet365: 2.0,
      draftkings: 1.8,
      fanduel: 1.8,
      betmgm: 1.5,
      caesars: 1.5,
      pointsbet: 1.0,
    },
  },
  [SPORTS.UFC]: {
    ...DEFAULT_MARKET_WEIGHTS,
    [GAME_MARKETS.MONEYLINE]: {
      pinnacle: 5.0,
      draftkings: 2.5, // DraftKings is sharper for UFC
      bet365: 2.0,
      fanduel: 1.5,
      betmgm: 1.2,
      caesars: 1.2,
      pointsbet: 1.0,
    },
    [GAME_MARKETS.SPREADS]: {
      pinnacle: 5.0,
      draftkings: 2.5,
      bet365: 2.0,
      fanduel: 1.5,
      betmgm: 1.2,
      caesars: 1.2,
      pointsbet: 1.0,
    },
    [GAME_MARKETS.TOTALS]: {
      pinnacle: 5.0,
      draftkings: 2.5,
      bet365: 2.0,
      fanduel: 1.5,
      betmgm: 1.2,
      caesars: 1.2,
      pointsbet: 1.0,
    },
  },
  [SPORTS.EPL]: {
    ...DEFAULT_MARKET_WEIGHTS,
    [GAME_MARKETS.MONEYLINE]: {
      pinnacle: 5.0,
      bet365: 3.0, // Bet365 is sharper for soccer
      draftkings: 1.5,
      fanduel: 1.5,
      betmgm: 1.2,
      caesars: 1.2,
      pointsbet: 1.0,
    },
    [GAME_MARKETS.SPREADS]: {
      pinnacle: 5.0,
      bet365: 3.0,
      draftkings: 1.5,
      fanduel: 1.5,
      betmgm: 1.2,
      caesars: 1.2,
      pointsbet: 1.0,
    },
    [GAME_MARKETS.TOTALS]: {
      pinnacle: 5.0,
      bet365: 3.0,
      draftkings: 1.5,
      fanduel: 1.5,
      betmgm: 1.2,
      caesars: 1.2,
      pointsbet: 1.0,
    },
  },
}

// Separate object for player props weights
export const PLAYER_PROPS_WEIGHTS: Record<string, Record<string, number>> = {
  nba: {
    fanduel: 4.6, // Scale from article's 1.007
    draftkings: 4.8, // Scale from article's 1.046
    pinnacle: 4.5, // Not specifically mentioned for NBA props
    caesars: 4.55, // Scale from article's 0.995
    kambi: 2.9, // Much lower per article
    betmgm: 4.0, // Not mentioned, estimate
    pointsbet: 3.8,
    bet365: 4.2,
  },
  mlb: {
    fanduel: 5.0, // Highest per article
    pinnacle: 3.7, // Scale from article's 0.918
    caesars: 3.7, // Scale from article's 0.916
    draftkings: 3.5, // Scale from article's 0.859
    kambi: 2.2, // Much lower per article
    betmgm: 3.3, // Not mentioned, estimate
    pointsbet: 3.0,
    bet365: 3.5,
  },
}

// Get the weight for a specific bookmaker, sport, and market
export function getBookmakerWeight(bookmaker: string, sport: SportKey, market: GameMarketKey): number {
  // Default weight if not specified
  const DEFAULT_WEIGHT = 1.0

  // Normalize bookmaker key to lowercase for comparison
  const bookmakerKey = bookmaker.toLowerCase()

  // Handle player props specially
  if (market.includes("player_") || market.includes("pitcher_") || market.includes("batter_")) {
    // Use NBA player props weights for NBA
    if (sport === SPORTS.NBA || sport === SPORTS.NCAAB) {
      return PLAYER_PROPS_WEIGHTS["nba"][bookmakerKey] || DEFAULT_WEIGHT
    }

    // Use MLB player props weights for MLB
    if (sport === SPORTS.MLB) {
      return PLAYER_PROPS_WEIGHTS["mlb"][bookmakerKey] || DEFAULT_WEIGHT
    }
  }

  // Check if we have weights for this sport
  if (!BOOKMAKER_WEIGHTS[sport]) {
    return DEFAULT_WEIGHT
  }

  // Check if we have weights for this market
  if (!BOOKMAKER_WEIGHTS[sport][market]) {
    return DEFAULT_WEIGHT
  }

  // Return the weight for this bookmaker, or the default weight if not specified
  return BOOKMAKER_WEIGHTS[sport][market][bookmakerKey] || DEFAULT_WEIGHT
}

// Add a new function to get available bookmakers with weights
export function getAvailableBookmakerWeights(
  availableBookmakers: string[],
  sport: SportKey,
  market: GameMarketKey,
): Record<string, number> {
  const result: Record<string, number> = {}

  // Get weights only for available bookmakers
  availableBookmakers.forEach((bookmaker) => {
    result[bookmaker] = getBookmakerWeight(bookmaker, sport, market)
  })

  return result
}

