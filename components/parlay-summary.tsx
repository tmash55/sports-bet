"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRightLeft, Trash2 } from "lucide-react"
import type { ParlayLeg } from "@/lib/utils/parlay-utils"
import type { BookmakerKey } from "@/lib/constants/odds-api"

interface ParlaySummaryProps {
  parlayLegs: ParlayLeg[]
  findBestOddsForLeg: (leg: ParlayLeg) => { bookmaker: BookmakerKey; odds: number }
  onRemoveLeg: (legId: string) => void
  onSwitchBookmaker: (legId: string, newBookmaker: BookmakerKey) => void
}

export function ParlaySummary({ parlayLegs, findBestOddsForLeg, onRemoveLeg, onSwitchBookmaker }: ParlaySummaryProps) {
  if (parlayLegs.length === 0) return null

  return (
    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Current Parlay</h3>
        <Badge>{parlayLegs.length} Legs</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {parlayLegs.map((leg) => {
          // Find best odds for this leg
          const bestOdds = findBestOddsForLeg(leg)
          const hasBetterOdds = bestOdds.bookmaker !== leg.bookmaker

          return (
            <Badge key={leg.id} variant="outline" className="flex items-center gap-1">
              {leg.selectionDisplayName}
              <span className="text-xs ml-1 opacity-70">({leg.bookmaker?.toUpperCase()})</span>
              {hasBetterOdds && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 text-amber-500"
                  title={`Switch to ${bestOdds.bookmaker} for better odds`}
                  onClick={() => onSwitchBookmaker(leg.id, bestOdds.bookmaker)}
                >
                  <ArrowRightLeft className="h-3 w-3" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => onRemoveLeg(leg.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </Badge>
          )
        })}
      </div>
    </div>
  )
}

