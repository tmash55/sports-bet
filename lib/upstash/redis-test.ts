import { redis } from "./redis-client"

/**
 * Tests the Redis connection and basic operations
 * @returns A result object with success status and message
 */
export async function testRedisConnection(): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Test key for our connection test
    const testKey = "connection_test"
    const testValue = { timestamp: Date.now(), message: "Redis connection successful!" }

    // Test setting a value
    await redis.set(testKey, testValue, { ex: 60 }) // Expires in 60 seconds

    // Test getting the value back
    const retrievedValue = await redis.get<{ timestamp: number; message: string }>(testKey)

    // Test deleting the value
    await redis.del(testKey)

    // Verify the test was successful
    if (retrievedValue && retrievedValue.timestamp === testValue.timestamp) {
      return {
        success: true,
        message: "Successfully connected to Upstash Redis!",
        data: {
          retrievedValue,
          serverInfo: await getServerInfo(),
        },
      }
    } else {
      return {
        success: false,
        message: "Connection test failed: Data mismatch",
        data: { expected: testValue, received: retrievedValue },
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Redis connection failed: ${(error as Error).message}`,
      data: { error },
    }
  }
}

/**
 * Gets Redis usage statistics
 * @returns Redis memory usage and other stats
 */
export async function getRedisStats() {
  try {
    // Get database size (number of keys)
    const dbSize = await redis.dbsize()

    // Get all keys to analyze usage patterns
    const keys = await redis.keys("*")

    // Group keys by prefix to understand what's using the most space
    const keysByPrefix: Record<string, number> = {}
    keys.forEach((key) => {
      const prefix = key.split(":")[0]
      keysByPrefix[prefix] = (keysByPrefix[prefix] || 0) + 1
    })

    // Get server info
    const serverInfo = await getServerInfo()

    return {
      success: true,
      stats: {
        dbSize,
        serverInfo,
        keyCount: keys.length,
        keysByPrefix,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to get Redis stats: ${(error as Error).message}`,
    }
  }
}

/**
 * Gets basic server information using available commands
 * Note: Upstash Redis doesn't support the traditional INFO command,
 * so we're using available commands to gather what information we can
 */
async function getServerInfo() {
  try {
    // Use PING to check connection
    const ping = await redis.ping()

    // Use TIME to get server time
    const time = await redis.time()

    return {
      ping,
      serverTime: time ? new Date(time[0] * 1000 + Math.floor(time[1] / 1000)) : null,
      upstash: true,
    }
  } catch (error) {
    console.error("Error getting server info:", error)
    return { error: (error as Error).message }
  }
}

