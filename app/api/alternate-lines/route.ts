import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sport, eventIds, markets } = body

    if (!sport || !eventIds || !markets || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Fetch alternate lines for each event
    const host = request.headers.get("host") || ""
    const protocol = host.includes("localhost") ? "http" : "https"

    const eventPromises = eventIds.map(async (eventId) => {
      try {
        const marketsParam = markets.join(",")
        const url = `${protocol}://${host}/api/event-odds?sport=${sport}&eventId=${eventId}&markets=${marketsParam}&includeAlternates=true`

        const response = await fetch(url)

        if (!response.ok) {
          console.warn(
            `Failed to fetch alternate lines for event ${eventId}: ${response.status} ${response.statusText}`,
          )
          return null
        }

        const data = await response.json()
        return data.data
      } catch (error) {
        console.error(`Error fetching alternate lines for event ${eventId}:`, error)
        return null
      }
    })

    // Wait for all requests to complete
    const eventsData = await Promise.all(eventPromises)

    // Filter out any null responses
    const filteredData = eventsData.filter((event) => event !== null)

    return NextResponse.json({
      data: filteredData,
      source: "api",
    })
  } catch (error) {
    console.error("Error in alternate lines API route:", error)
    return NextResponse.json({ error: "Failed to fetch alternate lines" }, { status: 500 })
  }
}

