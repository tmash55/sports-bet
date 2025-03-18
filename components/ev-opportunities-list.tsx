"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, TrendingUp, AlertCircle, Clock, Zap, Beaker } from "lucide-react"
import { formatOdds } from "@/lib/utils/parlay-utils"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import type { SportKey } from "@/lib/constants/odds-api"
import type { EVOpportunity } from "@/lib/services/ev-finder-service"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import { KellyCalculator } from "./kelly-calculator"
// Add these imports at the top if not already present
import { calculateWagerAmount } from "@/lib/utils/kelly-calculator"
import { Slider } from "@/components/ui/slider"
// Add this to the imports if not already present
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// Add this import
import { SportsbookSelector } from "./sportsbook-selector"
// Replace the incorrect import
// import { BOOKMAKERS } from "@/lib/constants/bookmakers"
// With the correct import
import { BOOKMAKERS } from "@/lib/constants/odds-api"
import { MARKET_INFO } from "@/lib/constants/odds-api"
import { cn } from "@/lib/utils"

interface EVOpportunitiesListProps {
  initialBankroll?: number
  initialKellyFraction?: number
}

export default function EVOpportunitiesList({
  initialBankroll = 1000,
  initialKellyFraction = 0.25,
}: EVOpportunitiesListProps) {
  const [sport, setSport] = useState<SportKey>("basketball_nba")
  const [market, setMarket] = useState<string>("all")
  const [evThreshold, setEvThreshold] = useState(2)
  const [includeLiveGames, setIncludeLiveGames] = useState(false)
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["us"])
  const [opportunities, setOpportunities] = useState<EVOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<"cache" | "fresh" | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [useSharpBooks, setUseSharpBooks] = useState(false)
  const [sharpBookmakers, setSharpBookmakers] = useState<string[]>(["pinnacle"])
  const [bankroll, setBankroll] = useState<number>(initialBankroll)
  const [kellyFraction, setKellyFraction] = useState<number>(initialKellyFraction)
  // Inside the EVOpportunitiesList component, add this state variable
  const [comparisonMethod, setComparisonMethod] = useState<"consensus" | "sharp" | "weighted">("weighted")
  // Add this state for selected bookmakers
  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>([])

  const sportOptions = [
    { value: "basketball_nba", label: "NBA" },
    { value: "basketball_ncaab", label: "NCAAB" },
    { value: "americanfootball_nfl", label: "NFL" },
    { value: "baseball_mlb", label: "MLB" },
    { value: "icehockey_nhl", label: "NHL" },
  ]

  const marketOptions = [
    { value: "all", label: "All Markets" },
    { value: "h2h", label: "Moneyline" },
    { value: "spreads", label: "Spreads" },
    { value: "totals", label: "Totals" },
  ]

  const regionOptions = [
    { value: "us", label: "US" },
    { value: "us2", label: "US (Alt)" },
    { value: "eu", label: "Europe" },
    { value: "uk", label: "United Kingdom" },
    { value: "au", label: "Australia" },
  ]

  // Add this useEffect to initialize from localStorage
  useEffect(() => {
    // Try to load from localStorage
    const savedBookmakers = localStorage.getItem("selectedBookmakers")
    if (savedBookmakers) {
      try {
        const parsed = JSON.parse(savedBookmakers)
        if (Array.isArray(parsed)) {
          setSelectedBookmakers(parsed)
        }
      } catch (e) {
        console.error("Error parsing saved bookmakers", e)
      }
    } else {
      // Default to all bookmakers if nothing saved
      setSelectedBookmakers(Object.values(BOOKMAKERS))
    }
  }, [])

  // Add this function to handle bookmaker selection changes
  const handleBookmakerChange = (bookmakers: string[]) => {
    setSelectedBookmakers(bookmakers)
    // Save to localStorage
    localStorage.setItem("selectedBookmakers", JSON.stringify(bookmakers))
  }

  // Modify the fetchOpportunities function to include the filter parameter
  const fetchOpportunities = async (forceRefresh = false) => {
    setLoading(true)
    setError(null)

    try {
      const markets = market === "all" ? "h2h,spreads,totals" : market
      let url = `/api/ev-opportunities?sport=${sport}&markets=${markets}&threshold=${evThreshold}&includeLive=${includeLiveGames}&regions=${selectedRegions.join(",")}&comparisonMethod=${comparisonMethod}`

      // Add sharp books parameters if needed
      if (comparisonMethod === "sharp") {
        url += `&sharpBookmakers=${sharpBookmakers.join(",")}`
      }

      if (forceRefresh) {
        url += "&refresh=true"
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Failed to fetch EV opportunities")
      }

      const data = await response.json()

      // Filter opportunities by selected bookmakers if any are selected
      const filteredOpportunities =
        selectedBookmakers.length > 0
          ? data.opportunities.filter((opp: EVOpportunity) => selectedBookmakers.includes(opp.bookmaker))
          : data.opportunities || []

      setOpportunities(filteredOpportunities)
      setLastUpdated(data.lastUpdated)
      setDataSource(data.source)
    } catch (err) {
      setError("Error fetching EV opportunities. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Update the useEffect dependency array to include comparisonMethod
  useEffect(() => {
    fetchOpportunities()
  }, [
    sport,
    market,
    evThreshold,
    includeLiveGames,
    selectedRegions,
    comparisonMethod,
    sharpBookmakers,
    selectedBookmakers,
  ])

  // Function to handle region selection
  const handleRegionChange = (value: string[]) => {
    // Ensure at least one region is selected
    if (value.length === 0) {
      toast({
        title: "Region Required",
        description: "At least one region must be selected",
        variant: "destructive",
      })
      return
    }
    setSelectedRegions(value)
  }

  // Function to trigger a manual EV scan
  const triggerManualScan = async () => {
    setScanning(true)

    try {
      // Get the CRON_API_KEY from environment if available
      const apiKey = process.env.NEXT_PUBLIC_CRON_API_KEY || "test-mode"

      // Call the scan endpoint with the includeLive parameter
      const response = await fetch(`/api/cron/scan-ev/test?sport=${sport}&includeLive=${includeLiveGames}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to run EV scan")
      }

      const data = await response.json()

      toast({
        title: "EV Scan Complete",
        description: data.message || "Scan completed successfully. Refresh to see new opportunities.",
      })

      // Automatically refresh the opportunities after scan
      fetchOpportunities(true)
    } catch (err) {
      console.error("Error running manual EV scan:", err)
      toast({
        title: "Scan Failed",
        description: (err as Error).message || "Failed to run EV scan",
        variant: "destructive",
      })
    } finally {
      setScanning(false)
    }
  }

  // Function to test the EV finder directly
  const testEVFinder = async () => {
    setScanning(true)

    try {
      // Call the test endpoint with the includeLive parameter
      const response = await fetch(`/api/test/ev-finder?includeLive=${includeLiveGames}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to run EV test")
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "EV Test Complete",
          description: `Found ${data.opportunitiesCount} opportunities. Check the console for details.`,
        })

        // Log the opportunities to the console
        console.log("EV Test Results:", data)
      } else {
        throw new Error(data.error || "Test failed")
      }

      // Automatically refresh the opportunities after test
      fetchOpportunities(true)
    } catch (err) {
      console.error("Error running EV test:", err)
      toast({
        title: "Test Failed",
        description: (err as Error).message || "Failed to run EV test",
        variant: "destructive",
      })
    } finally {
      setScanning(false)
    }
  }

  // Update the filtering logic for the tabs

  // Filter opportunities by market if needed
  const filteredOpportunities = market === "all" ? opportunities : opportunities.filter((opp) => opp.market === market)

  // Group opportunities by bookmaker
  const opportunitiesByBookmaker: Record<string, EVOpportunity[]> = {}

  filteredOpportunities.forEach((opp) => {
    if (!opportunitiesByBookmaker[opp.bookmaker]) {
      opportunitiesByBookmaker[opp.bookmaker] = []
    }
    opportunitiesByBookmaker[opp.bookmaker].push(opp)
  })

  // Sort bookmakers by number of opportunities
  const sortedBookmakers = Object.keys(opportunitiesByBookmaker).sort(
    (a, b) => opportunitiesByBookmaker[b].length - opportunitiesByBookmaker[a].length,
  )

  const handleRefresh = () => {
    setRefreshing(true)
    fetchOpportunities(true)
  }

  // Add the SportsbookSelector to the UI
  // Add this inside the CardHeader, after the existing filters
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>EV Opportunities</CardTitle>
            <CardDescription>Positive expected value bets across sportsbooks</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {lastUpdated && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Updated {formatDistanceToNow(new Date(lastUpdated))} ago
              </div>
            )}

            {dataSource && (
              <Badge variant={dataSource === "cache" ? "outline" : "default"} className="text-xs">
                {dataSource === "cache" ? "Cached" : "Fresh"}
              </Badge>
            )}

            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={triggerManualScan}
              disabled={scanning}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Zap className={`h-4 w-4 mr-2 ${scanning ? "animate-pulse" : ""}`} />
              {scanning ? "Scanning..." : "Run EV Scan"}
            </Button>
            <Button variant="outline" size="sm" onClick={testEVFinder} disabled={scanning} className="ml-2">
              <Beaker className={`h-4 w-4 mr-2 ${scanning ? "animate-pulse" : ""}`} />
              {scanning ? "Testing..." : "Test EV Finder"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="w-full sm:w-1/5">
            <label className="text-sm font-medium mb-1 block">Sport</label>
            <Select value={sport} onValueChange={(value) => setSport(value as SportKey)}>
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

          <div className="w-full sm:w-1/5">
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

          <div className="w-full sm:w-1/5">
            <label className="text-sm font-medium mb-1 block">Regions</label>
            <MultiSelect
              options={regionOptions}
              selected={selectedRegions}
              onChange={handleRegionChange}
              placeholder="Select Regions"
            />
          </div>

          <div className="w-full sm:w-1/5">
            <label className="text-sm font-medium mb-1 block">Min EV Threshold (%)</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0.5}
                step={0.5}
                value={evThreshold}
                onChange={(e) => setEvThreshold(Number(e.target.value))}
              />
              <span className="text-sm font-medium">%</span>
            </div>
          </div>

          <div className="w-full sm:w-1/5">
            <label className="text-sm font-medium mb-1 block">Include Live Games</label>
            <div className="flex items-center space-x-2">
              <Switch id="include-live" checked={includeLiveGames} onCheckedChange={setIncludeLiveGames} />
              <Label htmlFor="include-live">{includeLiveGames ? "Including live games" : "Excluding live games"}</Label>
            </div>
          </div>
        </div>

        {/* Bankroll and Kelly Fraction Settings */}
        <div className="w-full mt-4 flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-1/2">
            <label className="text-sm font-medium mb-1 block">Bankroll ($)</label>
            <Input
              type="number"
              min={1}
              value={bankroll}
              onChange={(e) => setBankroll(Number(e.target.value))}
              placeholder="Enter your bankroll"
            />
          </div>
          <div className="w-full sm:w-1/2">
            <label className="text-sm font-medium mb-1 block">
              Kelly Fraction: {(kellyFraction * 100).toFixed(0)}%
            </label>
            <Slider
              min={0.05}
              max={1}
              step={0.05}
              value={[kellyFraction]}
              onValueChange={(value) => setKellyFraction(value[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Conservative (5%)</span>
              <span>Full Kelly (100%)</span>
            </div>
          </div>
        </div>

        {/* Add this UI section after the bankroll and Kelly fraction settings */}
        <div className="w-full mt-4">
          <label className="text-sm font-medium mb-2 block">Comparison Method</label>
          <RadioGroup
            value={comparisonMethod}
            onValueChange={(value) => setComparisonMethod(value as "consensus" | "sharp" | "weighted")}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weighted" id="weighted" />
              <Label htmlFor="weighted" className="font-normal">
                Weighted Consensus (OddsJam Method)
              </Label>
              <Badge variant="outline" className="ml-2 text-xs">
                Recommended
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground ml-6 mb-2">
              Uses weighted consensus from all bookmakers, with higher weights for sharper books like Pinnacle.
              Different weights are applied based on sport and market type.
            </p>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sharp" id="sharp" />
              <Label htmlFor="sharp" className="font-normal">
                Sharp Books Method
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6 mb-2">
              Compares US sportsbook odds against Pinnacle or other designated sharp bookmakers.
            </p>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="consensus" id="consensus" />
              <Label htmlFor="consensus" className="font-normal">
                Simple Consensus
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Uses a simple median of all available odds (excluding the bookmaker being compared).
            </p>
          </RadioGroup>
        </div>

        {/* Only show the Sharp Bookmakers section if the sharp method is selected */}
        {comparisonMethod === "sharp" && (
          <div className="mt-2">
            <label className="text-sm font-medium mb-1 block">Sharp Bookmakers</label>
            <MultiSelect
              options={[
                { value: "pinnacle", label: "Pinnacle" },
                { value: "bet365", label: "Bet365" },
                { value: "unibet", label: "Unibet" },
              ]}
              selected={sharpBookmakers}
              onChange={(value) => {
                // Ensure Pinnacle is always included if available
                if (!value.includes("pinnacle") && sharpBookmakers.includes("pinnacle")) {
                  setSharpBookmakers([...value, "pinnacle"])
                } else {
                  setSharpBookmakers(value)
                }
              }}
              placeholder="Select Sharp Bookmakers"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Pinnacle is recommended as the primary reference. Other bookmakers will be used as fallback.
            </p>
          </div>
        )}
        {/* Add this after the existing filters */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            <SportsbookSelector selectedBookmakers={selectedBookmakers} onChange={handleBookmakerChange} />
            {selectedBookmakers.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Showing opportunities from {selectedBookmakers.length} sportsbooks
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="text-center py-12 bg-muted/10 rounded-lg">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No EV opportunities found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or lowering the EV threshold
            </p>
            <Button variant="outline" className="mt-4" onClick={triggerManualScan} disabled={scanning}>
              <Zap className={`h-4 w-4 mr-2 ${scanning ? "animate-pulse" : ""}`} />
              {scanning ? "Scanning..." : "Run EV Scan Now"}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue={sortedBookmakers[0] || "all"}>
            <TabsList className="mb-4 flex flex-wrap h-auto">
              <TabsTrigger value="all" className="text-xs px-3 py-1.5">
                All Bookmakers ({filteredOpportunities.length})
              </TabsTrigger>
              {sortedBookmakers.map((bookmaker) => (
                <TabsTrigger key={bookmaker} value={bookmaker} className="text-xs px-3 py-1.5 capitalize">
                  {bookmaker} ({opportunitiesByBookmaker[bookmaker].length})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <EVOpportunitiesTable
                opportunities={filteredOpportunities}
                bankroll={bankroll}
                kellyFraction={kellyFraction}
              />
            </TabsContent>

            {sortedBookmakers.map((bookmaker) => (
              <TabsContent key={bookmaker} value={bookmaker}>
                <EVOpportunitiesTable
                  opportunities={opportunitiesByBookmaker[bookmaker]}
                  bankroll={bankroll}
                  kellyFraction={kellyFraction}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

interface EVOpportunitiesTableProps {
  opportunities: EVOpportunity[]
  bankroll: number
  kellyFraction: number
}

function EVOpportunitiesTable({ opportunities, bankroll, kellyFraction }: EVOpportunitiesTableProps) {
  // Sort opportunities by EV (highest first)
  const sortedOpportunities = [...opportunities].sort((a, b) => b.ev - a.ev)

  // Add state for selected opportunity
  const [selectedOpportunity, setSelectedOpportunity] = useState<EVOpportunity | null>(null)

  return (
    <div className="space-y-6">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Selection</TableHead>
              <TableHead>Bookmaker</TableHead>
              <TableHead className="text-right">Odds</TableHead>
              <TableHead className="text-right">Consensus</TableHead>
              <TableHead className="text-right">EV</TableHead>
              <TableHead className="text-right">Kelly Bet</TableHead>
              <TableHead className="text-center">Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOpportunities.map((opp) => {
              // Calculate recommended bet size using Kelly formula
              const { wagerAmount } = calculateWagerAmount(bankroll, opp.odds, opp.consensusOdds, kellyFraction)

              // Format for display
              const formattedWager = wagerAmount.toFixed(0)

              return (
                <TableRow
                  key={`${opp.eventId}-${opp.market}-${opp.selection}-${opp.bookmaker}`}
                  className={cn("cursor-pointer hover:bg-muted/50", selectedOpportunity === opp && "bg-muted")}
                  onClick={() => setSelectedOpportunity(opp)}
                >
                  <TableCell>{opp.eventName}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {opp.commenceTime ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{new Date(opp.commenceTime).toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(opp.commenceTime).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {MARKET_INFO[opp.market as keyof typeof MARKET_INFO]?.name ||
                      (opp.market === "h2h"
                        ? "Moneyline"
                        : opp.market === "spreads"
                          ? "Spread"
                          : opp.market === "totals"
                            ? "Total"
                            : opp.market)}
                  </TableCell>
                  <TableCell>
                    {opp.playerName ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{opp.playerName}</span>
                        <span className="text-sm text-muted-foreground">{opp.selection}</span>
                      </div>
                    ) : (
                      opp.selection
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{opp.bookmaker}</TableCell>
                  <TableCell className="text-right font-medium">{formatOdds(opp.odds)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatOdds(opp.consensusOdds)}</TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-green-100 text-green-800 font-medium">+{opp.ev.toFixed(1)}%</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {Number(formattedWager) > 0 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 font-medium">
                        ${formattedWager}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">$0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        opp.comparisonMethod === "weighted"
                          ? "default"
                          : opp.comparisonMethod === "sharp"
                            ? "outline"
                            : "secondary"
                      }
                      className={`text-xs ${
                        opp.comparisonMethod === "weighted"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : opp.comparisonMethod === "sharp"
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                            : ""
                      }`}
                    >
                      {opp.comparisonMethod === "weighted"
                        ? "Weighted"
                        : opp.comparisonMethod === "sharp"
                          ? "Pinnacle"
                          : "Consensus"}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {selectedOpportunity && (
        <div className="mt-6">
          <KellyCalculator
            bookmakerOdds={selectedOpportunity.odds}
            consensusOdds={selectedOpportunity.consensusOdds}
            evPercentage={selectedOpportunity.ev}
            selection={`${selectedOpportunity.selection} (${selectedOpportunity.bookmaker})`}
            initialBankroll={bankroll}
            initialKellyFraction={kellyFraction}
          />
        </div>
      )}
    </div>
  )
}

