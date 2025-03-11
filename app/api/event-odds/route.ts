import { NextResponse } from "next/server"
import type { SportKey } from "@/lib/constants/odds-api"
import { getOdds } from "@/lib/services/odds-service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get("sport") || "basketball_nba"
  const eventId = searchParams.get("eventId")

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
  }

  try {
    // Fetch odds for all events in this sport
    const response = await getOdds(sport as SportKey, ["h2h", "spreads", "totals"], ["us"], undefined, "american")

    if (!response.success) {
      return NextResponse.json({ error: response.errors }, { status: 400 })
    }

    // Find the specific event
    const eventData = response.data.find((event) => event.id === eventId)

    if (!eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(eventData)
  } catch (error) {
    console.error("Error in event odds API route:", error)
    return NextResponse.json({ error: "Failed to fetch event odds" }, { status: 500 })
  }
}

