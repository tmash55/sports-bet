/**
 * Odds Service
 * Handles caching and business logic for odds data
 */

 import { cache } from "react"
 import { redis, CACHE_KEYS, CACHE_TTL } from "../upstash/redis-client"
 import { oddsApiClient } from "../api/odds-api-client"
 import {
   type SportKey,
   type GameMarketKey,
   type RegionKey,
   type BookmakerKey,
   PLAYER_MARKETS,
 } from "../constants/odds-api"
 import type { ApiResponse, Event, GameOdds, PlayerProps, Sport } from "../types/odds-api"
 
 // Track API usage
 async function trackApiRequest() {
   const today = new Date().toISOString().split("T")[0]
   const key = CACHE_KEYS.API_REQUESTS(today)
 
   // Increment the counter for today
   const count = await redis.incr(key)
 
   // Set expiration if this is a new key (first request today)
   if (count === 1) {
     await redis.expire(key, 60 * 60 * 24 * 2) // 2 days
   }
 
   return count
 }
 
 /**
  * Get available sports
  * Cached for 24 hours
  */
 export const getSports = cache(async (): Promise<ApiResponse<Sport[]>> => {
   // Try to get from cache first
   const cachedSports = await redis.get<Sport[]>(CACHE_KEYS.SPORTS)
 
   if (cachedSports) {
     return { success: true, data: cachedSports }
   }
 
   // Track API request
   await trackApiRequest()
 
   // If not in cache, fetch from API
   const response = await oddsApiClient.getSports()
 
   if (response.success && response.data.length > 0) {
     // Store in Redis cache
     await redis.set(CACHE_KEYS.SPORTS, response.data, { ex: CACHE_TTL.SPORTS })
   }
 
   return response
 })
 
 /**
  * Get upcoming events for a sport
  * Cached for 5 minutes
  */
 export const getEvents = cache(async (sportKey: SportKey): Promise<ApiResponse<Event[]>> => {
   // Try to get from cache first
   const cacheKey = CACHE_KEYS.EVENTS(sportKey)
   const cachedEvents = await redis.get<Event[]>(cacheKey)
 
   if (cachedEvents) {
     return { success: true, data: cachedEvents }
   }
 
   // Track API request
   await trackApiRequest()
 
   // If not in cache, fetch from API
   const response = await oddsApiClient.getEvents({ sportKey })
 
   if (response.success && response.data.length > 0) {
     // Store in Redis cache
     await redis.set(cacheKey, response.data, { ex: CACHE_TTL.EVENTS })
   }
 
   return response
 })
 
 // Update the getOdds function to properly track the cache source
 export const getOdds = cache(
   async (
     sport: SportKey,
     markets: GameMarketKey[] = ["h2h"],
     regions: RegionKey[] = ["us"],
     bookmakers?: BookmakerKey[],
     oddsFormat: "decimal" | "american" = "american",
   ): Promise<ApiResponse<GameOdds[]>> => {
     // For multiple markets, we need to fetch from API
     if (markets.length > 1) {
       // Try to get from cache first for each event
       const eventsResponse = await getEvents(sport)
 
       if (!eventsResponse.success) {
         return { success: false, data: [], errors: ["Failed to fetch events"] }
       }
 
       const events = eventsResponse.data
       const results: GameOdds[] = []
       let allFromCache = true
 
       // Try to get odds for each event from cache
       for (const event of events) {
         let eventFound = false
 
         for (const market of markets) {
           const cacheKey = CACHE_KEYS.GAME_ODDS(event.id, market)
           const cachedOdds = await redis.get<GameOdds>(cacheKey)
 
           if (cachedOdds) {
             if (!eventFound) {
               results.push({ ...cachedOdds })
               eventFound = true
             } else {
               // Merge markets from this cached data into the existing event
               const existingEvent = results.find((e) => e.id === event.id)
               if (existingEvent) {
                 // Merge bookmakers and markets
                 cachedOdds.bookmakers.forEach((bookie) => {
                   const existingBookie = existingEvent.bookmakers.find((b) => b.key === bookie.key)
                   if (existingBookie) {
                     existingBookie.markets = [...existingBookie.markets, ...bookie.markets]
                   } else {
                     existingEvent.bookmakers.push(bookie)
                   }
                 })
               }
             }
           } else {
             allFromCache = false
             break
           }
         }
 
         if (!eventFound || !allFromCache) {
           break
         }
       }
 
       // If we found all events with all markets in cache, return them
       if (allFromCache && results.length > 0) {
         return { success: true, data: results, source: "cache" }
       }
 
       // Otherwise, fetch from API
       // Track API request
       await trackApiRequest()
 
       const response = await oddsApiClient.getOdds({
         sport,
         markets,
         regions,
         bookmakers,
         oddsFormat,
       })
 
       if (response.success) {
         // Cache each event's odds for each market
         for (const odds of response.data) {
           for (const market of markets) {
             // Filter the odds data to only include this market
             const marketData = {
               ...odds,
               bookmakers: odds.bookmakers
                 .map((bookie) => ({
                   ...bookie,
                   markets: bookie.markets.filter((m) => m.key === market),
                 }))
                 .filter((bookie) => bookie.markets.length > 0),
             }
 
             if (marketData.bookmakers.length > 0) {
               const cacheKey = CACHE_KEYS.GAME_ODDS(odds.id, market)
               await redis.set(cacheKey, marketData, { ex: CACHE_TTL.GAME_ODDS })
             }
           }
         }
       }
 
       return { ...response, source: "api" }
     }
 
     // For a single market, we can try to get from cache
     const market = markets[0]
 
     // We need to fetch all events first
     const eventsResponse = await getEvents(sport)
 
     if (!eventsResponse.success) {
       return { success: false, data: [], errors: ["Failed to fetch events"] }
     }
 
     const events = eventsResponse.data
     const results: GameOdds[] = []
 
     // Try to get odds for each event from cache
     for (const event of events) {
       const cacheKey = CACHE_KEYS.GAME_ODDS(event.id, market)
       const cachedOdds = await redis.get<GameOdds>(cacheKey)
 
       if (cachedOdds) {
         results.push(cachedOdds)
       }
     }
 
     // If we found all events in cache, return them
     if (results.length === events.length) {
       return { success: true, data: results, source: "cache" }
     }
 
     // Otherwise, fetch from API
     // Track API request
     await trackApiRequest()
 
     const response = await oddsApiClient.getOdds({
       sport,
       markets,
       regions,
       bookmakers,
       oddsFormat,
     })
 
     if (response.success) {
       // Cache each event's odds
       for (const odds of response.data) {
         const cacheKey = CACHE_KEYS.GAME_ODDS(odds.id, market)
         await redis.set(cacheKey, odds, { ex: CACHE_TTL.GAME_ODDS })
       }
     }
 
     return { ...response, source: "api" }
   },
 )
 
 /**
  * Get player props for a specific event
  * Cached for 5 minutes
  * Updated to handle alternate markets
  */
 export const getPlayerProps = cache(
   async (
     sportKey: SportKey,
     eventId: string,
     markets: string[],
     regions: RegionKey[] = ["us"],
     oddsFormat: "decimal" | "american" = "american",
   ): Promise<ApiResponse<PlayerProps>> => {
     // Create a cache key for this specific combination of markets
     const cacheKey = CACHE_KEYS.PLAYER_PROPS(eventId, markets.join(","))
     const cachedProps = await redis.get<PlayerProps>(cacheKey)
 
     if (cachedProps) {
       return { success: true, data: cachedProps, source: "cache" }
     }
 
     // Group markets by base type to minimize API calls
     // For example, player_points and player_points_alternate can be fetched in one call
     const marketGroups = new Map<string, string[]>()
 
     markets.forEach((market) => {
       // Determine the base market (without _alternate suffix)
       const baseMarket = market.endsWith("_alternate") ? market.replace("_alternate", "") : market
 
       if (!marketGroups.has(baseMarket)) {
         marketGroups.set(baseMarket, [])
       }
 
       // Add the current market to its group
       marketGroups.get(baseMarket)!.push(market)
 
       // If this is a base market, also add its alternate version if requested
       if (market === baseMarket && markets.includes(`${market}_alternate`)) {
         marketGroups.get(baseMarket)!.push(`${market}_alternate`)
       }
     })
 
     // Make API calls for each unique base market
     const apiPromises = Array.from(marketGroups.entries()).map(async ([baseMarket, relatedMarkets]) => {
       // Track API request
       await trackApiRequest()
 
       // We need to fetch both the base market and its alternate version in one call
       const apiMarketsToFetch = [baseMarket]
       if (relatedMarkets.some((m) => m.endsWith("_alternate"))) {
         apiMarketsToFetch.push(`${baseMarket}_alternate`)
       }
 
       return oddsApiClient.getPlayerProps({
         sportKey,
         eventId,
         markets: apiMarketsToFetch,
         regions,
         oddsFormat,
       })
     })
 
     const apiResults = await Promise.all(apiPromises)
 
     // Check if any API calls failed
     const failedResults = apiResults.filter((result) => !result.success)
     if (failedResults.length > 0) {
       return {
         success: false,
         data: null as any, // Include data property to satisfy the type
         errors: failedResults.flatMap((r) => r.errors || ["Unknown error"]),
         source: "api",
       }
     }
 
     // Process and combine the results
     let combinedData: PlayerProps | null = null
 
     apiResults.forEach((response) => {
       if (!response.success || !response.data) return
 
       if (!combinedData) {
         // Initialize with the first result
         combinedData = { ...response.data }
 
         // Process bookmakers to mark which markets are standard vs alternate
         combinedData.bookmakers = response.data.bookmakers.map((bookmaker) => ({
           ...bookmaker,
           markets: bookmaker.markets.map((m) => {
             // Determine if this is a standard or alternate market
             const isAlternate = m.key.endsWith("_alternate")
             const marketKey = isAlternate ? m.key.replace("_alternate", "") : m.key
 
             return {
               ...m,
               key: marketKey, // Store the base market key (without _alternate)
               isAlternate, // Flag to indicate if this is an alternate market
             }
           }),
         }))
       } else {
         // Merge additional markets into existing bookmakers
         response.data.bookmakers.forEach((apiBookmaker) => {
           const existingBookmaker = combinedData!.bookmakers.find((b) => b.key === apiBookmaker.key)
 
           if (existingBookmaker) {
             // Process and add markets to existing bookmaker
             apiBookmaker.markets.forEach((apiMarket) => {
               const isAlternate = apiMarket.key.endsWith("_alternate")
               const marketKey = isAlternate ? apiMarket.key.replace("_alternate", "") : apiMarket.key
 
               existingBookmaker.markets.push({
                 ...apiMarket,
                 key: marketKey,
                 isAlternate,
               })
             })
           } else {
             // Add new bookmaker with processed markets
             combinedData!.bookmakers.push({
               ...apiBookmaker,
               markets: apiBookmaker.markets.map((m) => {
                 const isAlternate = m.key.endsWith("_alternate")
                 const marketKey = isAlternate ? m.key.replace("_alternate", "") : m.key
 
                 return {
                   ...m,
                   key: marketKey,
                   isAlternate,
                 }
               }),
             })
           }
         })
       }
     })
 
     if (!combinedData) {
       return {
         success: false,
         data: null as any, // Include data property to satisfy the type
         errors: ["No data returned from API"],
         source: "api",
       }
     }
 
     // Cache the combined data
     await redis.set(cacheKey, combinedData, { ex: CACHE_TTL.PLAYER_PROPS })
 
     return { success: true, data: combinedData, source: "api" }
   },
 )
 
 /**
  * Get all available player prop markets for a sport
  */
 export function getAvailablePlayerMarkets(sportKey: SportKey): string[] {
   if (sportKey in PLAYER_MARKETS) {
     const markets = PLAYER_MARKETS[sportKey as keyof typeof PLAYER_MARKETS]
     return Object.values(markets)
   }
   return []
 }
 
 /**
  * Get player props for multiple events
  */
 export async function getPlayerPropsForMultipleEvents(
   sportKey: SportKey,
   eventIds: string[],
   markets: string[],
   regions: RegionKey[] = ["us"],
 ): Promise<ApiResponse<PlayerProps[]>> {
   return oddsApiClient.getPlayerPropsForMultipleEvents({
     sportKey,
     eventIds,
     markets,
     regions,
   })
 }
 
 /**
  * Compare player props across different bookmakers
  */
 export function comparePlayerProps(
   playerProps: PlayerProps[],
   playerName: string,
   market: string,
 ): Record<string, { point: number; price: number }> {
   const result: Record<string, { point: number; price: number }> = {}
 
   playerProps.forEach((prop) => {
     prop.bookmakers.forEach((bookmaker) => {
       const marketData = bookmaker.markets.find((m) => m.key === market)
       if (!marketData) return
 
       const outcome = marketData.outcomes.find((o) => o.name === playerName)
       if (!outcome) return
 
       result[bookmaker.key] = {
         point: (outcome as any).point,
         price: (outcome as any).price,
       }
     })
   })
 
   return result
 }
 
 /**
  * Get API usage statistics
  */
 export async function getApiUsageStats() {
   const today = new Date().toISOString().split("T")[0]
   const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
 
   const [todayCount, yesterdayCount] = await Promise.all([
     redis.get(CACHE_KEYS.API_REQUESTS(today)) || 0,
     redis.get(CACHE_KEYS.API_REQUESTS(yesterday)) || 0,
   ])
 
   return {
     today: Number(todayCount),
     yesterday: Number(yesterdayCount),
     total: Number(todayCount) + Number(yesterdayCount),
   }
 }
 
 