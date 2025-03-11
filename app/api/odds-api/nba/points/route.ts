import { getPlayerProps, getAvailablePlayerMarkets } from "@/lib/services/odds-service"
import { NextResponse } from "next/server"
import type { SportKey } from "@/lib/constants/odds-api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get("sport") || "basketball_nba"
  const eventId = searchParams.get("eventId")
  const marketsParam = searchParams.get("markets")
  const oddsFormat = searchParams.get("oddsFormat") || "american"

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
  }

  let markets: string[]
  if (marketsParam) {
    markets = marketsParam.split(",")
  } else {
    markets = getAvailablePlayerMarkets(sport as SportKey)
  }

  try {
    const response = await getPlayerProps(
      sport as SportKey,
      eventId,
      markets,
      ["us"],
      oddsFormat as "decimal" | "american",
    )

    if (!response.success) {
      return NextResponse.json({ error: response.errors }, { status: 400 })
    }

    return NextResponse.json(response.data)
  } catch (error) {
    console.error("Error in player props API route:", error)
    return NextResponse.json({ error: "Failed to fetch player props" }, { status: 500 })
  }
}

