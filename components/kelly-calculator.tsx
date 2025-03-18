"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { calculateWagerAmount, americanToDecimal } from "@/lib/utils/kelly-calculator"
import { formatOdds } from "@/lib/utils/parlay-utils"
import { Calculator } from "lucide-react"

interface KellyCalculatorProps {
  bookmakerOdds: number
  consensusOdds: number
  evPercentage: number
  selection: string
  initialBankroll?: number
  initialKellyFraction?: number
}

export function KellyCalculator({
  bookmakerOdds,
  consensusOdds,
  evPercentage,
  selection,
  initialBankroll = 1000,
  initialKellyFraction = 0.25,
}: KellyCalculatorProps) {
  const [bankroll, setBankroll] = useState(initialBankroll)
  const [kellyFraction, setKellyFraction] = useState(initialKellyFraction)
  const [showDetails, setShowDetails] = useState(false)

  // Calculate Kelly stake and wager amount
  const { stake, wagerAmount, expectedValue, bookmakerProbability, estimatedProbability } = calculateWagerAmount(
    bankroll,
    bookmakerOdds,
    consensusOdds,
    kellyFraction,
  )

  // Format for display
  const formattedStake = (stake * 100).toFixed(2)
  const formattedWager = wagerAmount.toFixed(2)
  const formattedBookmakerProb = (bookmakerProbability * 100).toFixed(2)
  const formattedEstimatedProb = (estimatedProbability * 100).toFixed(2)
  const formattedEdge = (estimatedProbability - bookmakerProbability) * 100
  const edgePercentage = formattedEdge.toFixed(2)

  // Calculate potential profit
  const decimalOdds = americanToDecimal(bookmakerOdds)
  const potentialProfit = wagerAmount * (decimalOdds - 1)
  const formattedProfit = potentialProfit.toFixed(2)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Kelly Calculator
        </CardTitle>
        <CardDescription>Calculate optimal bet size for {selection}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankroll">Bankroll ($)</Label>
              <Input
                id="bankroll"
                type="number"
                min={1}
                value={bankroll}
                onChange={(e) => setBankroll(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kelly-fraction">Kelly Fraction: {(kellyFraction * 100).toFixed(0)}%</Label>
              <Slider
                id="kelly-fraction"
                min={0.05}
                max={1}
                step={0.05}
                value={[kellyFraction]}
                onValueChange={(value) => setKellyFraction(value[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conservative (5%)</span>
                <span>Full Kelly (100%)</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-md space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Recommended Stake</div>
                <div className="text-2xl font-bold">{formattedStake}%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Wager Amount</div>
                <div className="text-2xl font-bold">${formattedWager}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Potential Profit</div>
                <div className="text-lg font-medium text-green-600">${formattedProfit}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Expected Value</div>
                <div className="text-lg font-medium text-amber-600">+{evPercentage.toFixed(2)}%</div>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? "Hide Details" : "Show Calculation Details"}
          </Button>

          {showDetails && (
            <div className="text-sm space-y-2 bg-muted/30 p-3 rounded-md">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Bookmaker Odds:</span>
                  <span className="ml-2 font-medium">{formatOdds(bookmakerOdds)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Consensus Odds:</span>
                  <span className="ml-2 font-medium">{formatOdds(consensusOdds)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Implied Probability:</span>
                  <span className="ml-2 font-medium">{formattedBookmakerProb}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estimated Probability:</span>
                  <span className="ml-2 font-medium">{formattedEstimatedProb}%</span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground">Probability Edge:</span>
                <span className={`ml-2 font-medium ${Number(edgePercentage) > 0 ? "text-green-600" : "text-red-600"}`}>
                  {Number(edgePercentage) > 0 ? "+" : ""}
                  {edgePercentage}%
                </span>
              </div>

              <div>
                <span className="text-muted-foreground">Kelly Formula:</span>
                <span className="ml-2 font-medium">f* = (b·p - q) / b = {formattedStake}%</span>
              </div>

              <div>
                <span className="text-muted-foreground">Applied Kelly Fraction:</span>
                <span className="ml-2 font-medium">{(kellyFraction * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

