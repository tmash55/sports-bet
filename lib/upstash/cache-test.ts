import { redis, CACHE_KEYS, CACHE_TTL } from "./redis-client"
import { oddsApiClient } from "../api/odds-api-client"
import type { SportKey } from "../constants/odds-api"

/**
 * Tests the caching functionality by fetching and caching sports data
 */
export async function testCachingSports(): Promise<{
  success: boolean
  message: string
  data?: any
  source?: "cache" | "api"
}> {
  try {
    // First, check if sports are already in cache
    const cachedSports = await redis.get<any[]>(CACHE_KEYS.SPORTS)

    if (cachedSports && cachedSports.length > 0) {
      return {
        success: true,
        message: "Successfully retrieved sports from cache",
        data: cachedSports,
        source: "cache",
      }
    }

    // If not in cache, fetch from API
    const response = await oddsApiClient.getSports()

    if (!response.success) {
      return {
        success: false,
        message: "Failed to fetch sports from API",
        data: response.errors,
      }
    }

    // Store in cache
    await redis.set(CACHE_KEYS.SPORTS, response.data, { ex: CACHE_TTL.SPORTS })

    // Verify it was stored correctly
    const verifyCache = await redis.get<any[]>(CACHE_KEYS.SPORTS)

    if (verifyCache && verifyCache.length === response.data.length) {
      return {
        success: true,
        message: "Successfully fetched and cached sports data",
        data: response.data,
        source: "api",
      }
    } else {
      return {
        success: false,
        message: "Failed to verify cached sports data",
        data: { api: response.data, cache: verifyCache },
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Error testing sports caching: ${(error as Error).message}`,
    }
  }
}

/**
 * Tests the caching functionality by fetching and caching events for a sport
 */
export async function testCachingEvents(sportKey: SportKey): Promise<{
  success: boolean
  message: string
  data?: any
  source?: "cache" | "api"
}> {
  try {
    // First, check if events are already in cache
    const cacheKey = CACHE_KEYS.EVENTS(sportKey)
    const cachedEvents = await redis.get<any[]>(cacheKey)

    if (cachedEvents && cachedEvents.length > 0) {
      return {
        success: true,
        message: `Successfully retrieved ${sportKey} events from cache`,
        data: cachedEvents,
        source: "cache",
      }
    }

    // If not in cache, fetch from API
    const response = await oddsApiClient.getEvents({ sportKey })

    if (!response.success) {
      return {
        success: false,
        message: `Failed to fetch ${sportKey} events from API`,
        data: response.errors,
      }
    }

    // Store in cache
    await redis.set(cacheKey, response.data, { ex: CACHE_TTL.EVENTS })

    // Verify it was stored correctly
    const verifyCache = await redis.get<any[]>(cacheKey)

    if (verifyCache && verifyCache.length === response.data.length) {
      return {
        success: true,
        message: `Successfully fetched and cached ${sportKey} events data`,
        data: response.data,
        source: "api",
      }
    } else {
      return {
        success: false,
        message: `Failed to verify cached ${sportKey} events data`,
        data: { api: response.data, cache: verifyCache },
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Error testing events caching: ${(error as Error).message}`,
    }
  }
}

/**
 * Clears all cached data for testing purposes
 */
export async function clearCache(): Promise<{
  success: boolean
  message: string
  deletedKeys?: number
}> {
  try {
    // Get all keys
    const keys = await redis.keys("*")

    // Delete each key
    let deletedCount = 0
    for (const key of keys) {
      const result = await redis.del(key)
      deletedCount += result
    }

    return {
      success: true,
      message: `Successfully cleared cache. Deleted ${deletedCount} keys.`,
      deletedKeys: deletedCount,
    }
  } catch (error) {
    return {
      success: false,
      message: `Error clearing cache: ${(error as Error).message}`,
    }
  }
}

