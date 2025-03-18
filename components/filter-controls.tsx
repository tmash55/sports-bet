"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter, Search, RefreshCw } from "lucide-react"
import type { BookmakerKey } from "@/lib/constants/odds-api"
import { SportsbookPreferences } from "./sportsbook-preferences"

interface FilterControlsProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  dateFilter: "all" | "today" | "tomorrow"
  setDateFilter: (filter: "all" | "today" | "tomorrow") => void
  selectedBookmaker: BookmakerKey | null
  setSelectedBookmaker: (bookmaker: BookmakerKey) => void
  availableBookmakers: BookmakerKey[]
  refreshing: boolean
  onRefresh: () => void
}

export function FilterControls({
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
  selectedBookmaker,
  setSelectedBookmaker,
  availableBookmakers,
  refreshing,
  onRefresh,
}: FilterControlsProps) {
  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search for teams..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Filter and Refresh Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter:</span>
          <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as any)}>
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tomorrow">Tomorrow</SelectItem>
            </SelectContent>
          </Select>

          {/* Sportsbook Selection */}
          <Select
            value={selectedBookmaker || ""}
            onValueChange={(value) => setSelectedBookmaker(value as BookmakerKey)}
            disabled={availableBookmakers.length === 0}
          >
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder="Select Sportsbook" />
            </SelectTrigger>
            <SelectContent>
            {availableBookmakers
                .filter((bookie) => typeof bookie === 'string' && bookie.trim() !== "")
                .map((bookie) => (
                    <SelectItem key={bookie} value={bookie}>
                    {bookie.toUpperCase()}
                    </SelectItem>
                ))}

            </SelectContent>
          </Select>

          <SportsbookPreferences />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Odds"}
        </Button>
      </div>
    </div>
  )
}

