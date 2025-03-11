/**
 * Utility functions for fetching data from the odds-api
 */

 type Sport = "americanfootball_nfl" | "basketball_nba" | "baseball_mlb" | "icehockey_nhl" | string
 type Market = "h2h" | "spreads" | "totals" | "player_points" | "player_rebounds" | "player_assists" | string
 type Region = "us" | "uk" | "eu" | "au" | string
 type Bookmaker = "fanduel" | "draftkings" | "betmgm" | "caesars" | "pointsbet" | string
 
 export type OddsResponse = {
   success: boolean
   data: any[]
   errors?: string[]
 }
 
 export type Event = {
   id: string
   sport_key: string
   sport_title: string
   commence_time: string
   home_team: string
   away_team: string
 }
 
 /**
  * Fetches odds from the odds-api
  * @param sport - Sport key (e.g., 'americanfootball_nfl')
  * @param markets - Markets to fetch (e.g., 'h2h', 'spreads')
  * @param regions - Regions for odds format (e.g., 'us' for American odds)
  * @param bookmakers - Optional list of bookmakers to filter by
  * @param dateFormat - Optional date format (iso, unix)
  * @param oddsFormat - Optional odds format (decimal, american)
  * @returns Promise with the odds data
  */
 export async function getOdds({
   sport,
   markets = ["h2h"],
   regions = ["us"],
   bookmakers,
   dateFormat = "iso",
   oddsFormat = "american",
 }: {
   sport: Sport
   markets?: Market[]
   regions?: Region[]
   bookmakers?: Bookmaker[]
   dateFormat?: "iso" | "unix"
   oddsFormat?: "decimal" | "american"
 }): Promise<OddsResponse> {
   if (!process.env.ODDS_API_KEY) {
     throw new Error("ODDS_API_KEY is not defined in environment variables")
   }
 
   try {
     // Build URL with query parameters
     const baseUrl = "https://api.the-odds-api.com/v4/sports"
     const url = new URL(`${baseUrl}/${sport}/odds`)
 
     // Add query parameters
     url.searchParams.append("apiKey", process.env.ODDS_API_KEY)
     url.searchParams.append("markets", markets.join(","))
     url.searchParams.append("regions", regions.join(","))
     url.searchParams.append("dateFormat", dateFormat)
     url.searchParams.append("oddsFormat", oddsFormat)
 
     if (bookmakers && bookmakers.length > 0) {
       url.searchParams.append("bookmakers", bookmakers.join(","))
     }
 
     // Make the request
     const response = await fetch(url.toString())
 
     if (!response.ok) {
       const errorText = await response.text()
       throw new Error(`API request failed with status ${response.status}: ${errorText}`)
     }
 
     const data = await response.json()
     return { success: true, data }
   } catch (error) {
     console.error("Error fetching odds:", error)
     return {
       success: false,
       data: [],
       errors: [(error as Error).message],
     }
   }
 }
 
 /**
  * Fetches available sports from the odds-api
  * @returns Promise with the available sports data
  */
 export async function getAvailableSports(): Promise<OddsResponse> {
   if (!process.env.ODDS_API_KEY) {
     throw new Error("ODDS_API_KEY is not defined in environment variables")
   }
 
   try {
     const url = `https://api.the-odds-api.com/v4/sports?apiKey=${process.env.ODDS_API_KEY}`
     const response = await fetch(url)
 
     if (!response.ok) {
       const errorText = await response.text()
       throw new Error(`API request failed with status ${response.status}: ${errorText}`)
     }
 
     const data = await response.json()
     return { success: true, data }
   } catch (error) {
     console.error("Error fetching available sports:", error)
     return {
       success: false,
       data: [],
       errors: [(error as Error).message],
     }
   }
 }
 
 /**
  * Fetches upcoming events for a specific sport
  * @param sportKey - Sport key (e.g., 'basketball_nba')
  * @param dateFormat - Optional date format (iso, unix)
  * @returns Promise with the upcoming events data
  */
 export async function getUpcomingEvents({
   sportKey,
   dateFormat = "iso",
 }: {
   sportKey: Sport
   dateFormat?: "iso" | "unix"
 }): Promise<OddsResponse> {
   if (!process.env.ODDS_API_KEY) {
     throw new Error("ODDS_API_KEY is not defined in environment variables")
   }
 
   try {
     const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/events`)
     url.searchParams.append("apiKey", process.env.ODDS_API_KEY)
     url.searchParams.append("dateFormat", dateFormat)
 
     const response = await fetch(url.toString())
 
     if (!response.ok) {
       const errorText = await response.text()
       throw new Error(`API request failed with status ${response.status}: ${errorText}`)
     }
 
     const data = await response.json()
     return { success: true, data }
   } catch (error) {
     console.error("Error fetching upcoming events:", error)
     return {
       success: false,
       data: [],
       errors: [(error as Error).message],
     }
   }
 }
 
 /**
  * Fetches player props for a specific event
  * @param sportKey - Sport key (e.g., 'basketball_nba')
  * @param eventId - Event ID to fetch props for
  * @param markets - Markets to fetch (e.g., 'player_points', 'player_rebounds')
  * @param regions - Regions for odds format (e.g., 'us' for American odds)
  * @param oddsFormat - Optional odds format (decimal, american)
  * @returns Promise with the player props data
  */
 export async function getPlayerProps({
   sportKey,
   eventId,
   markets,
   regions = ["us"],
   oddsFormat = "american",
 }: {
   sportKey: Sport
   eventId: string
   markets: Market[]
   regions?: Region[]
   oddsFormat?: "decimal" | "american"
 }): Promise<OddsResponse> {
   if (!process.env.ODDS_API_KEY) {
     throw new Error("ODDS_API_KEY is not defined in environment variables")
   }
 
   try {
     // Build URL with query parameters
     const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/events/${eventId}/odds`)
 
     // Add query parameters
     url.searchParams.append("apiKey", process.env.ODDS_API_KEY)
     url.searchParams.append("markets", markets.join(","))
     url.searchParams.append("regions", regions.join(","))
     url.searchParams.append("oddsFormat", oddsFormat)
 
     // Make the request
     const response = await fetch(url.toString())
 
     if (!response.ok) {
       const errorText = await response.text()
       throw new Error(`API request failed with status ${response.status}: ${errorText}`)
     }
 
     const data = await response.json()
     return { success: true, data }
   } catch (error) {
     console.error("Error fetching player props:", error)
     return {
       success: false,
       data: [],
       errors: [(error as Error).message],
     }
   }
 }
 
 /**
  * Fetches player props for multiple events
  * This function handles rate limiting by adding a delay between requests
  * @param sportKey - Sport key (e.g., 'basketball_nba')
  * @param eventIds - Array of event IDs to fetch props for
  * @param markets - Markets to fetch (e.g., 'player_points', 'player_rebounds')
  * @param regions - Regions for odds format (e.g., 'us' for American odds)
  * @param delayMs - Delay between requests in milliseconds (default: 1000ms)
  * @returns Promise with the player props data for all events
  */
 export async function getPlayerPropsForMultipleEvents({
   sportKey,
   eventIds,
   markets,
   regions = ["us"],
   delayMs = 1000,
 }: {
   sportKey: Sport
   eventIds: string[]
   markets: Market[]
   regions?: Region[]
   delayMs?: number
 }): Promise<OddsResponse> {
   const results: any[] = []
   const errors: string[] = []
 
   for (let i = 0; i < eventIds.length; i++) {
     const eventId = eventIds[i]
 
     try {
       // Add delay between requests to avoid rate limiting
       if (i > 0) {
         await new Promise((resolve) => setTimeout(resolve, delayMs))
       }
 
       const response = await getPlayerProps({
         sportKey,
         eventId,
         markets,
         regions,
       })
 
       if (response.success && response.data) {
         results.push(...response.data)
       } else if (response.errors) {
         errors.push(...response.errors)
       }
     } catch (error) {
       errors.push(`Error fetching props for event ${eventId}: ${(error as Error).message}`)
     }
   }
 
   return {
     success: errors.length === 0,
     data: results,
     errors: errors.length > 0 ? errors : undefined,
   }
 }
 
 