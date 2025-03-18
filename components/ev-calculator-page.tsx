"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, Calculator, Zap, TrendingUp } from "lucide-react"
import EVOpportunitiesList from "./ev-opportunities-list"
import { KellyCalculator } from "./kelly-calculator"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function EVCalculatorPage() {
  const [activeTab, setActiveTab] = useState("finder")
  const [manualOdds, setManualOdds] = useState({
    bookmakerOdds: -110,
    consensusOdds: -105,
    evPercentage: 2.2,
    selection: "Custom Bet",
  })

  // Inside the EVCalculatorPage component, add these state variables
  const [bankroll, setBankroll] = useState<number>(1000)
  const [kellyFraction, setKellyFraction] = useState<number>(0.25)

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">EV Calculator</h1>
        <p className="text-muted-foreground">Find positive expected value bets and calculate optimal wager amounts</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="finder" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>EV Finder</span>
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span>Kelly Calculator</span>
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            <span>Guide</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="finder" className="space-y-4">
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertTitle>EV Finder</AlertTitle>
            <AlertDescription>
              Find positive expected value betting opportunities across sportsbooks. Click the calculator icon next to
              any opportunity to calculate the optimal wager amount.
            </AlertDescription>
          </Alert>

          {/* Then in the EV Finder tab, pass these values to the EVOpportunitiesList component */}
          <EVOpportunitiesList initialBankroll={bankroll} initialKellyFraction={kellyFraction} />
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <Alert>
            <Calculator className="h-4 w-4" />
            <AlertTitle>Manual Kelly Calculator</AlertTitle>
            <AlertDescription>
              Enter odds manually to calculate the optimal wager amount using the Kelly Criterion.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Enter Odds</CardTitle>
                <CardDescription>Enter the bookmaker odds and your estimated true odds</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bet Description</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={manualOdds.selection}
                      onChange={(e) => setManualOdds({ ...manualOdds, selection: e.target.value })}
                      placeholder="e.g., Lakers -5.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bookmaker Odds (American)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md"
                      value={manualOdds.bookmakerOdds}
                      onChange={(e) => setManualOdds({ ...manualOdds, bookmakerOdds: Number(e.target.value) })}
                      placeholder="-110"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Consensus/True Odds (American)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md"
                      value={manualOdds.consensusOdds}
                      onChange={(e) => setManualOdds({ ...manualOdds, consensusOdds: Number(e.target.value) })}
                      placeholder="-105"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">EV Percentage</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-2 border rounded-md"
                      value={manualOdds.evPercentage}
                      onChange={(e) => setManualOdds({ ...manualOdds, evPercentage: Number(e.target.value) })}
                      placeholder="2.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <KellyCalculator
              bookmakerOdds={manualOdds.bookmakerOdds}
              consensusOdds={manualOdds.consensusOdds}
              evPercentage={manualOdds.evPercentage}
              selection={manualOdds.selection}
            />
          </div>
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>EV and Kelly Criterion Guide</AlertTitle>
            <AlertDescription>
              Learn how to use the EV Finder and Kelly Calculator to optimize your sports betting.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Understanding Expected Value (EV)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Expected Value (EV) is a mathematical concept that tells you how much you can expect to win (or lose) on
                average per bet. A positive EV bet means you expect to profit in the long run.
              </p>

              <h3 className="text-lg font-medium mt-4">How EV is Calculated</h3>
              <p>
                Our EV Finder compares the odds offered by a bookmaker with the &quot;true&quot; odds (either consensus odds from
                all bookmakers or Pinnacle odds). The difference between these odds represents your edge.
              </p>

              <div className="bg-muted/30 p-4 rounded-md">
                <p className="font-medium">EV Formula:</p>
                <p className="font-mono">EV% = (True Probability × Decimal Odds) - 100%</p>
              </div>

              <p>
                For example, if a bookmaker offers +200 on a bet that has a 40% chance of winning (according to
                consensus), the EV would be (0.40 × 3.0) - 1 = 0.20 or +20%.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Understanding the Kelly Criterion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Kelly Criterion is a mathematical formula that helps determine the optimal size of a bet to maximize
                bankroll growth while minimizing the risk of ruin.
              </p>

              <h3 className="text-lg font-medium mt-4">The Kelly Formula</h3>
              <div className="bg-muted/30 p-4 rounded-md">
                <p className="font-medium">Kelly Formula:</p>
                <p className="font-mono">f* = (b × p - q) / b</p>
                <p className="mt-2">Where:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>f* = fraction of bankroll to wager</li>
                  <li>b = net odds (decimal odds - 1)</li>
                  <li>p = probability of winning</li>
                  <li>q = probability of losing (1-p)</li>
                </ul>
              </div>

              <h3 className="text-lg font-medium mt-4">Fractional Kelly</h3>
              <p>
                Most professional bettors use a fraction of the full Kelly recommendation (typically 1/4 or 1/2 Kelly)
                to reduce variance. This is a more conservative approach that sacrifices some theoretical growth for
                lower risk.
              </p>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md mt-4">
                <p className="font-medium">Important Note:</p>
                <p>
                  The Kelly Criterion assumes that your probability estimates are accurate. If your estimates are off,
                  Kelly can lead to overbetting. This is why we recommend using a fractional Kelly approach.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Use This Tool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3">
                <li>
                  <span className="font-medium">Find EV Opportunities:</span> Use the EV Finder tab to scan for positive
                  EV bets across sportsbooks. You can filter by sport, market, and minimum EV threshold.
                </li>
                <li>
                  <span className="font-medium">Select Your Sport:</span> Choose from NBA, NCAAB, NFL, MLB, or NHL.
                  College basketball (NCAAB) is particularly good for finding value bets during March Madness.
                </li>
                <li>
                  <span className="font-medium">Calculate Optimal Wager:</span> Click the calculator icon next to any
                  opportunity to open the Kelly Calculator. Enter your bankroll and adjust the Kelly fraction to get a
                  recommended wager amount.
                </li>
                <li>
                  <span className="font-medium">Manual Calculations:</span> Use the Kelly Calculator tab to manually
                  enter odds for bets you find elsewhere.
                </li>
                <li>
                  <span className="font-medium">Place Your Bet:</span> Place your bet with the recommended amount at the
                  sportsbook offering the best odds.
                </li>
              </ol>

              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md mt-4">
                <p className="font-medium">Pro Tip:</p>
                <p>
                  Start with a conservative approach (25% Kelly) and track your results. Adjust your Kelly fraction
                  based on your comfort with variance and the accuracy of your probability estimates over time.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button asChild size="lg">
              <Link href="/ev-opportunities">
                <Zap className="mr-2 h-4 w-4" />
                Go to EV Opportunities
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

