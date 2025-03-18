"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Calculator, DollarSign, BarChart3, Info, HelpCircle } from "lucide-react"
import {
  oddsToImpliedProbability,
  calculateEV,
  calculateFairOdds,
  calculateNoVigProbabilities,
  calculateMargin,
  calculateKelly,
} from "@/lib/utils/ev-calculator"
import { formatOdds } from "@/lib/utils/parlay-utils"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { BookmakerKey } from "@/lib/constants/odds-api"
import { DEFAULT_BOOKMAKERS } from "@/lib/utils/parlay-utils"
import { PLAYER_MARKETS, MARKET_INFO, type SportKey } from "@/lib/constants/odds-api"
import { usePlayerProps } from "@/lib/hooks/use-odds-api"

interface EVCalculatorProps {
  initialOdds?: number
  initialBookmaker?: BookmakerKey
  availableBookmakers?: BookmakerKey[]
  initialSport?: SportKey
  initialMarket?: string
  initialPlayer?: string
  eventId?: string
}

export default function EVCalculator({
  initialOdds = -110,
  initialBookmaker,
  availableBookmakers = DEFAULT_BOOKMAKERS,
  initialSport = "basketball_nba",
  initialMarket,
  initialPlayer,
  eventId,
}: EVCalculatorProps) {
  // Calculator state
  const [activeTab, setActiveTab] = useState("calculator")
  const [odds, setOdds] = useState(initialOdds)
  const [estimatedProbability, setEstimatedProbability] = useState(0.55)
  const [betAmount, setBetAmount] = useState(100)
  const [bankroll, setBankroll] = useState(1000)
  const [kellyFraction, setKellyFraction] = useState(0.5)
  const [selectedSport, setSelectedSport] = useState<SportKey>(initialSport)
  const [selectedMarket, setSelectedMarket] = useState(initialMarket || "")
  const [selectedPlayer, setSelectedPlayer] = useState(initialPlayer || "")

  // Comparison state
  const [homeOdds, setHomeOdds] = useState(-110)
  const [awayOdds, setAwayOdds] = useState(-110)
  const [selectedBookmaker, setSelectedBookmaker] = useState<BookmakerKey | undefined>(initialBookmaker)

  // Player props data fetching
  const { propData, loading: loadingProps } = usePlayerProps(
    selectedSport,
    eventId || null,
    selectedMarket ? [selectedMarket] : []
  )

  // Get available markets for selected sport
  const availableMarkets = useMemo(() => {
    if (selectedSport in PLAYER_MARKETS) {
      const markets = PLAYER_MARKETS[selectedSport as keyof typeof PLAYER_MARKETS]
      return Object.entries(markets).map(([key, value]) => ({
        value,
        label: MARKET_INFO[value]?.name || value,
      }))
    }
    return []
  }, [selectedSport])

  // Get available players for selected market
  const availablePlayers = useMemo(() => {
    if (!propData) return []
    
    const players = new Set<string>()
    propData.bookmakers?.forEach((bookmaker) => {
      bookmaker.markets?.forEach((market) => {
        if (market.key === selectedMarket) {
          market.outcomes?.forEach((outcome) => {
            if (outcome.name) players.add(outcome.name)
          })
        }
      })
    })
    
    return Array.from(players).sort()
  }, [propData, selectedMarket])

  // Update odds when player and market are selected
  useEffect(() => {
    if (selectedPlayer && selectedMarket && propData) {
      // Find the best odds for the selected player and market
      let bestOdds = -110 // Default value
      propData.bookmakers?.forEach((bookmaker) => {
        const market = bookmaker.markets?.find((m) => m.key === selectedMarket)
        const outcome = market?.outcomes?.find((o) => o.name === selectedPlayer)
        if (outcome?.price) {
          if (outcome.price > bestOdds) {
            bestOdds = outcome.price
          }
        }
      })
      setOdds(bestOdds)
    }
  }, [selectedPlayer, selectedMarket, propData])

  // Calculated values
  const impliedProbability = oddsToImpliedProbability(odds)
  const ev = calculateEV(betAmount, odds, estimatedProbability)
  const evPercent = (ev / betAmount) * 100
  const fairOdds = calculateFairOdds(estimatedProbability)
  const kellyBet = calculateKelly(estimatedProbability, odds, bankroll, kellyFraction)

  // No-vig calculations for comparison tab
  const noVigProbs = calculateNoVigProbabilities(homeOdds, awayOdds)
  const margin = calculateMargin([homeOdds, awayOdds])

  // Format the EV for display
  const formatEV = (value: number) => {
    const sign = value >= 0 ? "+" : ""
    return `${sign}$${value.toFixed(2)}`
  }

  // Format probability for display
  const formatProbability = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  // Determine EV status
  const getEVStatus = () => {
    if (evPercent >= 5) return { label: "Strong +EV", color: "bg-green-100 text-green-800" }
    if (evPercent > 0) return { label: "Positive EV", color: "bg-emerald-100 text-emerald-800" }
    if (evPercent > -5) return { label: "Negative EV", color: "bg-amber-100 text-amber-800" }
    return { label: "Strong -EV", color: "bg-red-100 text-red-800" }
  }

  const evStatus = getEVStatus()

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Expected Value Calculator</CardTitle>
            <CardDescription>Calculate the expected value of your bets</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>
                  Expected Value (EV) helps determine if a bet offers value. Positive EV means the bet is profitable in
                  the long run. The calculation compares your estimated probability with the implied probability from
                  the odds.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span>EV Calculator</span>
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Odds Comparison</span>
            </TabsTrigger>
            <TabsTrigger value="kelly" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Kelly Calculator</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sport">Sport</Label>
                  <Select value={selectedSport} onValueChange={(value) => setSelectedSport(value as SportKey)}>
                    <SelectTrigger id="sport">
                      <SelectValue placeholder="Select a sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basketball_nba">NBA</SelectItem>
                      <SelectItem value="americanfootball_nfl">NFL</SelectItem>
                      <SelectItem value="baseball_mlb">MLB</SelectItem>
                      <SelectItem value="icehockey_nhl">NHL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {availableMarkets.length > 0 && (
                  <div>
                    <Label htmlFor="market">Market</Label>
                    <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                      <SelectTrigger id="market">
                        <SelectValue placeholder="Select a market" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMarkets.map((market) => (
                          <SelectItem key={market.value} value={market.value}>
                            {market.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Player Selection */}
                {availablePlayers.length > 0 && (
                  <div>
                    <Label htmlFor="player">Player</Label>
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger id="player">
                        <SelectValue placeholder="Select a player" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlayers.map((player) => (
                          <SelectItem key={player} value={player}>
                            {player}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Loading State */}
                {loadingProps && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Loading player props...</span>
                  </div>
                )}

                <div>
                  <Label htmlFor="odds">American Odds</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="odds"
                      type="number"
                      value={odds}
                      onChange={(e) => setOdds(Number(e.target.value))}
                      className="w-full"
                    />
                    <Badge variant="outline">{formatProbability(impliedProbability)} implied</Badge>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="probability">Your Estimated Probability</Label>
                    <span className="text-sm font-medium">{formatProbability(estimatedProbability)}</span>
                  </div>
                  <Slider
                    id="probability"
                    min={0.01}
                    max={0.99}
                    step={0.01}
                    value={[estimatedProbability]}
                    onValueChange={(value) => setEstimatedProbability(value[0])}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="bet-amount">Bet Amount ($)</Label>
                  <Input
                    id="bet-amount"
                    type="number"
                    min={1}
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="bg-muted/20 rounded-lg p-6 space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-1">Expected Value</h3>
                  <div className="text-3xl font-bold">{formatEV(ev)}</div>
                  <Badge className={cn("mt-2", evStatus.color)}>
                    {evStatus.label} ({evPercent.toFixed(1)}%)
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Implied Probability:</span>
                    <span className="font-medium">{formatProbability(impliedProbability)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Your Probability:</span>
                    <span className="font-medium">{formatProbability(estimatedProbability)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Edge:</span>
                    <span
                      className={cn(
                        "font-medium",
                        estimatedProbability > impliedProbability ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {formatProbability(Math.abs(estimatedProbability - impliedProbability))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fair Odds:</span>
                    <span className="font-medium">{formatOdds(fairOdds)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">How to use this calculator</p>
                  <p className="text-sm mt-1">
                    Enter the odds offered by the sportsbook, your estimated probability of the outcome, and your bet
                    amount. The calculator will show if the bet has positive expected value (profitable long-term) or
                    negative expected value.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="home-odds">Home Team Odds</Label>
                  <Input
                    id="home-odds"
                    type="number"
                    value={homeOdds}
                    onChange={(e) => setHomeOdds(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="away-odds">Away Team Odds</Label>
                  <Input
                    id="away-odds"
                    type="number"
                    value={awayOdds}
                    onChange={(e) => setAwayOdds(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="bookmaker">Bookmaker</Label>
                  <Select
                    value={selectedBookmaker}
                    onValueChange={(value) => setSelectedBookmaker(value as BookmakerKey)}
                  >
                    <SelectTrigger id="bookmaker" className="mt-1">
                      <SelectValue placeholder="Select Bookmaker" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBookmakers.map((bookie) => (
                        <SelectItem key={bookie} value={bookie}>
                          {bookie.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-muted/20 rounded-lg p-6 space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-1">Bookmaker Margin</h3>
                  <div className="text-3xl font-bold">{margin.toFixed(2)}%</div>
                  <Badge
                    className={cn(
                      "mt-2",
                      margin < 3
                        ? "bg-green-100 text-green-800"
                        : margin < 5
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800",
                    )}
                  >
                    {margin < 3 ? "Low Margin" : margin < 5 ? "Average Margin" : "High Margin"}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Home Implied Probability:</span>
                    <span className="font-medium">{formatProbability(oddsToImpliedProbability(homeOdds))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Away Implied Probability:</span>
                    <span className="font-medium">{formatProbability(oddsToImpliedProbability(awayOdds))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Home No-Vig Probability:</span>
                    <span className="font-medium">{formatProbability(noVigProbs.home)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Away No-Vig Probability:</span>
                    <span className="font-medium">{formatProbability(noVigProbs.away)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Understanding the Margin</p>
                  <p className="text-sm mt-1">
                    The bookmaker&apos;s margin (or &quot;vig&quot;) represents their profit margin built into the odds. Lower margins
                    are better for bettors. The no-vig probabilities show what the &quot;true&quot; probabilities would be without
                    the bookmaker&apos;s margin.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="kelly" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="kelly-odds">American Odds</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="kelly-odds"
                      type="number"
                      value={odds}
                      onChange={(e) => setOdds(Number(e.target.value))}
                      className="w-full"
                    />
                    <Badge variant="outline">{formatProbability(impliedProbability)} implied</Badge>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="kelly-probability">Your Estimated Probability</Label>
                    <span className="text-sm font-medium">{formatProbability(estimatedProbability)}</span>
                  </div>
                  <Slider
                    id="kelly-probability"
                    min={0.01}
                    max={0.99}
                    step={0.01}
                    value={[estimatedProbability]}
                    onValueChange={(value) => setEstimatedProbability(value[0])}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="bankroll">Bankroll ($)</Label>
                  <Input
                    id="bankroll"
                    type="number"
                    min={1}
                    value={bankroll}
                    onChange={(e) => setBankroll(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="kelly-fraction">Kelly Fraction</Label>
                    <span className="text-sm font-medium">{kellyFraction.toFixed(1)}</span>
                  </div>
                  <Slider
                    id="kelly-fraction"
                    min={0.1}
                    max={1}
                    step={0.1}
                    value={[kellyFraction]}
                    onValueChange={(value) => setKellyFraction(value[0])}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="bg-muted/20 rounded-lg p-6 space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-1">Kelly Bet Size</h3>
                  <div className="text-3xl font-bold">${kellyBet.toFixed(2)}</div>
                  <Badge className="mt-2 bg-blue-100 text-blue-800">
                    {((kellyBet / bankroll) * 100).toFixed(1)}% of Bankroll
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Full Kelly:</span>
                    <span className="font-medium">
                      ${calculateKelly(estimatedProbability, odds, bankroll, 1).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Half Kelly:</span>
                    <span className="font-medium">
                      ${calculateKelly(estimatedProbability, odds, bankroll, 0.5).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quarter Kelly:</span>
                    <span className="font-medium">
                      ${calculateKelly(estimatedProbability, odds, bankroll, 0.25).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Edge:</span>
                    <span
                      className={cn(
                        "font-medium",
                        estimatedProbability > impliedProbability ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {formatProbability(Math.abs(estimatedProbability - impliedProbability))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">About Kelly Criterion</p>
                  <p className="text-sm mt-1">
                    The Kelly Criterion is a formula that determines the optimal bet size to maximize bankroll growth
                    over time. Many bettors use a fraction of Kelly (Half Kelly or Quarter Kelly) to reduce variance.
                    Only use Kelly when you have a true edge.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

