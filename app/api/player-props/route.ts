import { NextResponse } from "next/server"
import { getPlayerProps } from "@/lib/services/odds-service"
import type { RegionKey, SportKey } from "@/lib/constants/odds-api"
import { PLAYER_MARKETS } from "@/lib/constants/odds-api"
import { REGIONS } from "@/lib/constants/odds-api"

// Helper function to get available player markets for a sport
function getAvailablePlayerMarkets(sport: SportKey): string[] {
  if (sport in PLAYER_MARKETS) {
    // Get all markets including alternates
    return Object.values(PLAYER_MARKETS[sport as keyof typeof PLAYER_MARKETS])
  }
  return []
}

// Update the GET function to handle alternate markets
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get("sport") || "basketball_nba"
  const eventId = searchParams.get("eventId")
  const marketsParam = searchParams.get("markets")
  const oddsFormat = searchParams.get("oddsFormat") || "american"
  // Add a regions parameter with default value
  const regionsParam = searchParams.get("regions") || "us, us2"

  console.log(
    `Player props request: sport=${sport}, eventId=${eventId}, markets=${marketsParam}, regions=${regionsParam}`,
  )

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
  }

  // Get valid markets for this sport
  const validMarkets = getAvailablePlayerMarkets(sport as SportKey)

  // Filter requested markets
  let markets: string[] = []
  if (marketsParam) {
    const requestedMarkets = marketsParam.split(",")

    // For each requested market, also include its alternate version if available
    requestedMarkets.forEach((market) => {
      // First, check if the requested market itself is valid
      if (validMarkets.includes(market)) {
        markets.push(market)

        // If this is a base market (not already an alternate), check for its alternate version
        if (!market.endsWith("_alternate")) {
          const alternateMarket = `${market}_alternate`
          if (validMarkets.includes(alternateMarket)) {
            // Only add the alternate if it's not already explicitly requested
            if (!requestedMarkets.includes(alternateMarket)) {
              markets.push(alternateMarket)
            }
          }
        }
      }
    })

    // If no valid markets were requested, use the first valid market
    if (markets.length === 0 && validMarkets.length > 0) {
      markets = [validMarkets[0]]
    }
  } else {
    // Use all valid markets if none specified
    markets = validMarkets
  }

  // Parse regions from the parameter
  const regions = regionsParam
  .split(",")
  .filter((r): r is RegionKey => Object.values(REGIONS).includes(r as RegionKey))

if (regions.length === 0) {
  regions.push("us")
}


  // If there are no valid markets for this sport, return an error
  if (markets.length === 0) {
    return NextResponse.json({ error: `No valid markets available for sport: ${sport}` }, { status: 400 })
  }

  console.log(`Fetching markets: ${markets.join(", ")} for regions: ${regions.join(", ")}`)

  try {
    // This function should check the cache before making API calls
    const response = await getPlayerProps(
      sport as SportKey,
      eventId,
      markets,
      regions, // Use the regions array here instead of hardcoded ["us"]
      oddsFormat as "decimal" | "american",
    )

    console.log(
      `Player props response: success=${response.success}, source=${response.source}, bookmakers=${response.data?.bookmakers?.length || 0}`,
    )
    if (response.success && response.data) {
      // Log the first bookmaker's markets to see what we're getting
      const firstBookmaker = response.data.bookmakers[0]
      if (firstBookmaker) {
        console.log(
          `First bookmaker ${firstBookmaker.key} markets:`,
          firstBookmaker.markets.map((m) => ({
            key: m.key,
            isAlternate: m.isAlternate,
            outcomeCount: m.outcomes.length,
          })),
        )
      }
    }

    if (!response.success) {
      return NextResponse.json({ error: response.errors }, { status: 400 })
    }

    return NextResponse.json({
      data: response.data,
      source: response.source || "api", // Indicate if data came from cache or API
    })
  } catch (error) {
    console.error("Error in player props API route:", error)
    return NextResponse.json({ error: "Failed to fetch player props" }, { status: 500 })
  }
}

