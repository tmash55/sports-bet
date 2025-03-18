/**
 * Type definitions for the Odds API
 */

 import type { SportKey, GameMarketKey, RegionKey, BookmakerKey } from "../constants/odds-api"

 // Base response type
 export type ApiResponse<T> = {
   success: boolean
   data: T
   errors?: string[]
   source?: "cache" | "api" // Add this line
 }
 
 // Event type
 export type Event = {
   id: string
   sport_key: SportKey
   sport_title: string
   commence_time: string
   home_team: string
   away_team: string
   completed?: boolean
   scores?: {
     home_score?: number
     away_score?: number
   }
 }
 
 // Player prop type
 export type PlayerProp = {
   name: string
   position?: string
   team?: string
   point: number
   price: number
 }
 
 // Market type
 export type Market = {
   key: string
   last_update: string
   outcomes: PlayerProp[] | Outcome[]
   isAlternate?: boolean // Add this property
 }
 
 // Standard outcome type (for game markets)
 export type Outcome = {
   name: string
   price: number
   point?: number
 }
 
 // Bookmaker type
 export type Bookmaker = {
   key: BookmakerKey
   title: string
   last_update: string
   markets: Market[]
   region?: RegionKey
 }
 
 // Game odds type
 export type GameOdds = Event & {
   bookmakers: Bookmaker[]
 }
 
 // Player props type
 export type PlayerProps = Event & {
   bookmakers: Bookmaker[]
 }
 
 // Sport type
 export type Sport = {
   key: SportKey
   group: string
   title: string
   description: string
   active: boolean
   has_outrights: boolean
 }
 
 // API request parameters
 export type OddsRequestParams = {
   sport: SportKey
   markets?: GameMarketKey[]
   regions?: RegionKey[]
   bookmakers?: BookmakerKey[]
   dateFormat?: "iso" | "unix"
   oddsFormat?: "decimal" | "american"
 }
 
 export type EventsRequestParams = {
   sportKey: SportKey
   dateFormat?: "iso" | "unix"
 }
 
 export type PlayerPropsRequestParams = {
   sportKey: SportKey
   eventId: string
   markets: string[]
   regions?: RegionKey[]
   oddsFormat?: "decimal" | "american"
 }
 
 