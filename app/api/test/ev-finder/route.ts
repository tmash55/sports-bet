import { NextResponse } from "next/server"
import { testEVFinder } from "@/lib/tests/ev-finder-test"
import type { RegionKey } from "@/lib/constants/odds-api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeLiveGames = searchParams.get("includeLive") === "true"
    const useSharpBooks = searchParams.get("useSharpBooks") === "true"

    // Handle multiple regions
    const regionsParam = searchParams.get("regions") || "us"
    const regions = regionsParam.split(",") as RegionKey[]

    const result = await testEVFinder(includeLiveGames, regions, useSharpBooks)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in test route:", error)
    return NextResponse.json({ error: "Test failed" }, { status: 500 })
  }
}

