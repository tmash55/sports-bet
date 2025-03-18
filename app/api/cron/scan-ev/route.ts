import { NextResponse } from "next/server"
import { findEVOpportunities } from "@/lib/services/ev-finder-service"
import { SPORTS } from "@/lib/constants/odds-api"
import type { SportKey, GameMarketKey } from "@/lib/constants/odds-api"

// This route is meant to be called by a cron job
export async function GET(request: Request) {
  try {
    // Verify API key if needed
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("apiKey")

    // In production, you should validate the API key
    // if (!apiKey || apiKey !== process.env.CRON_API_KEY) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    // Get all sports to scan
    const sportsToScan = Object.values(SPORTS)
    const markets: GameMarketKey[] = ["h2h", "spreads", "totals"]
    const evThreshold = 2

    console.log(`Running EV scan for ${sportsToScan.length} sports...`)

    // Run scans for each sport
    const scanPromises = sportsToScan.map(async (sport) => {
      try {
        const result = await findEVOpportunities(sport as SportKey, markets, evThreshold, true)
        return {
          sport,
          opportunitiesCount: result.opportunities.length,
          success: true,
        }
      } catch (error) {
        console.error(`Error scanning ${sport}:`, error)
        return {
          sport,
          opportunitiesCount: 0,
          success: false,
          error: (error as Error).message,
        }
      }
    })

    const results = await Promise.all(scanPromises)

    // Count total opportunities found
    const totalOpportunities = results.reduce((sum, result) => sum + result.opportunitiesCount, 0)

    return NextResponse.json({
      success: true,
      message: `EV scan completed. Found ${totalOpportunities} opportunities across ${sportsToScan.length} sports.`,
      results,
    })
  } catch (error) {
    console.error("Error in EV scan cron job:", error)
    return NextResponse.json(
      {
        error: "Failed to run EV scan",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

