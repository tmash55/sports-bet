import { NextResponse } from "next/server"
import type { SportKey } from "@/lib/constants/odds-api"
import { searchPlayers } from "@/lib/services/player-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "basketball_nba"
    const query = searchParams.get("query")

    if (!query || query.length < 2) {
      return NextResponse.json({ error: "Search query must be at least 2 characters" }, { status: 400 })
    }

    // Use the player service to search for players
    const players = await searchPlayers(sport as SportKey, query)

    return NextResponse.json({
      players,
      query,
      sport,
    })
  } catch (error) {
    console.error("Error in player search API:", error)
    return NextResponse.json({ error: "Failed to search for players" }, { status: 500 })
  }
}
