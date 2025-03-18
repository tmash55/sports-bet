import type { SportKey } from "@/lib/constants/odds-api"

// Format odds for display
export function formatOdds(price: number): string {
  if (Number.isInteger(price)) {
    if (price === 1) return "(1)"
    return price > 0 ? `+${price}` : `${price}`
  }
  if (price >= 2) {
    return `+${Math.round((price - 1) * 100)}`
  } else {
    return `${Math.round(-100 / (price - 1))}`
  }
}

// Function to group points into ranges
export function groupPointsIntoRanges(points: number[], marketName: string): { label: string; min: number; max: number }[] {
  if (points.length === 0) return []

  const sortedPoints = [...points].sort((a, b) => a - b)
  const minPoint = sortedPoints[0]
  const maxPoint = sortedPoints[sortedPoints.length - 1]
  const totalRange = maxPoint - minPoint

  let rangeSize = 5 // Default range size

  if (marketName === "Points") {
    if (totalRange > 30) rangeSize = 10
    else if (totalRange > 15) rangeSize = 5
    else rangeSize = 2.5
  } else if (marketName === "Rebounds" || marketName === "Assists") {
    if (totalRange > 15) rangeSize = 5
    else if (totalRange > 8) rangeSize = 2.5
    else rangeSize = 1
  } else {
    if (totalRange > 50) rangeSize = 20
    else if (totalRange > 20) rangeSize = 10
    else rangeSize = 5
  }

  const ranges: { label: string; min: number; max: number }[] = []
  let currentMin = Math.floor(minPoint / rangeSize) * rangeSize

  while (currentMin <= maxPoint) {
    const currentMax = currentMin + rangeSize
    ranges.push({
      label: `${currentMin}-${currentMax} ${marketName}`,
      min: currentMin,
      max: currentMax,
    })
    currentMin = currentMax
  }

  return ranges
}

// Function to find best odds across all players and bookmakers
export function findBestOdds(
  players: Array<{
    name: string
    bookmakers: {
      [key: string]: {
        alternateLines: Array<{
          over: { price: number; point: number }
          under: { price: number; point: number }
        }>
      }
    }
  }>,
  point: number,
  isOver: boolean,
  bookmakers: string[],
): { odds: number; bookmaker: string; player: string } | null {
  let bestOdds = Number.NEGATIVE_INFINITY
  let bestBookmaker = ""
  let bestPlayer = ""

  players.forEach((player) => {
    bookmakers.forEach((bookie) => {
      const bookieData = player.bookmakers[bookie]
      if (!bookieData?.alternateLines) return

      const matchingLine = bookieData.alternateLines.find(
        (line) => Math.abs(isOver ? line.over.point - point : line.under.point - point) < 0.01,
      )

      if (matchingLine) {
        const odds = isOver ? matchingLine.over.price : matchingLine.under.price
        if (odds > bestOdds) {
          bestOdds = odds
          bestBookmaker = bookie
          bestPlayer = player.name
        }
      }
    })
  })

  return bestOdds !== Number.NEGATIVE_INFINITY ? { odds: bestOdds, bookmaker: bestBookmaker, player: bestPlayer } : null
}

// Function to find best values for each player
export function findBestValues(players: Array<{
  name: string
  bookmakers: {
    [key: string]: {
      standardLine: {
        over: { price: number; point: number }
        under: { price: number; point: number }
      } | null
    }
  }
}>) {
  const bestValues: Record<
    string,
    {
      bestOverLine: { value: number; bookies: Set<string> }
      bestUnderLine: { value: number; bookies: Set<string> }
      bestOverOdds: { value: number; bookies: Set<string> }
      bestUnderOdds: { value: number; bookies: Set<string> }
    }
  > = {}

  players.forEach((player) => {
    const playerName = player.name

    // Initialize with default values
    bestValues[playerName] = {
      bestOverLine: { value: Number.POSITIVE_INFINITY, bookies: new Set() },
      bestUnderLine: { value: Number.NEGATIVE_INFINITY, bookies: new Set() },
      bestOverOdds: { value: Number.NEGATIVE_INFINITY, bookies: new Set() },
      bestUnderOdds: { value: Number.NEGATIVE_INFINITY, bookies: new Set() },
    }

    // Collect all lines and odds for this player
    Object.entries(player.bookmakers).forEach(([bookie, data]) => {
      if (!data.standardLine) return

      const { over, under } = data.standardLine

      // For OVER bets: Lower line is better (e.g., over 16.5 is better than over 17.5)
      if (over.point < bestValues[playerName].bestOverLine.value) {
        bestValues[playerName].bestOverLine.value = over.point
        bestValues[playerName].bestOverLine.bookies = new Set([bookie])
      } else if (over.point === bestValues[playerName].bestOverLine.value) {
        bestValues[playerName].bestOverLine.bookies.add(bookie)
      }

      // For UNDER bets: Higher line is better (e.g., under 17.5 is better than under 16.5)
      if (under.point > bestValues[playerName].bestUnderLine.value) {
        bestValues[playerName].bestUnderLine.value = under.point
        bestValues[playerName].bestUnderLine.bookies = new Set([bookie])
      } else if (under.point === bestValues[playerName].bestUnderLine.value) {
        bestValues[playerName].bestUnderLine.bookies.add(bookie)
      }

      // For odds: Higher American odds are always better
      if (over.price > bestValues[playerName].bestOverOdds.value) {
        bestValues[playerName].bestOverOdds.value = over.price
        bestValues[playerName].bestOverOdds.bookies = new Set([bookie])
      } else if (over.price === bestValues[playerName].bestOverOdds.value) {
        bestValues[playerName].bestOverOdds.bookies.add(bookie)
      }

      if (under.price > bestValues[playerName].bestUnderOdds.value) {
        bestValues[playerName].bestUnderOdds.value = under.price
        bestValues[playerName].bestUnderOdds.bookies = new Set([bookie])
      } else if (under.price === bestValues[playerName].bestUnderOdds.value) {
        bestValues[playerName].bestUnderOdds.bookies.add(bookie)
      }
    })
  })

  return bestValues
}

