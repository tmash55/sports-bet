/**
 * EV Finder Service
 * Identifies positive expected value betting opportunities
 */

 import { getOdds } from "./odds-service"
 import { redis, CACHE_KEYS, CACHE_TTL } from "../upstash/redis-client"
 import type { SportKey, GameMarketKey, RegionKey } from "../constants/odds-api"
 import type { GameOdds, Bookmaker } from "../types/odds-api"
 import { getBookmakerWeight } from "../constants/bookmaker-weights"
 
 // Define the EVOpportunity type
 export type EVOpportunity = {
   id: string
   eventId: string
   eventName: string
   market: string
   selection: string
   playerName?: string // Add this property
   point?: number
   bookmaker: string
   odds: number
   consensusOdds: number
   ev: number
   timestamp: string
   commenceTime?: string
   isLive?: boolean
   region?: string
   comparisonMethod?: "consensus" | "sharp" | "weighted" // Add "weighted" method
 }
 
 // Convert American odds to implied probability
 function americanOddsToImpliedProbability(odds: number): number {
   if (odds > 0) {
     return 100 / (odds + 100)
   } else {
     return Math.abs(odds) / (Math.abs(odds) + 100)
   }
 }
 
 // Convert implied probability to American odds
 function impliedProbabilityToAmericanOdds(probability: number): number {
   if (probability <= 0 || probability >= 1) {
     throw new Error("Probability must be between 0 and 1")
   }
 
   if (probability < 0.5) {
     return Math.round(100 / probability - 100)
   } else {
     return Math.round(-100 / (1 - probability))
   }
 }
 
 // Calculate EV percentage
 function calculateEV(odds: number, consensusOdds: number): number {
   // Convert both to implied probabilities
   const impliedProbability = americanOddsToImpliedProbability(odds)
   const consensusProbability = americanOddsToImpliedProbability(consensusOdds)
 
   // Calculate EV
   // EV% = (True Probability × Decimal Odds) - 100%
   // For our purposes, we're using consensus probability as "true probability"
   const decimalOdds = odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1
   const ev = (consensusProbability * decimalOdds - 1) * 100
 
   return ev
 }
 
 // Check if a game is live/in-progress
 function isGameLive(event: GameOdds): boolean {
   // Method 1: Check if the game has already started based on commence_time
   const now = new Date()
   const gameStart = new Date(event.commence_time)
 
   if (gameStart < now) {
     // Game has started, but we should also check if it's completed
     if (event.completed) {
       return false // Game is completed, not live
     }
     return true // Game has started and is not completed, so it's live
   }
 
   // Method 2: Some APIs provide a "live" flag or in-play status
   // If your API provides this, you can use it here
   // if (event.live || event.in_play) return true
 
   // Method 3: Check if scores are present (indicates game has started)
   if (event.scores && (event.scores.home_score !== undefined || event.scores.away_score !== undefined)) {
     return true
   }
 
   return false
 }
 
 /**
  * Find consensus odds for a market outcome using only sharp bookmakers
  * If only Pinnacle is available, use that as the reference
  */
 function findSharpConsensusOdds(
   bookmakers: Bookmaker[],
   marketKey: string,
   outcomeName: string,
   point?: number,
   sharpBookmakers: string[] = ["pinnacle"],
 ): number {
   // First try to get Pinnacle odds specifically
   const pinnacleBookmaker = bookmakers.find((b) => b.key.toLowerCase() === "pinnacle")
 
   if (pinnacleBookmaker) {
     const market = pinnacleBookmaker.markets.find((m) => m.key === marketKey)
     if (market) {
       const outcome = market.outcomes.find((o) => {
         if (point !== undefined) {
           // For point-based markets like spreads and totals
           return o.name === outcomeName && Math.abs((o as any).point - point) < 0.01
         } else {
           // For non-point markets like moneyline
           return o.name === outcomeName
         }
       })
 
       if (outcome) {
         // If we found Pinnacle odds, use them directly
         return outcome.price
       }
     }
   }
 
   // If Pinnacle odds aren't available, try other sharp bookmakers
   const sharpOdds: number[] = []
 
   bookmakers.forEach((bookmaker) => {
     // Only include odds from designated sharp bookmakers
     if (!sharpBookmakers.some((sb) => bookmaker.key.toLowerCase() === sb.toLowerCase())) return
 
     const market = bookmaker.markets.find((m) => m.key === marketKey)
     if (!market) return
 
     const outcome = market.outcomes.find((o) => {
       if (point !== undefined) {
         // For point-based markets like spreads and totals
         return o.name === outcomeName && Math.abs((o as any).point - point) < 0.01
       } else {
         // For non-point markets like moneyline
         return o.name === outcomeName
       }
     })
 
     if (outcome) {
       sharpOdds.push(outcome.price)
     }
   })
 
   if (sharpOdds.length === 0) {
     // If no sharp odds available, fall back to regular consensus
     return findConsensusOdds(bookmakers, marketKey, outcomeName, point)
   }
 
   // Calculate the average of sharp odds
   const sum = sharpOdds.reduce((acc, odds) => acc + odds, 0)
   return sum / sharpOdds.length
 }
 
 // Update the findWeightedConsensusOdds function to properly track bookmaker names
 function findWeightedConsensusOdds(
   bookmakers: Bookmaker[],
   marketKey: string,
   outcomeName: string,
   sport: SportKey,
   point?: number,
   excludeBookmaker?: string,
 ): number {
   // Collect all odds for this outcome across bookmakers with their weights
   const weightedOdds: { odds: number; weight: number; bookmakerKey: string }[] = []
 
   // Get list of available bookmakers for this market
   const availableBookmakerKeys = bookmakers
     .filter((b) => !excludeBookmaker || b.key !== excludeBookmaker)
     .map((b) => b.key)
 
   // If we don't have Pinnacle, we need to adjust our approach
   const hasPinnacle = availableBookmakerKeys.some((key) => key.toLowerCase() === "pinnacle")
 
   // Log available bookmakers for debugging
   console.log(`Available bookmakers for ${sport} ${marketKey}: ${availableBookmakerKeys.join(", ")}`)
 
   // If we have fewer than 2 bookmakers after excluding, return 0
   if (availableBookmakerKeys.length < 2) {
     console.log(`Not enough bookmakers to calculate consensus for ${sport} ${marketKey}`)
     return 0
   }
 
   // If we don't have Pinnacle, boost the weights of what we do have
   const weightMultiplier = hasPinnacle ? 1.0 : 1.5
 
   bookmakers.forEach((bookmaker) => {
     // Skip the bookmaker we're comparing against
     if (excludeBookmaker && bookmaker.key === excludeBookmaker) return
 
     const market = bookmaker.markets.find((m) => m.key === marketKey)
     if (!market) return
 
     const outcome = market.outcomes.find((o) => {
       if (point !== undefined) {
         // For point-based markets like spreads and totals
         return o.name === outcomeName && Math.abs((o as any).point - point) < 0.01
       } else {
         // For non-point markets like moneyline
         return o.name === outcomeName
       }
     })
 
     if (outcome) {
       // Get the weight for this bookmaker
       let weight = getBookmakerWeight(bookmaker.key, sport, marketKey as GameMarketKey)
 
       // Apply multiplier if needed
       if (!hasPinnacle) {
         weight *= weightMultiplier
       }
 
       // Store the bookmaker key along with the odds and weight
       weightedOdds.push({ odds: outcome.price, weight, bookmakerKey: bookmaker.key })
     }
   })
 
   if (weightedOdds.length < 2) {
     console.log(`Not enough weighted odds to calculate consensus for ${sport} ${marketKey}`)
     return 0
   }
 
   // Calculate the weighted average
   const totalWeight = weightedOdds.reduce((sum, item) => sum + item.weight, 0)
   const weightedSum = weightedOdds.reduce((sum, item) => sum + item.odds * item.weight, 0)
 
   // Round the result to the nearest standard American odds value
   const rawConsensus = weightedSum / totalWeight
   const roundedConsensus = roundToStandardAmericanOdds(rawConsensus)
 
   // Log more details about the consensus calculation
   console.log(`Raw consensus: ${rawConsensus}, Rounded: ${roundedConsensus} for ${sport} ${marketKey}`)
   console.log(
     `Weighted odds details:`,
     weightedOdds.map((item) => ({
       bookmaker: item.bookmakerKey,
       odds: item.odds,
       weight: item.weight,
     })),
   )
 
   return roundedConsensus
 }
 
 // Add a new function to round to standard American odds
 function roundToStandardAmericanOdds(odds: number): number {
   // For very small values that aren't valid American odds
   if (odds > -100 && odds < 100) {
     // If close to zero or very small, convert to a reasonable value
     // based on which side of zero it's on
     return odds >= 0 ? 100 : -110
   }
 
   // For positive odds (underdogs)
   if (odds >= 100) {
     // Positive odds typically come in increments of 5
     return Math.round(odds / 5) * 5
   }
   // For negative odds (favorites)
   else if (odds <= -100) {
     // Negative odds typically come in increments of 5
     return Math.round(odds / 5) * 5
   }
 
   // This should never happen with the above conditions, but just in case
   console.warn(`Unexpected odds value: ${odds}, converting to standard value`)
   return odds >= 0 ? 100 : -110
 }
 
 /**
  * Find consensus odds for a market outcome
  */
 function findConsensusOdds(bookmakers: Bookmaker[], marketKey: string, outcomeName: string, point?: number): number {
   // Collect all odds for this outcome across bookmakers
   const allOdds: number[] = []
 
   bookmakers.forEach((bookmaker) => {
     const market = bookmaker.markets.find((m) => m.key === marketKey)
     if (!market) return
 
     const outcome = market.outcomes.find((o) => {
       if (point !== undefined) {
         // For point-based markets like spreads and totals
         return o.name === outcomeName && Math.abs((o as any).point - point) < 0.01
       } else {
         // For non-point markets like moneyline
         return o.name === outcomeName
       }
     })
 
     if (outcome) {
       allOdds.push(outcome.price)
     }
   })
 
   if (allOdds.length === 0) return 0
 
   // Sort odds and remove outliers (optional)
   allOdds.sort((a, b) => a - b)
 
   // Use median as consensus to reduce impact of outliers
   const middle = Math.floor(allOdds.length / 2)
   if (allOdds.length % 2 === 0) {
     return (allOdds[middle - 1] + allOdds[middle]) / 2
   } else {
     return allOdds[middle]
   }
 }
 
 /**
  * Find EV opportunities for a specific sport and markets
  */
 export async function findEVOpportunities(
   sport: SportKey,
   markets: GameMarketKey[],
   evThreshold = 2,
   forceRefresh = false,
   includeLiveGames = false,
   regions: RegionKey[] = ["us"],
   comparisonMethod: "consensus" | "sharp" | "weighted" = "weighted", // Default to weighted
   sharpBookmakers: string[] = ["pinnacle"],
 ): Promise<{ opportunities: EVOpportunity[]; lastUpdated: string; source: "cache" | "api" }> {
   // Create a cache key that includes the comparison method
   const cacheKey = CACHE_KEYS.EV_OPPORTUNITIES(
     sport,
     markets.join(","),
     evThreshold,
     includeLiveGames,
     regions.join(","),
     comparisonMethod,
   )
 
   // Try to get from cache first if not forcing refresh
   if (!forceRefresh) {
     const cachedData = await redis.get<{ opportunities: EVOpportunity[]; lastUpdated: string }>(cacheKey)
 
     if (cachedData) {
       return { ...cachedData, source: "cache" }
     }
   }
 
   const opportunities: EVOpportunity[] = []
 
   // Process game markets
   const gameOpportunities = await findGameEVOpportunities(
     sport,
     markets,
     evThreshold,
     includeLiveGames,
     regions,
     comparisonMethod,
     sharpBookmakers,
   )
   opportunities.push(...gameOpportunities)
 
   // Sort by EV (highest first)
   opportunities.sort((a, b) => b.ev - a.ev)
 
   // Cache the results
   const result = {
     opportunities,
     lastUpdated: new Date().toISOString(),
   }
 
   await redis.set(cacheKey, result, { ex: CACHE_TTL.EV_OPPORTUNITIES || 300 }) // 5 minutes default
 
   return { ...result, source: "api" }
 }
 
 /**
  * Find EV opportunities for game markets (moneyline, spreads, totals)
  */
 async function findGameEVOpportunities(
   sport: SportKey,
   markets: GameMarketKey[],
   evThreshold: number,
   includeLiveGames: boolean,
   regions: RegionKey[],
   comparisonMethod: "consensus" | "sharp" | "weighted" = "weighted",
   sharpBookmakers: string[] = ["pinnacle"],
 ): Promise<EVOpportunity[]> {
   // Fetch odds data for all specified regions
   const oddsPromises = regions.map((region) => getOdds(sport, markets, [region]))
   const oddsResponses = await Promise.all(oddsPromises)
 
   // Combine odds data from all regions
   const combinedOddsData: GameOdds[] = []
 
   oddsResponses.forEach((response, index) => {
     if (response.success && response.data && response.data.length > 0) {
       // Get the region for this response
       const region = regions[index]
 
       response.data.forEach((event) => {
         // Add region to each bookmaker in this response
         event.bookmakers.forEach((bookmaker) => {
           bookmaker.region = region
         })
 
         // Check if this event already exists in our combined data
         const existingEventIndex = combinedOddsData.findIndex((e) => e.id === event.id)
 
         if (existingEventIndex === -1) {
           // If event doesn't exist yet, add it
           combinedOddsData.push(event)
         } else {
           // If event exists, merge bookmakers
           const existingEvent = combinedOddsData[existingEventIndex]
 
           event.bookmakers.forEach((bookmaker) => {
             // Check if this bookmaker already exists for this event
             const existingBookmakerIndex = existingEvent.bookmakers.findIndex((b) => b.key === bookmaker.key)
 
             if (existingBookmakerIndex === -1) {
               // If bookmaker doesn't exist yet, add it
               existingEvent.bookmakers.push(bookmaker)
             } else {
               // If bookmaker exists, merge markets
               const existingBookmaker = existingEvent.bookmakers[existingBookmakerIndex]
 
               bookmaker.markets.forEach((market) => {
                 // Check if this market already exists for this bookmaker
                 const existingMarketIndex = existingBookmaker.markets.findIndex((m) => m.key === market.key)
 
                 if (existingMarketIndex === -1) {
                   // If market doesn't exist yet, add it
                   existingBookmaker.markets.push(market)
                 }
                 // If market exists, we could merge outcomes, but that's complex and might not be necessary
               })
             }
           })
         }
       })
     }
   })
 
   if (combinedOddsData.length === 0) {
     return []
   }
 
   const opportunities: EVOpportunity[] = []
 
   // Process each event
   combinedOddsData.forEach((event) => {
     // Skip events with no bookmakers
     if (!event.bookmakers || event.bookmakers.length < 2) return
 
     // Check if the game is live and filter if needed
     const gameIsLive = isGameLive(event)
     if (gameIsLive && !includeLiveGames) {
       console.log(`Skipping live game: ${event.away_team} @ ${event.home_team}`)
       return
     }
 
     // Process each market type
     markets.forEach((marketKey) => {
       // Find all bookmakers offering this market
       const bookmakersWithMarket = event.bookmakers.filter((b) => b.markets.some((m) => m.key === marketKey))
 
       // Skip if less than 2 bookmakers offer this market (need multiple for consensus)
       if (bookmakersWithMarket.length < 2) return
 
       // Process each bookmaker
       bookmakersWithMarket.forEach((bookmaker) => {
         // Skip sharp bookmakers if we're using them as reference in sharp mode
         if (
           comparisonMethod === "sharp" &&
           sharpBookmakers.some((sb) => bookmaker.key.toLowerCase() === sb.toLowerCase())
         )
           return
 
         const market = bookmaker.markets.find((m) => m.key === marketKey)
         if (!market) return
 
         // Process each outcome
         market.outcomes.forEach((outcome) => {
           // For point-based markets (spreads, totals)
           const point = (outcome as any).point
 
           // Find consensus odds based on method
           let consensusOdds: number
 
           if (comparisonMethod === "sharp") {
             consensusOdds = findSharpConsensusOdds(
               bookmakersWithMarket,
               marketKey,
               outcome.name,
               point,
               sharpBookmakers,
             )
           } else if (comparisonMethod === "weighted") {
             consensusOdds = findWeightedConsensusOdds(
               bookmakersWithMarket,
               marketKey,
               outcome.name,
               sport,
               point,
               bookmaker.key, // Exclude current bookmaker
             )
           } else {
             consensusOdds = findConsensusOdds(
               bookmakersWithMarket.filter((b) => b.key !== bookmaker.key), // Exclude current bookmaker
               marketKey,
               outcome.name,
               point,
             )
           }
 
           // Skip if no consensus odds found
           if (consensusOdds === 0) return
 
           // Calculate EV
           const ev = calculateEV(outcome.price, consensusOdds)
 
           // Only include positive EV above threshold
           if (ev >= evThreshold) {
             // Format the selection name
             let selection = outcome.name
             if (point !== undefined) {
               selection = `${outcome.name} ${point}`
             }
 
             // Create opportunity object
             opportunities.push({
               id: `${event.id}-${marketKey}-${outcome.name}-${point || 0}-${bookmaker.key}`,
               eventId: event.id,
               eventName: `${event.away_team} @ ${event.home_team}`,
               market: marketKey,
               selection,
               point: point,
               bookmaker: bookmaker.key,
               odds: outcome.price,
               consensusOdds,
               ev,
               timestamp: new Date().toISOString(),
               commenceTime: event.commence_time,
               isLive: gameIsLive,
               region: bookmaker.region || "unknown",
               comparisonMethod,
             })
           }
         })
       })
     })
   })
 
   return opportunities
 }
 
 // Update the getCachedEVOpportunities function as well
 export async function getCachedEVOpportunities(
   sport: SportKey,
   markets: GameMarketKey[],
   evThreshold = 2,
   includeLiveGames = false,
   regions: RegionKey[] = ["us"],
   comparisonMethod: "consensus" | "sharp" | "weighted" = "weighted",
   sharpBookmakers: string[] = ["pinnacle"],
 ): Promise<{ opportunities: EVOpportunity[]; lastUpdated: string; source: "cache" | "api" }> {
   const cacheKey = CACHE_KEYS.EV_OPPORTUNITIES(
     sport,
     markets.join(","),
     evThreshold,
     includeLiveGames,
     regions.join(","),
     comparisonMethod,
   )
   const cachedData = await redis.get<{ opportunities: EVOpportunity[]; lastUpdated: string }>(cacheKey)
 
   if (cachedData) {
     return { ...cachedData, source: "cache" }
   }
 
   // If not in cache, fetch fresh data
   return findEVOpportunities(
     sport,
     markets,
     evThreshold,
     false,
     includeLiveGames,
     regions,
     comparisonMethod,
     sharpBookmakers,
   )
 }
 
 