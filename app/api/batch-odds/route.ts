import { NextResponse } from "next/server"
import { getOdds } from "@/lib/services/odds-service"
import type { SportKey, GameMarketKey } from "@/lib/constants/odds-api"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sport, eventIds, markets } = body

    if (!sport || !eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 })
    }

    // Fetch odds for all events in this sport
    const response = await getOdds(sport as SportKey, markets as GameMarketKey[], ["us"], undefined, "american")

    if (!response.success) {
      return NextResponse.json({ error: response.errors }, { status: 400 })
    }

    // Filter to only include the requested events
    const filteredData = response.data.filter((event) => eventIds.includes(event.id))

    return NextResponse.json({
      data: filteredData,
      source: response.source || "api", // Make sure we're passing the source from the response
    })
  } catch (error) {
    console.error("Error in batch odds API route:", error)
    return NextResponse.json({ error: "Failed to fetch odds data" }, { status: 500 })
  }
}

