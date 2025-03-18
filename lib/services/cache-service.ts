import { redis, CACHE_KEYS, CACHE_TTL } from "../upstash/redis-client"
import type { SportKey, GameMarketKey } from "../constants/odds-api"
import type { Event, GameOdds, PlayerProps } from "../types/odds-api"

/**
 * Cache sports data
 */
export async function cacheSports(data: any[]) {
  return redis.set(CACHE_KEYS.SPORTS, data, { ex: CACHE_TTL.SPORTS })
}

/**
 * Get cached sports data
 */
export async function getCachedSports() {
  return redis.get(CACHE_KEYS.SPORTS)
}

/**
 * Cache events for a sport
 */
export async function cacheEvents(sportKey: SportKey, data: Event[]) {
  const cacheKey = CACHE_KEYS.EVENTS(sportKey)
  return redis.set(cacheKey, data, { ex: CACHE_TTL.EVENTS })
}

/**
 * Get cached events for a sport
 */
export async function getCachedEvents(sportKey: SportKey) {
  const cacheKey = CACHE_KEYS.EVENTS(sportKey)
  return redis.get<Event[]>(cacheKey)
}

/**
 * Cache game odds
 */
export async function cacheGameOdds(eventId: string, market: GameMarketKey, data: GameOdds) {
  const cacheKey = CACHE_KEYS.GAME_ODDS(eventId, market)
  return redis.set(cacheKey, data, { ex: CACHE_TTL.GAME_ODDS })
}

/**
 * Get cached game odds
 */
export async function getCachedGameOdds(eventId: string, market: GameMarketKey) {
  const cacheKey = CACHE_KEYS.GAME_ODDS(eventId, market)
  return redis.get<GameOdds>(cacheKey)
}

/**
 * Cache player props
 */
export async function cachePlayerProps(eventId: string, market: string, data: PlayerProps) {
  const cacheKey = CACHE_KEYS.PLAYER_PROPS(eventId, market)
  return redis.set(cacheKey, data, { ex: CACHE_TTL.PLAYER_PROPS })
}

/**
 * Get cached player props
 */
export async function getCachedPlayerProps(eventId: string, market: string) {
  const cacheKey = CACHE_KEYS.PLAYER_PROPS(eventId, market)
  return redis.get<PlayerProps>(cacheKey)
}

/**
 * Track API usage
 */
export async function trackApiRequest() {
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
 * Get API usage stats
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

