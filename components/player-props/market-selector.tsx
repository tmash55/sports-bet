"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MarketSelectorProps {
  activeMarket: string
  availableMarkets: { value: string; label: string }[]
  onMarketChange: (market: string) => void
}

export function MarketSelector({ activeMarket, availableMarkets, onMarketChange }: MarketSelectorProps) {
  return (
    <Tabs value={activeMarket} onValueChange={onMarketChange} className="w-full sm:w-auto">
      <TabsList className="h-9 overflow-x-auto flex-wrap">
        {availableMarkets.map((market) => (
          <TabsTrigger key={market.value} value={market.value} className="px-3 py-1.5 text-xs">
            {market.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

