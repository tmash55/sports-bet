
import { getSports } from "@/lib/services/odds-service"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await getSports()

    if (!response.success) {
      return NextResponse.json({ error: response.errors }, { status: 400 })
    }

    return NextResponse.json(response.data)
  } catch (error) {
    console.error("Error in sports API route:", error)
    return NextResponse.json({ error: "Failed to fetch sports data" }, { status: 500 })
  }
}

