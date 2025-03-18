import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { BookmakerKey } from "@/lib/constants/odds-api"

interface StandardLinesViewProps {
  players: Array<{
    name: string
    bookmakers: {
      [key: string]: {
        standardLine: {
          over: { price: number; point: number }
          under: { price: number; point: number }
        } | null
      }
    }
  }>
  selectedBookmakers: BookmakerKey[]
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
  // If the price is already in American format
  if (Number.isInteger(price)) {
    if (price === 1) return "(1)"
    return price > 0 ? `+${price}` : `${price}`
  }

  // If we need to convert from decimal to American
  if (price >= 2) {
    return `+${Math.round((price - 1) * 100)}`
  } else {
    return `${Math.round(-100 / (price - 1))}`
  }
}

export function StandardLinesView({
  players,
  selectedBookmakers,
  highlightMode,
  bestValues,
}: StandardLinesViewProps) {
  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            {selectedBookmakers.map((bookie) => (
              <TableHead key={bookie} className="text-center">
                {bookie.toUpperCase()}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.name}>
              <TableCell className="font-medium">{player.name}</TableCell>
              {selectedBookmakers.map((bookie) => (
                <TableCell key={bookie} className="text-center p-0">
                  {player.bookmakers[bookie]?.standardLine ? (
                    <div className="space-y-0">
                      <div
                        className={cn(
                          "py-2 px-3 font-medium",
                          highlightMode === "line" &&
                            bestValues[player.name]?.bestOverLine.bookies.has(bookie) &&
                            "bg-green-100",
                          highlightMode === "odds" &&
                            bestValues[player.name]?.bestOverOdds.bookies.has(bookie) &&
                            "bg-green-100",
                        )}
                      >
                        O {player.bookmakers[bookie].standardLine!.over.point}
                        <span
                          className={cn(
                            "text-sm ml-1",
                            player.bookmakers[bookie].standardLine!.over.price > 0
                              ? "text-emerald-600"
                              : "text-red-600",
                          )}
                        >
                          {formatOdds(player.bookmakers[bookie].standardLine!.over.price)}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "py-2 px-3 font-medium border-t",
                          highlightMode === "line" &&
                            bestValues[player.name]?.bestUnderLine.bookies.has(bookie) &&
                            "bg-blue-100",
                          highlightMode === "odds" &&
                            bestValues[player.name]?.bestUnderOdds.bookies.has(bookie) &&
                            "bg-blue-100",
                        )}
                      >
                        U {player.bookmakers[bookie].standardLine!.under.point}
                        <span
                          className={cn(
                            "text-sm ml-1",
                            player.bookmakers[bookie].standardLine!.under.price > 0
                              ? "text-emerald-600"
                              : "text-red-600",
                          )}
                        >
                          {formatOdds(player.bookmakers[bookie].standardLine!.under.price)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground p-3 block">N/A</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 