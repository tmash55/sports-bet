import { getEvents } from "@/lib/services/odds-service"
import { NextResponse } from "next/server"
import type { SportKey } from "@/lib/constants/odds-api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get("sport") || "basketball_nba"

  try {
    const response = await getEvents(sport as SportKey)

    if (!response.success) {
      return NextResponse.json({ error: response.errors }, { status: 400 })
    }

    return NextResponse.json(response.data)
  } catch (error) {
    console.error("Error in events API route:", error)
    return NextResponse.json({ error: "Failed to fetch upcoming events" }, { status: 500 })
  }
}

