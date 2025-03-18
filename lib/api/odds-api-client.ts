/**
 * Odds API Client
 */

 import type { SportKey, RegionKey } from "../constants/odds-api"
 import { getMockEvents, getMockEventOdds, getMockSports } from "../mock/mock-odds-data"
 
 import type {
   ApiResponse,
   Event,
   GameOdds,
   PlayerProps,
   Sport,
   OddsRequestParams,
   EventsRequestParams,
   PlayerPropsRequestParams,
 } from "../types/odds-api"
 
 // Update the USE_MOCK_DATA flag to default to false now that we have upgraded
 export let USE_MOCK_DATA = false
 
 // Check localStorage in client-side environments
 if (typeof window !== "undefined") {
   const storedValue = localStorage.getItem("USE_MOCK_DATA")
   USE_MOCK_DATA = storedValue !== null ? storedValue === "true" : false
 }
 
 /**
  * Base class for Odds API client
  */
 class OddsApiClient {
   private apiKey: string
   private baseUrl = "https://api.the-odds-api.com/v4"
   private requestCount = 0
   private lastRequestTime = 0
 
   constructor() {
     const apiKey = process.env.ODDS_API_KEY
     if (!apiKey) {
       throw new Error("ODDS_API_KEY is not defined in environment variables")
     }
     this.apiKey = apiKey
   }
 
   /**
    * Make a request to the Odds API
    */
   protected async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
     // If using mock data, don't make real API calls
     if (USE_MOCK_DATA) {
       if (endpoint === "/sports") {
         return { success: true, data: getMockSports() as unknown as T }
       }
 
       // Extract sport from endpoint for events
       const sportMatch = endpoint.match(/\/sports\/([^/]+)\/events/)
       if (sportMatch) {
         const sport = sportMatch[1] as SportKey
         return { success: true, data: getMockEvents(sport) as unknown as T }
       }
 
       // Extract sport and eventId for odds
       const oddsMatch = endpoint.match(/\/sports\/([^/]+)\/events\/([^/]+)\/odds/)
       if (oddsMatch) {
         const sport = oddsMatch[1] as SportKey
         const eventId = oddsMatch[2]
         return { success: true, data: getMockEventOdds(sport, eventId) as unknown as T }
       }
 
       // For general odds endpoint
       const generalOddsMatch = endpoint.match(/\/sports\/([^/]+)\/odds/)
       if (generalOddsMatch) {
         const sport = generalOddsMatch[1] as SportKey
         const events = getMockEvents(sport)
         const odds = events.map((event) => getMockEventOdds(sport, event.id))
         return { success: true, data: odds.filter(Boolean) as unknown as T }
       }
 
       return { success: true, data: [] as unknown as T }
     }
 
     try {
       // Implement basic rate limiting
       await this.applyRateLimit()
 
       const url = new URL(`${this.baseUrl}${endpoint}`)
 
       // Add API key
       url.searchParams.append("apiKey", this.apiKey)
 
       // Add other params
       Object.entries(params).forEach(([key, value]) => {
         url.searchParams.append(key, value)
       })
 
       // Track this request
       this.trackRequest()
 
       const response = await fetch(url.toString())
 
       // Get remaining requests from headers if available
       const remainingRequests = response.headers.get("x-requests-remaining")
       const usedRequests = response.headers.get("x-requests-used")
 
       if (remainingRequests || usedRequests) {
         this.logApiUsage(remainingRequests, usedRequests)
       }
 
       if (!response.ok) {
         const errorText = await response.text()
 
         // If we hit the API quota limit, switch to mock data
         if (response.status === 401 && errorText.includes("OUT_OF_USAGE_CREDITS")) {
           console.warn("API quota reached, using mock data instead")
 
           // Store in localStorage that we should use mock data
           if (typeof window !== "undefined") {
             localStorage.setItem("USE_MOCK_DATA", "true")
           }
 
           // Set the flag for the current session
           USE_MOCK_DATA = true
 
           // Try again with mock data
           return this.makeRequest<T>(endpoint, params)
         }
 
         throw new Error(`API request failed with status ${response.status}: ${errorText}`)
       }
 
       const data = await response.json()
       return { success: true, data }
     } catch (error) {
       console.error("Error making request to Odds API:", error)
       return {
         success: false,
         data: [] as unknown as T,
         errors: [(error as Error).message],
       }
     }
   }
 
   /**
    * Apply basic rate limiting to avoid hitting API limits
    * The Odds API has a rate limit of 1 request per second
    */
   private async applyRateLimit() {
     const now = Date.now()
     const timeSinceLastRequest = now - this.lastRequestTime
 
     // If less than 1 second has passed since the last request, wait
     if (timeSinceLastRequest < 1000) {
       await new Promise((resolve) => setTimeout(resolve, 1000 - timeSinceLastRequest))
     }
 
     this.lastRequestTime = Date.now()
   }
 
   /**
    * Track API request for monitoring
    */
   private trackRequest() {
     this.requestCount++
 
     // Store the request count in localStorage for the current day
     if (typeof window !== "undefined") {
       const today = new Date().toISOString().split("T")[0]
       const key = `api_requests_${today}`
 
       const currentCount = localStorage.getItem(key) ? Number.parseInt(localStorage.getItem(key) as string, 10) : 0
 
       localStorage.setItem(key, (currentCount + 1).toString())
     }
 
     // Also track on the server side via the redis cache
     // This is handled in the odds-service.ts trackApiRequest function
   }
 
   /**
    * Log API usage information from headers
    */
   private logApiUsage(remaining: string | null, used: string | null) {
     if (remaining || used) {
       console.info(`API Usage - Remaining: ${remaining || "unknown"}, Used: ${used || "unknown"}`)
 
       // Store in localStorage for the dashboard
       if (typeof window !== "undefined" && remaining) {
         localStorage.setItem("api_remaining_requests", remaining)
       }
     }
   }
 
   /**
    * Get available sports
    */
   async getSports(): Promise<ApiResponse<Sport[]>> {
     return this.makeRequest<Sport[]>("/sports")
   }
 
   /**
    * Get upcoming events for a sport
    */
   async getEvents({ sportKey, dateFormat = "iso" }: EventsRequestParams): Promise<ApiResponse<Event[]>> {
     return this.makeRequest<Event[]>(`/sports/${sportKey}/events`, {
       dateFormat,
     })
   }
 
   /**
    * Get odds for a sport
    */
   async getOdds({
     sport,
     markets = ["h2h"],
     regions = ["us"],
     bookmakers,
     dateFormat = "iso",
     oddsFormat = "american",
   }: OddsRequestParams): Promise<ApiResponse<GameOdds[]>> {
     const params: Record<string, string> = {
       markets: markets.join(","),
       regions: regions.join(","),
       dateFormat,
       oddsFormat,
     }
 
     if (bookmakers && bookmakers.length > 0) {
       params.bookmakers = bookmakers.join(",")
     }
 
     return this.makeRequest<GameOdds[]>(`/sports/${sport}/odds`, params)
   }
 
   /**
    * Get player props for a specific event
    */
   async getPlayerProps({
     sportKey,
     eventId,
     markets,
     regions = ["us"],
     oddsFormat = "american",
   }: PlayerPropsRequestParams): Promise<ApiResponse<PlayerProps>> {
     return this.makeRequest<PlayerProps>(`/sports/${sportKey}/events/${eventId}/odds`, {
       markets: markets.join(","),
       regions: regions.join(","),
       oddsFormat,
     })
   }
 
   /**
    * Get player props for multiple events
    * Handles rate limiting by adding a delay between requests
    */
   async getPlayerPropsForMultipleEvents({
     sportKey,
     eventIds,
     markets,
     regions = ["us"],
     delayMs = 1000,
   }: {
     sportKey: SportKey
     eventIds: string[]
     markets: string[]
     regions?: RegionKey[]
     delayMs?: number
   }): Promise<ApiResponse<PlayerProps[]>> {
     const results: PlayerProps[] = []
     const errors: string[] = []
 
     for (let i = 0; i < eventIds.length; i++) {
       const eventId = eventIds[i]
 
       try {
         // Add delay between requests to avoid rate limiting
         if (i > 0) {
           await new Promise((resolve) => setTimeout(resolve, delayMs))
         }
 
         const response = await this.getPlayerProps({
           sportKey,
           eventId,
           markets,
           regions,
         })
 
         if (response.success && response.data) {
           results.push(response.data)
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
 }
 
 // Export a singleton instance
 export const oddsApiClient = new OddsApiClient()
 
 