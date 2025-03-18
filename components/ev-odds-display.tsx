"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calculator } from "lucide-react"
import EVCalculator from "./ev-calculator"
import { formatOdds } from "@/lib/utils/parlay-utils"
import { oddsToImpliedProbability } from "@/lib/utils/ev-calculator"
import type { BookmakerKey } from "@/lib/constants/odds-api"

interface EVOddsDisplayProps {
  odds: number
  bookmaker: BookmakerKey
  availableBookmakers: BookmakerKey[]
}

export function EVOddsDisplay({ odds, bookmaker, availableBookmakers }: EVOddsDisplayProps) {
  const [evModalOpen, setEvModalOpen] = useState(false)
  const impliedProbability = oddsToImpliedProbability(odds)

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="font-medium">{formatOdds(odds)}</span>
        <Badge variant="outline" className="text-xs">
          {(impliedProbability * 100).toFixed(1)}%
        </Badge>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setEvModalOpen(true)}>
          <Calculator className="h-3 w-3" />
        </Button>
      </div>

      <Dialog open={evModalOpen} onOpenChange={setEvModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Expected Value Calculator</DialogTitle>
          </DialogHeader>
          <EVCalculator initialOdds={odds} initialBookmaker={bookmaker} availableBookmakers={availableBookmakers} />
        </DialogContent>
      </Dialog>
    </>
  )
}

