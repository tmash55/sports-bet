import { findEVOpportunities } from "../services/ev-finder-service"
import type { GameMarketKey, RegionKey, SportKey } from "../constants/odds-api"

/**
 * Test function for EV finder
 */
 export async function testEVFinder(includeLiveGames = false, regions: RegionKey[] = ["us"], useSharpBooks = false) {
  console.log("Testing EV finder...")

  const sportKey: SportKey = "basketball_nba"
  const gameMarkets: GameMarketKey[] = ["h2h", "spreads", "totals"]
  const evThreshold = 2
  const sharpBookmakers = ["pinnacle"]

  console.log(`Finding EV opportunities for ${sportKey} with markets: ${gameMarkets.join(", ")}`)
  console.log(`Include live games: ${includeLiveGames}`)
  console.log(`Use sharp books method: ${useSharpBooks}`)
  console.log(`Regions: ${regions.join(", ")}`)

  // Convert useSharpBooks to the expected type
  const comparisonMethod: "consensus" | "sharp" | "weighted" = useSharpBooks ? "sharp" : "consensus"

  try {
    // Force refresh to get fresh data
    const result = await findEVOpportunities(
      sportKey,
      gameMarkets,
      evThreshold,
      true,
      includeLiveGames,
      regions,
      comparisonMethod, // Use the converted value here
      sharpBookmakers,
    )

    console.log(`Found ${result.opportunities.length} opportunities with EV >= ${evThreshold}%`)

    // Count live vs pre-game opportunities
    const liveOpportunities = result.opportunities.filter((opp) => opp.isLive).length
    const pregameOpportunities = result.opportunities.length - liveOpportunities

    // Count by comparison method
    const sharpOpportunities = result.opportunities.filter((opp) => opp.comparisonMethod === "sharp").length
    const consensusOpportunities = result.opportunities.filter((opp) => opp.comparisonMethod !== "sharp").length

    console.log(`Live opportunities: ${liveOpportunities}`)
    console.log(`Pre-game opportunities: ${pregameOpportunities}`)
    console.log(`Sharp comparison opportunities: ${sharpOpportunities}`)
    console.log(`Consensus comparison opportunities: ${consensusOpportunities}`)

    // Count opportunities by region
    const opportunitiesByRegion: Record<string, number> = {}
    result.opportunities.forEach((opp) => {
      const region = opp.region || "unknown"
      opportunitiesByRegion[region] = (opportunitiesByRegion[region] || 0) + 1
    })

    console.log("Opportunities by region:", opportunitiesByRegion)

    if (result.opportunities.length > 0) {
      // Log the top 3 opportunities
      console.log("Top opportunities:")
      result.opportunities.slice(0, 3).forEach((opp, index) => {
        console.log(
          `${index + 1}. ${opp.eventName} - ${opp.market} - ${opp.selection} - ${opp.bookmaker} - ` +
            `EV: ${opp.ev.toFixed(2)}% - ${opp.isLive ? "LIVE" : "Pre-game"} - Region: ${opp.region || "us"} - ` +
            `Method: ${opp.comparisonMethod || "consensus"}`,
        )
      })
    }

    return {
      success: true,
      opportunitiesCount: result.opportunities.length,
      liveOpportunities,
      pregameOpportunities,
      sharpOpportunities,
      consensusOpportunities,
      opportunitiesByRegion,
      opportunities: result.opportunities.slice(0, 5), // Return top 5 for display
    }
  } catch (error) {
    console.error("Error testing EV finder:", error)
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}


