import { NextResponse } from "next/server"
import { testRedisConnection, getRedisStats } from "@/lib/upstash/redis-test"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || "test"

    if (action === "stats") {
      const stats = await getRedisStats()
      return NextResponse.json(stats)
    } else {
      const result = await testRedisConnection()
      return NextResponse.json(result)
    }
  } catch (error) {
    console.error("Error testing Redis:", error)
    return NextResponse.json({ success: false, message: `Error: ${(error as Error).message}` }, { status: 500 })
  }
}

