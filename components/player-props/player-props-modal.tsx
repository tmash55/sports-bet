"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BookmakerKey } from "@/lib/constants/odds-api"
import type { ParlayLeg } from "@/lib/utils/parlay-utils"
import { ScrollArea } from "@/components/ui/scroll-area"

import { MarketSelector } from "./market-selector"
import { SearchAndFilterBar } from "./search-and-filter-bar"
import { PlayerCompareSelector } from "./player-compare-selector"
import { StandardView } from "./views/standard-view"
import { AlternateView } from "./views/alternate-view"
import { CompareView } from "./views/compare-view"
import { LoadingState } from "./loading-state"
import { EmptyState } from "./empty-state"
import { ErrorState } from "./error-state"
import { usePlayerProps } from "./use-player-props"

interface PlayerPropsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: {
    id: string
    sport_key: string
    home_team: string
    away_team: string
  }
  selectedBookmaker: BookmakerKey | null
  parlayLegs: ParlayLeg[]
  onAddToParlayPlayerProp: (
    eventId: string,
    playerName: string,
    market: string,
    isOver: boolean,
    point: number,
    price: number,
    bookmaker?: string,
  ) => void
}

export function PlayerPropsModal({
  open,
  onOpenChange,
  event,
  selectedBookmaker,
  parlayLegs,
  onAddToParlayPlayerProp,
}: PlayerPropsModalProps) {
  const [activeMarket, setActiveMarket] = useState<string>("player_points")
  const [viewMode, setViewMode] = useState<"standard" | "alternate" | "compare">("standard")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "point">("name")
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  // Use our custom hook to handle player props data fetching and processing
  const {
    playerProps,
    players,
    allPlayers,
    loading,
    tabLoading,
    error,
    dataSource,
    refreshing,
    availableMarkets,
    availableBookmakers,
    handleRefresh,
    formatOdds,
    isPlayerPropSelected,
    findBestOdds,
    getMarketDisplayName,
  } = usePlayerProps({
    event,
    activeMarket,
    viewMode,
    searchTerm,
    sortBy,
    selectedBookmaker,
    selectedPlayer,
    parlayLegs,
    open,
  })

  // Reset view when market changes
  const handleMarketChange = (market: string) => {
    setActiveMarket(market)
    setSearchTerm("")
    setViewMode("standard")
    setSelectedPlayer(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Player Props</DialogTitle>
            <Badge variant="outline" className="text-xs">
              {event?.away_team} @ {event?.home_team}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Compare player props across different sportsbooks</p>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Market selector */}
          <div className="px-6 py-3 border-b bg-muted/5 shrink-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <MarketSelector
                activeMarket={activeMarket}
                availableMarkets={availableMarkets}
                onMarketChange={handleMarketChange}
              />

              <div className="flex items-center gap-2">
                {dataSource && (
                  <Badge variant={dataSource === "cache" ? "secondary" : "outline"} className="text-xs">
                    {dataSource === "cache" ? "Cached" : "Live"}
                  </Badge>
                )}
                <Button variant="outline" size="sm" className="h-8 px-2" onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  <span className="sr-only">Refresh</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Search and filter bar */}
          <SearchAndFilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            viewMode={viewMode}
            setViewMode={setViewMode}
            marketDisplayName={getMarketDisplayName(activeMarket)}
          />

          {/* Player selector for compare view */}
          {viewMode === "compare" && (
            <PlayerCompareSelector
              players={players}
              selectedPlayer={selectedPlayer}
              setSelectedPlayer={setSelectedPlayer}
            />
          )}

          {/* Main content area with scrolling */}
          <ScrollArea className="flex-1 overflow-auto">
            <div className="px-6 py-4">
              {loading || tabLoading ? (
                <LoadingState />
              ) : error ? (
                <ErrorState error={error} />
              ) : players.length === 0 ? (
                <EmptyState searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
              ) : viewMode === "standard" ? (
                <StandardView
                  players={players}
                  selectedBookmaker={selectedBookmaker}
                  activeMarket={activeMarket}
                  formatOdds={formatOdds}
                  isPlayerPropSelected={isPlayerPropSelected}
                  onAddToParlayPlayerProp={onAddToParlayPlayerProp}
                  eventId={event.id}
                  setViewMode={setViewMode}
                  setSelectedPlayer={setSelectedPlayer}
                />
              ) : viewMode === "alternate" ? (
                <AlternateView
                  players={players}
                  selectedPlayer={selectedPlayer}
                  activeMarket={activeMarket}
                  formatOdds={formatOdds}
                  onAddToParlayPlayerProp={onAddToParlayPlayerProp}
                  eventId={event.id}
                  getMarketDisplayName={getMarketDisplayName}
                />
              ) : (
                <CompareView
                  player={players.find((p) => p.name === selectedPlayer)}
                  activeMarket={activeMarket}
                  formatOdds={formatOdds}
                  isPlayerPropSelected={isPlayerPropSelected}
                  onAddToParlayPlayerProp={onAddToParlayPlayerProp}
                  eventId={event.id}
                  findBestOdds={findBestOdds}
                />
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

