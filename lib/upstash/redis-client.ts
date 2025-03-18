import { Redis } from "@upstash/redis"

// Create a Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache keys
export const CACHE_KEYS = {
  SPORTS: "sports",
  EVENTS: (sportKey: string) => `events:${sportKey}`,
  GAME_ODDS: (eventId: string, market: string) => `odds:game:${eventId}:${market}`,
  PLAYER_PROPS: (eventId: string, market: string) => `odds:props:${eventId}:${market}`,
  API_REQUESTS: (date: string) => `api:requests:${date}`, // Track API usage
  EV_OPPORTUNITIES: (
    sport: string,
    markets: string,
    threshold: number,
    includeLiveGames = false,
    regions = "us",
    method = "weighted", // Default to weighted method
  ) =>
    `ev:opportunities:${sport}:${markets}:${threshold}:${includeLiveGames ? "live" : "pregame"}:${regions}:${method}`,
    PLAYER_SEARCH: (sport: string, query: string) => `players:search:${sport}:${query.toLowerCase()}`,
  PLAYER_GAMES: (sport: string, playerName: string) => `players:games:${sport}:${playerName.toLowerCase()}`,
}

// Cache TTLs in seconds
export const CACHE_TTL = {
  SPORTS: 24 * 60 * 60, // 24 hours
  EVENTS: 15 * 60, // 15 minutes
  GAME_ODDS: 5 * 60, // 5 minutes
  PLAYER_PROPS: 5 * 60, // 5 minutes
  EV_OPPORTUNITIES: 60 * 5, // 5 minutes
  PLAYER_SEARCH: 24 * 60 * 60, // 24 hours
  PLAYER_GAMES: 3 * 60 * 60, // 3 hours
}

