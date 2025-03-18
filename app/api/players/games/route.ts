import { NextResponse } from "next/server"
import type { SportKey } from "@/lib/constants/odds-api"
import { getPlayerGames } from "@/lib/services/player-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "basketball_nba"
    const player = searchParams.get("player")

    if (!player) {
      return NextResponse.json({ error: "Player name is required" }, { status: 400 })
    }

    // Use the player service to get upcoming games for the player
    const games = await getPlayerGames(sport as SportKey, player)

    return NextResponse.json({
      games,
      player,
      sport,
    })
  } catch (error) {
    console.error("Error in player games API:", error)
    return NextResponse.json({ error: "Failed to find games for player" }, { status: 500 })
  }
}

