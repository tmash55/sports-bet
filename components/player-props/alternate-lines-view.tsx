import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LayoutGrid, Table2, ArrowUpDown } from "lucide-react"
import type { BookmakerKey } from "@/lib/constants/odds-api"

interface AlternateLinesViewProps {
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
  }>
  selectedBookmakers: BookmakerKey[]
  marketName: string
  highlightMode: "line" | "odds"
  bestValues: {
    [key: string]: {
      bestOverLine: { value: number; bookies: Set<string> }
      bestUnderLine: { value: number; bookies: Set<string> }
      bestOverOdds: { value: number; bookies: Set<string> }
      bestUnderOdds: { value: number; bookies: Set<string> }
    }
  }
}

// Format odds for display
const formatOdds = (price: number): string => {
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
const groupPointsIntoRanges = (points: number[], marketName: string): { label: string; min: number; max: number }[] => {
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

export function AlternateLinesView({
  players,
  selectedBookmakers,
  marketName,
  highlightMode,
  bestValues,
}: AlternateLinesViewProps) {
  const [displayMode, setDisplayMode] = useState<"table" | "card">("table")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedPointRange, setSelectedPointRange] = useState<string | null>(null)

  // Get all unique point values
  const allPoints = new Set<number>()
  players.forEach((player) => {
    Object.values(player.bookmakers).forEach((bookie) => {
      bookie.alternateLines.forEach((line) => {
        allPoints.add(line.over.point)
      })
    })
  })

  // Get point ranges
  const pointRanges = groupPointsIntoRanges(Array.from(allPoints), marketName)

  // Set default point range if none is selected
  if (pointRanges.length > 0 && !selectedPointRange) {
    setSelectedPointRange(pointRanges[0].label)
  }

  // Filter points based on selected range
  const filterPointsByRange = (points: number[]) => {
    if (!selectedPointRange) return points

    const selectedRange = pointRanges.find((range) => range.label === selectedPointRange)
    if (!selectedRange) return points

    return points.filter((point) => point >= selectedRange.min && point < selectedRange.max)
  }

  // Get filtered and sorted points
  const filteredPoints = filterPointsByRange(Array.from(allPoints))
  const sortedPoints = [...filteredPoints].sort((a, b) =>
    sortDirection === "asc" ? a - b : b - a,
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={displayMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setDisplayMode("table")}
            className="flex items-center gap-1"
          >
            <Table2 className="h-4 w-4" />
            <span>Table View</span>
          </Button>
          <Button
            variant={displayMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setDisplayMode("card")}
            className="flex items-center gap-1"
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Card View</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
            className="flex items-center gap-1"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>Sort {sortDirection === "asc" ? "Ascending" : "Descending"}</span>
          </Button>

          {pointRanges.length > 0 && (
            <Select value={selectedPointRange || ""} onValueChange={setSelectedPointRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {pointRanges.map((range) => (
                  <SelectItem key={range.label} value={range.label}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {displayMode === "table" ? (
        // TABLE VIEW
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Line</TableHead>
                {selectedBookmakers.map((bookie) => (
                  <TableHead key={bookie} className="text-center">
                    {bookie.toUpperCase()}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPoints.map((point) => (
                <TableRow key={point}>
                  <TableCell className="font-medium">{point}</TableCell>
                  {selectedBookmakers.map((bookie) => {
                    // Find any player that has this point/bookmaker combination
                    let matchingLine = null
                    let matchingPlayer = null

                    for (const player of players) {
                      const bookieData = player.bookmakers[bookie]
                      if (!bookieData?.alternateLines) continue

                      const line = bookieData.alternateLines.find(
                        (line) => Math.abs(line.over.point - point) < 0.01,
                      )

                      if (line) {
                        matchingLine = line
                        matchingPlayer = player
                        break
                      }
                    }

                    const isOverBest = bestValues[matchingPlayer?.name || ""]?.bestOverOdds.bookies.has(bookie)
                    const isUnderBest = bestValues[matchingPlayer?.name || ""]?.bestUnderOdds.bookies.has(bookie)

                    return (
                      <TableCell key={bookie} className="text-center p-0">
                        {matchingLine ? (
                          <div className="flex flex-col">
                            <div className={cn("py-2 px-3", isOverBest && "bg-green-100")}>
                              <span className="text-xs font-medium">O</span>{" "}
                              <span
                                className={cn(
                                  "font-medium",
                                  matchingLine.over.price > 0 ? "text-emerald-600" : "text-red-600",
                                )}
                              >
                                {formatOdds(matchingLine.over.price)}
                              </span>
                            </div>
                            <div className={cn("py-2 px-3 border-t border-muted", isUnderBest && "bg-blue-100")}>
                              <span className="text-xs font-medium">U</span>{" "}
                              <span
                                className={cn(
                                  "font-medium",
                                  matchingLine.under.price > 0 ? "text-emerald-600" : "text-red-600",
                                )}
                              >
                                {formatOdds(matchingLine.under.price)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground p-3 block">-</span>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        // CARD VIEW
        <div className="space-y-8">
          {players.map((player) => {
            // Check if this player has any alternate lines
            const hasAlternateLines = Object.values(player.bookmakers).some(
              (bookie) => bookie.alternateLines && bookie.alternateLines.length > 0,
            )

            if (!hasAlternateLines) return null

            // Get all unique point values for this player
            const allPoints = new Set<number>()
            Object.values(player.bookmakers).forEach((bookie) => {
              bookie.alternateLines.forEach((line) => {
                allPoints.add(line.over.point)
              })
            })

            // Filter points based on selected range
            const filteredPoints = filterPointsByRange(Array.from(allPoints))

            // Sort points based on direction
            const sortedPoints = [...filteredPoints].sort((a, b) =>
              sortDirection === "asc" ? a - b : b - a,
            )

            if (sortedPoints.length === 0) return null

            return (
              <div key={player.name} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{player.name}</h3>
                  <Badge variant="outline">{sortedPoints.length} alternate lines</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedPoints.map((point) => (
                    <Card key={point} className="overflow-hidden">
                      <CardHeader className="bg-muted/20 py-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">Line: {point}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {marketName}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Over</h4>
                            <div className="space-y-2">
                              {selectedBookmakers.map((bookie) => {
                                // Find the player that has this bookie and point
                                let matchingPlayer = null
                                let matchingLine = null

                                for (const player of players) {
                                  const bookieData = player.bookmakers[bookie]
                                  if (!bookieData?.alternateLines) continue

                                  const line = bookieData.alternateLines.find(
                                    (line) => Math.abs(line.over.point - point) < 0.01,
                                  )

                                  if (line) {
                                    matchingPlayer = player
                                    matchingLine = line
                                    break
                                  }
                                }

                                if (!matchingLine) return null

                                const isBestOdds =
                                  bestValues[matchingPlayer?.name || ""]?.bestOverOdds.bookies.has(bookie)

                                return (
                                  <div key={`${bookie}-over`} className="flex justify-between items-center">
                                    <span className="text-sm capitalize">{bookie}</span>
                                    <span
                                      className={cn(
                                        "px-2 py-1 rounded font-medium text-sm",
                                        isBestOdds && "bg-green-100",
                                        matchingLine.over.price > 0 ? "text-emerald-600" : "text-red-600",
                                      )}
                                    >
                                      {formatOdds(matchingLine.over.price)}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2">Under</h4>
                            <div className="space-y-2">
                              {selectedBookmakers.map((bookie) => {
                                // Find the player that has this bookie and point
                                let matchingPlayer = null
                                let matchingLine = null

                                for (const player of players) {
                                  const bookieData = player.bookmakers[bookie]
                                  if (!bookieData?.alternateLines) continue

                                  const line = bookieData.alternateLines.find(
                                    (line) => Math.abs(line.under.point - point) < 0.01,
                                  )

                                  if (line) {
                                    matchingPlayer = player
                                    matchingLine = line
                                    break
                                  }
                                }

                                if (!matchingLine) return null

                                const isBestOdds =
                                  bestValues[matchingPlayer?.name || ""]?.bestUnderOdds.bookies.has(bookie)

                                return (
                                  <div key={`${bookie}-under`} className="flex justify-between items-center">
                                    <span className="text-sm capitalize">{bookie}</span>
                                    <span
                                      className={cn(
                                        "px-2 py-1 rounded font-medium text-sm",
                                        isBestOdds && "bg-blue-100",
                                        matchingLine.under.price > 0 ? "text-emerald-600" : "text-red-600",
                                      )}
                                    >
                                      {formatOdds(matchingLine.under.price)}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}

          {players.every(
            (player) =>
              !Object.values(player.bookmakers).some(
                (bookie) => bookie.alternateLines && bookie.alternateLines.length > 0,
              ),
          ) && (
            <div className="py-4 text-center text-muted-foreground">
              No alternate lines available for this game and market.
            </div>
          )}
        </div>
      )}
    </div>
  )
} 