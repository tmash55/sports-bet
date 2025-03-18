"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Trash2, Share2, ChevronUp, Copy, Check, X, Calculator, ArrowRightLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"
import type { BookmakerKey } from "@/lib/constants/odds-api"
import { cn } from "@/lib/utils"
import { type ParlayLeg, calculateParlayOdds, formatOdds, americanToDecimal } from "@/lib/utils/parlay-utils"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ParlayDrawerProps {
  parlayLegs: ParlayLeg[]
  availableBookmakers: BookmakerKey[]
  onRemoveLeg: (legId: string) => void
  onClearParlay: () => void
  onSwitchBookmaker?: (legId: string, newBookmaker: BookmakerKey) => void
  findBestOddsForLeg?: (leg: ParlayLeg) => { bookmaker: BookmakerKey; odds: number }
}

export function ParlayDrawer({
  parlayLegs,
  availableBookmakers,
  onRemoveLeg,
  onClearParlay,
  onSwitchBookmaker,
  findBestOddsForLeg,
}: ParlayDrawerProps) {
  const [open, setOpen] = useState(false)
  const [wagerAmount, setWagerAmount] = useState(100)
  const [copied, setCopied] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [selectedBookmakers, setSelectedBookmakers] = useState<BookmakerKey[]>([])

  // Set initial selected bookmakers based on available ones
  useEffect(() => {
    if (availableBookmakers.length > 0 && selectedBookmakers.length === 0) {
      // Select first 3 bookmakers by default
      setSelectedBookmakers(availableBookmakers.slice(0, 3))
    }
  }, [availableBookmakers, selectedBookmakers])

  // Find the best bookmaker for the parlay
  const findBestBookmaker = () => {
    if (parlayLegs.length === 0 || availableBookmakers.length === 0) return null

    // Calculate parlay odds for each bookmaker
    const parlayOdds: Record<string, number> = {}

    // Check all available bookmakers
    availableBookmakers.forEach((bookie) => {
      // Check if all legs have odds for this bookmaker
      const allLegsHaveOdds = parlayLegs.every((leg) => {
        return leg.odds[bookie] !== undefined && leg.odds[bookie] !== null
      })

      if (allLegsHaveOdds) {
        parlayOdds[bookie] = calculateParlayOdds(parlayLegs, bookie)
      }
    })

    // Find the bookmaker with the best odds
    let bestBookie: BookmakerKey | null = null
    let bestOdds = Number.NEGATIVE_INFINITY

    Object.entries(parlayOdds).forEach(([bookie, odds]) => {
      if (odds > bestOdds) {
        bestOdds = odds
        bestBookie = bookie as BookmakerKey
      }
    })

    return { bookmaker: bestBookie, odds: bestOdds }
  }

  const bestBookmaker = findBestBookmaker()

  // Calculate potential payout for stake
  const calculatePayout = (odds: number, stake: number) => {
    const decimalOdds = americanToDecimal(odds)
    return stake * decimalOdds
  }

  const potentialPayout = bestBookmaker ? calculatePayout(bestBookmaker.odds, wagerAmount) : 0
  const profit = potentialPayout - wagerAmount

  // Generate a shareable text for the parlay
  const generateShareText = () => {
    if (parlayLegs.length === 0) return ""

    const bookieName = bestBookmaker?.bookmaker?.toUpperCase() || "BEST ODDS"
    const oddsText = bestBookmaker ? formatOdds(bestBookmaker.odds) : ""

    let text = `🎲 My ${parlayLegs.length}-Leg Parlay (${oddsText}) at ${bookieName}\n\n`

    parlayLegs.forEach((leg, index) => {
      text += `${index + 1}. ${leg.selectionDisplayName} (${leg.eventName})\n`
    })

    text += `\nPotential Payout: $${wagerAmount} → $${potentialPayout.toFixed(2)}`
    text += `\n\nBuilt with Sports Betting App`

    return text
  }

  // Copy parlay to clipboard
  const copyToClipboard = () => {
    const text = generateShareText()
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast({
      title: "Copied to clipboard",
      description: "Your parlay has been copied to your clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  // Count how many legs have better odds available
  const legsWithBetterOdds = findBestOddsForLeg
    ? parlayLegs.filter((leg) => {
        const bestOdds = findBestOddsForLeg(leg)
        return bestOdds.bookmaker !== leg.bookmaker
      }).length
    : 0

  // Toggle bookmaker selection
  const toggleBookmaker = (bookie: BookmakerKey) => {
    if (selectedBookmakers.includes(bookie)) {
      setSelectedBookmakers(selectedBookmakers.filter((b) => b !== bookie))
    } else {
      setSelectedBookmakers([...selectedBookmakers, bookie])
    }
  }

  // Get parlay odds for a specific bookmaker
  const getParlayOdds = (bookie: BookmakerKey) => {
    const allLegsHaveOdds = parlayLegs.every((leg) => leg.odds[bookie] !== undefined)
    return allLegsHaveOdds ? calculateParlayOdds(parlayLegs, bookie) : null
  }

  // Render a parlay leg
  const renderParlayLeg = (leg: ParlayLeg) => {
    // Find best odds for this leg if the function is available
    const bestOdds = findBestOddsForLeg
      ? findBestOddsForLeg(leg)
      : { bookmaker: leg.bookmaker, odds: leg.odds[leg.bookmaker] }
    const hasBetterOdds = bestOdds.bookmaker !== leg.bookmaker

    return (
      <div
        key={leg.id}
        className="flex justify-between items-start p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
      >
        <div className="space-y-1 flex-1">
          <div className="font-medium">{leg.selectionDisplayName}</div>
          <div className="text-sm text-muted-foreground">{leg.eventName}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs capitalize">
              {leg.bookmaker}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {formatOdds(leg.odds[leg.bookmaker])}
            </Badge>
            {hasBetterOdds && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                      onClick={() => onSwitchBookmaker && onSwitchBookmaker(leg.id, bestOdds.bookmaker)}
                    >
                      <ArrowRightLeft className="h-3 w-3 mr-1" />
                      Better odds: {bestOdds.bookmaker.toUpperCase()} ({formatOdds(bestOdds.odds)})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to switch to better odds</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemoveLeg(leg.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // Render bookmaker comparison section
  const renderBookmakerComparison = () => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Odds Comparison</h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() =>
              setSelectedBookmakers(
                selectedBookmakers.length === availableBookmakers.length ? [] : [...availableBookmakers],
              )
            }
          >
            {selectedBookmakers.length === availableBookmakers.length ? "Deselect All" : "Select All"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {availableBookmakers.map((bookie) => (
            <Badge
              key={bookie}
              variant={selectedBookmakers.includes(bookie) ? "default" : "outline"}
              className="cursor-pointer capitalize"
              onClick={() => toggleBookmaker(bookie)}
            >
              {bookie}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {selectedBookmakers.map((bookie) => {
            const parlayOdds = getParlayOdds(bookie)
            const isBest = bestBookmaker?.bookmaker === bookie

            return (
              <Card
                key={bookie}
                className={cn(
                  "overflow-hidden transition-all",
                  isBest ? "border-green-500 bg-green-50 shadow-sm" : "",
                  !parlayOdds && "opacity-70",
                )}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-xs font-medium uppercase", isBest && "text-green-700")}>{bookie}</span>
                    {isBest && <Badge className="text-[10px] h-4 px-1 bg-green-600 text-white border-0">Best</Badge>}
                  </div>
                  {parlayOdds ? (
                    <div className={cn("text-lg font-bold", isBest && "text-green-700")}>{formatOdds(parlayOdds)}</div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <X className="h-3 w-3 text-muted-foreground/70" />
                      <span>Not available</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // Render calculator section
  const renderCalculator = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <h4 className="text-sm font-medium">Payout Calculator</h4>
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setShowCalculator(!showCalculator)}>
            {showCalculator ? "Hide" : "Show"}
          </Button>
        </div>

        {showCalculator && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wager-amount" className="text-sm">
                Wager Amount ($)
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="wager-amount"
                  type="number"
                  min="1"
                  value={wagerAmount}
                  onChange={(e) => setWagerAmount(Number(e.target.value))}
                  className="w-24"
                />
                <Slider
                  value={[wagerAmount]}
                  min={1}
                  max={1000}
                  step={1}
                  onValueChange={(value) => setWagerAmount(value[0])}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                <div className="text-xs text-blue-600 mb-1">Potential Payout</div>
                <div className="text-xl font-bold text-blue-700">${potentialPayout.toFixed(2)}</div>
              </div>

              <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                <div className="text-xs text-green-600 mb-1">Potential Profit</div>
                <div className="text-xl font-bold text-green-700">${profit.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Floating button in bottom right corner */}
      <Button
        variant={open ? "secondary" : "default"}
        className={cn(
          "fixed bottom-4 right-4 z-50 shadow-lg rounded-full h-14 px-4 flex items-center gap-2",
          open ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">Bet Slip</span>
          {parlayLegs.length > 0 && (
            <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center">{parlayLegs.length}</Badge>
          )}
        </div>
        <ChevronUp className="h-4 w-4" />
      </Button>

      {/* Drawer that slides up from bottom */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="p-0 rounded-t-xl max-h-[80vh] overflow-hidden">
          <div className="flex flex-col h-full max-h-[80vh]">
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between sticky top-0 bg-background z-10">
              <div className="flex items-center gap-2">
                <div className="h-1 w-10 bg-muted rounded-full mx-auto mb-2 mt-1" />
                <h3 className="font-medium">Bet Slip</h3>
                {parlayLegs.length > 0 && (
                  <Badge variant="secondary">
                    {parlayLegs.length} {parlayLegs.length === 1 ? "Leg" : "Legs"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {parlayLegs.length > 0 && (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyToClipboard}>
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy parlay to clipboard</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const text = generateShareText()
                              if (navigator.share) {
                                navigator
                                  .share({
                                    title: "My Parlay",
                                    text: text,
                                  })
                                  .catch(console.error)
                              } else {
                                copyToClipboard()
                              }
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Share parlay</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClearParlay}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {parlayLegs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8">
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-lg font-medium mb-2">Your bet slip is empty</p>
                  <p className="text-sm">Add bets from the events above to build your parlay.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto">
                  {/* Two-column layout for desktop, single column for mobile */}
                  <div className="p-4">
                    <div className="md:grid md:grid-cols-2 md:gap-6">
                      {/* Left column - Parlay legs */}
                      <div className="space-y-3 mb-6 md:mb-0">
                        <h4 className="text-sm font-medium">SELECTIONS</h4>
                        <div className="space-y-3">{parlayLegs.map(renderParlayLeg)}</div>
                      </div>

                      {/* Right column - Odds comparison */}
                      <div className="space-y-3">{renderBookmakerComparison()}</div>
                    </div>

                    {/* Calculator section - spans both columns */}
                    <div className="mt-6 border-t pt-4">{renderCalculator()}</div>
                  </div>
                </div>

                {/* Footer with total and actions */}
                <div className="border-t p-4 bg-muted/20">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Odds</div>
                      <div className="text-xl font-bold">{bestBookmaker ? formatOdds(bestBookmaker.odds) : "N/A"}</div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground">Wager</div>
                      <div className="text-xl font-bold">${wagerAmount.toFixed(2)}</div>
                    </div>

                    <div className="col-span-2 pt-2 mt-1 border-t">
                      <div className="text-sm text-muted-foreground">Potential Payout</div>
                      <div className="text-xl font-bold text-green-600">${potentialPayout.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

