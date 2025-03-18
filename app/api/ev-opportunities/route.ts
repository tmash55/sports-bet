import { NextResponse } from "next/server"
import { getCachedEVOpportunities, findEVOpportunities } from "@/lib/services/ev-finder-service"
import type { SportKey, GameMarketKey, RegionKey } from "@/lib/constants/odds-api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "basketball_nba"
    const marketsParam = searchParams.get("markets") || "h2h,spreads,totals"
    const markets = marketsParam.split(",") as GameMarketKey[]
    const evThreshold = searchParams.get("threshold") ? Number(searchParams.get("threshold")) : 2
    const refresh = searchParams.get("refresh") === "true"
    const includeLiveGames = searchParams.get("includeLive") === "true"
    const comparisonMethod = searchParams.get("comparisonMethod") || "weighted" // Default to weighted
    const sharpBookmakersParam = searchParams.get("sharpBookmakers") || "pinnacle"
    const sharpBookmakers = sharpBookmakersParam.split(",")

    // Handle multiple regions
    const regionsParam = searchParams.get("regions") || "us"
    const regions = regionsParam.split(",") as RegionKey[]

    console.log(
      `EV opportunities request: sport=${sport}, markets=${marketsParam}, threshold=${evThreshold}, refresh=${refresh}, includeLive=${includeLiveGames}, regions=${regionsParam}, comparisonMethod=${comparisonMethod}, sharpBookmakers=${sharpBookmakersParam}`,
    )

    let response
    if (refresh) {
      // Force refresh from API
      response = await findEVOpportunities(
        sport as SportKey,
        markets,
        evThreshold,
        true,
        includeLiveGames,
        regions,
        comparisonMethod as "consensus" | "sharp" | "weighted",
        sharpBookmakers,
      )
    } else {
      // Try cache first
      response = await getCachedEVOpportunities(
        sport as SportKey,
        markets,
        evThreshold,
        includeLiveGames,
        regions,
        comparisonMethod as "consensus" | "sharp" | "weighted",
        sharpBookmakers,
      )
    }

    return NextResponse.json({
      opportunities: response.opportunities,
      lastUpdated: response.lastUpdated,
      source: response.source,
    })
  } catch (error) {
    console.error("Error in EV opportunities API route:", error)
    return NextResponse.json({ error: "Failed to fetch EV opportunities" }, { status: 500 })
  }
}

