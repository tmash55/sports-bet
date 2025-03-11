/**
 * Odds API Client
 */

 import type { SportKey, RegionKey } from "../constants/odds-api"

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
 
 /**
  * Base class for Odds API client
  */
 class OddsApiClient {
   private apiKey: string
   private baseUrl = "https://api.the-odds-api.com/v4"
 
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
     try {
       const url = new URL(`${this.baseUrl}${endpoint}`)
 
       // Add API key
       url.searchParams.append("apiKey", this.apiKey)
 
       // Add other params
       Object.entries(params).forEach(([key, value]) => {
         url.searchParams.append(key, value)
       })
 
       const response = await fetch(url.toString())
 
       if (!response.ok) {
         const errorText = await response.text()
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
 
 