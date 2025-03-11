"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Trash2, Calculator, Share2, ChevronUp } from "lucide-react"
import type { BookmakerKey } from "@/lib/constants/odds-api"
import { cn } from "@/lib/utils"
import { type ParlayLeg, calculateParlayOdds, formatOdds } from "@/lib/utils/parlay-utils"

interface ParlayDrawerProps {
  parlayLegs: ParlayLeg[]
  availableBookmakers: BookmakerKey[]
  onRemoveLeg: (legId: string) => void
  onClearParlay: () => void
}

export function ParlayDrawer({ parlayLegs, availableBookmakers, onRemoveLeg, onClearParlay }: ParlayDrawerProps) {
  const [open, setOpen] = useState(false)

  // Remove the auto-open useEffect

  // Find the best bookmaker for the parlay
  const findBestBookmaker = () => {
    if (parlayLegs.length === 0 || availableBookmakers.length === 0) return null

    // Calculate parlay odds for each bookmaker
    const parlayOdds: Record<string, number> = {}

    availableBookmakers.forEach((bookie) => {
      // Check if all legs have odds for this bookmaker
      const allLegsHaveOdds = parlayLegs.every((leg) => leg.odds[bookie] !== undefined)

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

  // Calculate potential payout for $100 stake
  const calculatePayout = (odds: number) => {
    if (odds <= 0) {
      return 100 * (100 / Math.abs(odds)) + 100
    } else {
      return 100 * (odds / 100) + 100
    }
  }

  const potentialPayout = bestBookmaker ? calculatePayout(bestBookmaker.odds) : 0

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="default" className="fixed bottom-4 right-4 z-50 shadow-lg rounded-full h-14 w-14 p-0">
          <div className="flex flex-col items-center justify-center">
            <ChevronUp className="h-5 w-5" />
            <span className="text-xs">Parlay</span>
          </div>
          {parlayLegs.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
              {parlayLegs.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] sm:max-w-full">
        <SheetHeader className="flex flex-row justify-between items-center">
          <SheetTitle>Your Parlay ({parlayLegs.length} Legs)</SheetTitle>
          {parlayLegs.length > 0 && (
            <Button variant="outline" size="sm" onClick={onClearParlay}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </SheetHeader>

        <div className="mt-4 flex-1 overflow-auto">
          {parlayLegs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Your parlay is empty. Add bets from the events below.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {parlayLegs.map((leg) => (
                <div key={leg.id} className="flex justify-between items-center p-3 border rounded-md bg-muted/30">
                  <div>
                    <div className="font-medium">{leg.selectionDisplayName}</div>
                    <div className="text-sm text-muted-foreground">{leg.eventName}</div>
                    <div className="text-sm text-muted-foreground">{leg.marketDisplayName}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onRemoveLeg(leg.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Parlay Odds Comparison */}
              {parlayLegs.length > 1 && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium mb-2">Parlay Odds Comparison</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {availableBookmakers.map((bookie) => {
                      // Check if all legs have odds for this bookmaker
                      const allLegsHaveOdds = parlayLegs.every((leg) => leg.odds[bookie] !== undefined)
                      const parlayOdds = allLegsHaveOdds ? calculateParlayOdds(parlayLegs, bookie) : 0
                      const isBest = bestBookmaker?.bookmaker === bookie

                      return (
                        <div
                          key={bookie}
                          className={cn("p-2 border rounded-md text-center", isBest && "bg-green-50 border-green-200")}
                        >
                          <div className="font-medium uppercase text-sm">{bookie}</div>
                          <div className={cn("text-lg", isBest && "text-green-600 font-bold")}>
                            {formatOdds(parlayOdds)}
                          </div>
                          {isBest && <Badge className="bg-green-500">Best Odds</Badge>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {parlayLegs.length > 1 && bestBookmaker && (
          <SheetFooter className="flex-col sm:flex-row gap-4 border-t pt-4 mt-4">
            <div className="text-left">
              <h4 className="font-medium">Best Parlay Odds</h4>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{bestBookmaker.bookmaker?.toUpperCase()}</p>
                <span className="text-lg font-bold">{formatOdds(bestBookmaker.odds)}</span>
              </div>
              <p className="text-sm text-muted-foreground">$100 pays ${potentialPayout.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate
              </Button>
              <Button size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