// Function to organize player props
export function organizePlayerProps(propData: any) {
  if (!propData?.bookmakers) return []

  const playerMap = new Map<string, {
    name: string
    bookmakers: {
      [key: string]: {
        standardLine: {
          over: { price: number; point: number }
          under: { price: number; point: number }
        } | null
        alternateLines: Array<{
          over: { price: number; point: number }
          under: { price: number; point: number }
        }>
      }
    }
  }>()

  propData.bookmakers.forEach((bookmaker: any) => {
    // Group markets by key and isAlternate flag
    const standardMarkets: any[] = []
    const alternateMarkets: any[] = []

    bookmaker.markets.forEach((market: any) => {
      if (market.isAlternate) {
        alternateMarkets.push(market)
      } else {
        standardMarkets.push(market)
      }
    })

    // Process standard markets first
    standardMarkets.forEach((market) => {
      // Group outcomes by player (using description field)
      const playerOutcomes = new Map<string, any[]>()
      market.outcomes.forEach((outcome: any) => {
        const playerName = outcome.description
        if (!playerOutcomes.has(playerName)) {
          playerOutcomes.set(playerName, [])
        }
        playerOutcomes.get(playerName)?.push(outcome)
      })

      // Process each player's outcomes
      playerOutcomes.forEach((outcomes, playerName) => {
        if (!playerMap.has(playerName)) {
          playerMap.set(playerName, {
            name: playerName,
            bookmakers: {},
          })
        }

        const player = playerMap.get(playerName)!

        if (!player.bookmakers[bookmaker.key]) {
          player.bookmakers[bookmaker.key] = {
            standardLine: null,
            alternateLines: [],
          }
        }

        const overOutcome = outcomes.find((o) => o.name === "Over")
        const underOutcome = outcomes.find((o) => o.name === "Under")

        if (overOutcome && underOutcome) {
          player.bookmakers[bookmaker.key].standardLine = {
            over: {
              price: overOutcome.price,
              point: overOutcome.point,
            },
            under: {
              price: underOutcome.price,
              point: underOutcome.point,
            },
          }
        }
      })
    })

    // Then process alternate markets
    alternateMarkets.forEach((market) => {
      // Group outcomes by player (using description field)
      const playerOutcomes = new Map<string, any[]>()
      market.outcomes.forEach((outcome: any) => {
        const playerName = outcome.description
        if (!playerOutcomes.has(playerName)) {
          playerOutcomes.set(playerName, [])
        }
        playerOutcomes.get(playerName)?.push(outcome)
      })

      // Group outcomes by point value
      playerOutcomes.forEach((outcomes, playerName) => {
        if (!playerMap.has(playerName)) {
          playerMap.set(playerName, {
            name: playerName,
            bookmakers: {},
          })
        }

        const player = playerMap.get(playerName)!

        if (!player.bookmakers[bookmaker.key]) {
          player.bookmakers[bookmaker.key] = {
            standardLine: null,
            alternateLines: [],
          }
        }

        // Group outcomes by point value
        const pointMap = new Map<number, { over: any; under: any }>()

        outcomes.forEach((outcome) => {
          const point = outcome.point
          if (!pointMap.has(point)) {
            pointMap.set(point, { over: null, under: null })
          }

          const pointEntry = pointMap.get(point)!
          if (outcome.name === "Over") {
            pointEntry.over = outcome
          } else if (outcome.name === "Under") {
            pointEntry.under = outcome
          }
        })

        // Convert the map to an array of lines
        pointMap.forEach((value, point) => {
          if (value.over && value.under) {
            player.bookmakers[bookmaker.key].alternateLines.push({
              over: {
                price: value.over.price,
                point: value.over.point,
              },
              under: {
                price: value.under.price,
                point: value.under.point,
              },
            })
          } else if (value.over) {
            // Handle case where we only have over but not under
            player.bookmakers[bookmaker.key].alternateLines.push({
              over: {
                price: value.over.price,
                point: value.over.point,
              },
              under: {
                price: 0,
                point: value.over.point,
              },
            })
          } else if (value.under) {
            // Handle case where we only have under but not over
            player.bookmakers[bookmaker.key].alternateLines.push({
              over: {
                price: 0,
                point: value.under.point,
              },
              under: {
                price: value.under.price,
                point: value.under.point,
              },
            })
          }
        })

        // Sort alternate lines by point value
        player.bookmakers[bookmaker.key].alternateLines.sort((a, b) => a.over.point - b.over.point)
      })
    })
  })

  return Array.from(playerMap.values())
} 