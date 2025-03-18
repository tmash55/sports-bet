import { NextResponse } from "next/server"
import { findEVOpportunities } from "@/lib/services/ev-finder-service"
import type { SportKey, GameMarketKey, RegionKey } from "@/lib/constants/odds-api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "basketball_nba"
    const markets = (searchParams.get("markets") || "h2h,spreads,totals").split(",") as GameMarketKey[]
    const evThreshold = searchParams.get("threshold") ? Number(searchParams.get("threshold")) : 2
    const includeLiveGames = searchParams.get("includeLive") === "true"

    // Handle multiple regions
    const regionsParam = searchParams.get("regions") || "us"
    const regions = regionsParam.split(",") as RegionKey[]

    console.log(`Running test EV scan for ${sport}...`)

    // Run the scan for just the selected sport
    const response = await findEVOpportunities(sport as SportKey, markets, evThreshold, true, includeLiveGames, regions)

    return NextResponse.json({
      success: true,
      message: `EV scan completed for ${sport}. Found ${response.opportunities.length} opportunities.`,
      opportunitiesCount: response.opportunities.length,
    })
  } catch (error) {
    console.error("Error in test EV scan:", error)
    return NextResponse.json(
      {
        error: "Failed to run EV scan",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

