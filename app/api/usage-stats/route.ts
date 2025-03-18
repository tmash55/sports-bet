import { NextResponse } from "next/server"
import { getApiUsageStats } from "@/lib/services/odds-service"

export async function GET() {
  try {
    const stats = await getApiUsageStats()

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Error fetching API usage stats:", error)
    return NextResponse.json({ error: "Failed to fetch API usage stats" }, { status: 500 })
  }
}

