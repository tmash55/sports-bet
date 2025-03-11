/**
 * Odds Service
 * Handles caching and business logic for odds data
 */

 import { cache } from "react"
 import { oddsApiClient } from "../api/odds-api-client"
 import {
   type SportKey,
   type GameMarketKey,
   type RegionKey,
   type BookmakerKey,
   PLAYER_MARKETS,
 } from "../constants/odds-api"
 import type { ApiResponse, Event, GameOdds, PlayerProps, Sport } from "../types/odds-api"
 
 // Cache TTL in milliseconds
 const CACHE_TTL = {
   SPORTS: 24 * 60 * 60 * 1000, // 24 hours
   EVENTS: 5 * 60 * 1000, // 5 minutes
   ODDS: 1 * 60 * 1000, // 1 minute
   PLAYER_PROPS: 1 * 60 * 1000, // 1 minute
 }
 
 /**
  * Get available sports
  * Cached for 24 hours
  */
 export const getSports = cache(async (): Promise<ApiResponse<Sport[]>> => {
   return oddsApiClient.getSports()
 })
 
 /**
  * Get upcoming events for a sport
  * Cached for 5 minutes
  */
 export const getEvents = cache(async (sportKey: SportKey): Promise<ApiResponse<Event[]>> => {
   return oddsApiClient.getEvents({ sportKey })
 })
 
 /**
  * Get odds for a sport
  * Cached for 1 minute
  */
 export const getOdds = cache(
   async (
     sport: SportKey,
     markets: GameMarketKey[] = ["h2h"],
     regions: RegionKey[] = ["us"],
     bookmakers?: BookmakerKey[],
     oddsFormat: "decimal" | "american" = "american",
   ): Promise<ApiResponse<GameOdds[]>> => {
     return oddsApiClient.getOdds({
       sport,
       markets,
       regions,
       bookmakers,
       oddsFormat,
     })
   },
 )
 
 /**
  * Get player props for a specific event
  * Cached for 1 minute
  */
 export const getPlayerProps = cache(
   async (
     sportKey: SportKey,
     eventId: string,
     markets: string[],
     regions: RegionKey[] = ["us"],
     oddsFormat: "decimal" | "american" = "american",
   ): Promise<ApiResponse<PlayerProps>> => {
     return oddsApiClient.getPlayerProps({
       sportKey,
       eventId,
       markets,
       regions,
       oddsFormat,
     })
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
 
 