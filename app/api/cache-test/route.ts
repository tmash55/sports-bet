import { NextResponse } from "next/server"
import { testCachingSports, testCachingEvents, clearCache } from "@/lib/upstash/cache-test"
import type { SportKey } from "@/lib/constants/odds-api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || "sports"
    const sport = searchParams.get("sport") || "basketball_nba"

    if (action === "clear") {
      const result = await clearCache()
      return NextResponse.json(result)
    } else if (action === "events") {
      const result = await testCachingEvents(sport as SportKey)
      return NextResponse.json(result)
    } else {
      const result = await testCachingSports()
      return NextResponse.json(result)
    }
  } catch (error) {
    console.error("Error testing cache:", error)
    return NextResponse.json({ success: false, message: `Error: ${(error as Error).message}` }, { status: 500 })
  }
}

