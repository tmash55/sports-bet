"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function OddsDisplay() {
  const [sport, setSport] = useState("americanfootball_nfl")
  const [market, setMarket] = useState("h2h")
  const [odds, setOdds] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOdds = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/odds?sport=${sport}&market=${market}`)

      if (!response.ok) {
        throw new Error("Failed to fetch odds data")
      }

      const data = await response.json()
      setOdds(data)
    } catch (err) {
      setError("Error fetching odds data. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOdds()
  }, [sport, market])

  const sportOptions = [
    { value: "americanfootball_nfl", label: "NFL" },
    { value: "basketball_nba", label: "NBA" },
    { value: "baseball_mlb", label: "MLB" },
    { value: "icehockey_nhl", label: "NHL" },
  ]

  const marketOptions = [
    { value: "h2h", label: "Moneyline" },
    { value: "spreads", label: "Spreads" },
    { value: "totals", label: "Totals" },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Betting Odds</CardTitle>
        <CardDescription>Compare odds across different sportsbooks</CardDescription>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="w-full sm:w-1/2">
            <label className="text-sm font-medium mb-1 block">Sport</label>
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger>
                <SelectValue placeholder="Select Sport" />
              </SelectTrigger>
              <SelectContent>
                {sportOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-1/2">
            <label className="text-sm font-medium mb-1 block">Market</label>
            <Select value={market} onValueChange={setMarket}>
              <SelectTrigger>
                <SelectValue placeholder="Select Market" />
              </SelectTrigger>
              <SelectContent>
                {marketOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">Loading odds data...</div>
        ) : error ? (
          <div className="text-red-500 py-4">{error}</div>
        ) : odds.length === 0 ? (
          <div className="py-4">No odds data available for the selected criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Game</TableHead>
                  <TableHead>Start Time</TableHead>
                  {market === "h2h" && (
                    <>
                      <TableHead>Home</TableHead>
                      <TableHead>Away</TableHead>
                    </>
                  )}
                  {market === "spreads" && (
                    <>
                      <TableHead>Home Spread</TableHead>
                      <TableHead>Away Spread</TableHead>
                    </>
                  )}
                  {market === "totals" && (
                    <>
                      <TableHead>Over</TableHead>
                      <TableHead>Under</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {odds.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell>
                      {game.home_team} vs {game.away_team}
                    </TableCell>
                    <TableCell>{new Date(game.commence_time).toLocaleString()}</TableCell>

                    {market === "h2h" && game.bookmakers && game.bookmakers[0] && (
                      <>
                        <TableCell>
                          {game.bookmakers[0].markets[0].outcomes.find((o: any) => o.name === game.home_team)?.price ||
                            "N/A"}
                        </TableCell>
                        <TableCell>
                          {game.bookmakers[0].markets[0].outcomes.find((o: any) => o.name === game.away_team)?.price ||
                            "N/A"}
                        </TableCell>
                      </>
                    )}

                    {market === "spreads" && game.bookmakers && game.bookmakers[0] && (
                      <>
                        <TableCell>
                          {game.bookmakers[0].markets[0].outcomes.find((o: any) => o.name === game.home_team)?.point ||
                            "N/A"}{" "}
                          (
                          {game.bookmakers[0].markets[0].outcomes.find((o: any) => o.name === game.home_team)?.price ||
                            "N/A"}
                          )
                        </TableCell>
                        <TableCell>
                          {game.bookmakers[0].markets[0].outcomes.find((o: any) => o.name === game.away_team)?.point ||
                            "N/A"}{" "}
                          (
                          {game.bookmakers[0].markets[0].outcomes.find((o: any) => o.name === game.away_team)?.price ||
                            "N/A"}
                          )
                        </TableCell>
                      </>
                    )}

                    {market === "totals" && game.bookmakers && game.bookmakers[0] && (
                      <>
                        <TableCell>
                          {game.bookmakers[0].markets[0].outcomes.find((o: any) => o.name === "Over")?.point || "N/A"} (
                          {game.bookmakers[0].markets[0].outcomes.find((o: any) => o.name === "Over")?.price || "N/A"})
                        </TableCell>
                        <TableCell>
                          {game.bookmakers[0].markets[0].outcomes.find((o: any) => o.name === "Under")?.point || "N/A"}{" "}
                          ({game.bookmakers[0].markets[0].outcomes.find((o: any) => o.name === "Under")?.price || "N/A"}
                          )
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

