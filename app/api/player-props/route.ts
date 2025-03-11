import { getPlayerProps, getAvailablePlayerMarkets } from "@/lib/services/odds-service"
import { NextResponse } from "next/server"
import type { SportKey } from "@/lib/constants/odds-api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get("sport") || "basketball_nba"
  const eventId = searchParams.get("eventId")
  const marketsParam = searchParams.get("markets")

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
  }

  // Get valid markets for this sport
  const validMarkets = getAvailablePlayerMarkets(sport as SportKey)

  // Filter requested markets to only include valid ones
  let markets: string[]
  if (marketsParam) {
    const requestedMarkets = marketsParam.split(",")
    markets = requestedMarkets.filter((market) => validMarkets.includes(market))

    // If no valid markets were requested, use the first valid market
    if (markets.length === 0 && validMarkets.length > 0) {
      markets = [validMarkets[0]]
    }
  } else {
    // Use all valid markets if none specified
    markets = validMarkets
  }

  // If there are no valid markets for this sport, return an error
  if (markets.length === 0) {
    return NextResponse.json({ error: `No valid markets available for sport: ${sport}` }, { status: 400 })
  }

  try {
    const response = await getPlayerProps(sport as SportKey, eventId, markets)

    if (!response.success) {
      return NextResponse.json({ error: response.errors }, { status: 400 })
    }

    return NextResponse.json(response.data)
  } catch (error) {
    console.error("Error in player props API route:", error)
    return NextResponse.json({ error: "Failed to fetch player props" }, { status: 500 })
  }
}

