import { useState, useEffect, useMemo } from "react"
import type { SportKey, BookmakerKey } from "@/lib/constants/odds-api"
import { useEvents } from "@/lib/hooks/use-odds-api"
import { usePlayerProps } from "@/lib/hooks/use-odds-api"
import { useSportsbooks } from "@/lib/hooks/use-sportsbooks"
import { Filters } from "./filters"
import { Header } from "./header"
import { StandardLinesView } from "./standard-lines-view"
import { AlternateLinesView } from "./alternate-lines-view"
import { findBestValues, organizePlayerProps } from "./utils"
import { MARKET_INFO } from "@/lib/constants/odds-api"

// Define types for point ranges
interface PointRange {
  label: string
  min: number
  max: number
}

// Define types for sport options
interface SportOption {
  value: SportKey
  label: string
  icon: React.ReactNode
}

// Define sport options
const sportOptions: SportOption[] = [
  { value: "basketball_nba", label: "NBA", icon: "🏀" },
  { value: "basketball_ncaab", label: "NCAAB", icon: "🏀" },
  { value: "americanfootball_nfl", label: "NFL", icon: "🏈" },
  { value: "americanfootball_ncaaf", label: "NCAAF", icon: "🏈" },
]

// Helper function to group points into ranges
const groupPointsIntoRanges = (points: number[], marketName: string): PointRange[] => {
  if (points.length === 0) return []

  const sortedPoints = [...points].sort((a, b) => a - b)
  const min = Math.floor(sortedPoints[0])
  const max = Math.ceil(sortedPoints[sortedPoints.length - 1])
  const range = max - min

  // Create ranges based on the market type
  if (marketName.toLowerCase().includes("points")) {
    return [
      { label: "Under 10", min: 0, max: 10 },
      { label: "10-15", min: 10, max: 15 },
      { label: "15-20", min: 15, max: 20 },
      { label: "20-25", min: 20, max: 25 },
      { label: "25-30", min: 25, max: 30 },
      { label: "30+", min: 30, max: Infinity },
    ]
  } else if (marketName.toLowerCase().includes("rebounds") || marketName.toLowerCase().includes("assists")) {
    return [
      { label: "Under 5", min: 0, max: 5 },
      { label: "5-10", min: 5, max: 10 },
      { label: "10-15", min: 10, max: 15 },
      { label: "15+", min: 15, max: Infinity },
    ]
  } else if (marketName.toLowerCase().includes("threes")) {
    return [
      { label: "Under 2", min: 0, max: 2 },
      { label: "2-3", min: 2, max: 3 },
      { label: "3-4", min: 3, max: 4 },
      { label: "4+", min: 4, max: Infinity },
    ]
  } else if (marketName.toLowerCase().includes("blocks") || marketName.toLowerCase().includes("steals")) {
    return [
      { label: "Under 2", min: 0, max: 2 },
      { label: "2-3", min: 2, max: 3 },
      { label: "3+", min: 3, max: Infinity },
    ]
  }

  // Default ranges for other markets
  const step = Math.ceil(range / 5)
  return Array.from({ length: 5 }, (_, i) => ({
    label: `${min + i * step}-${min + (i + 1) * step}`,
    min: min + i * step,
    max: min + (i + 1) * step,
  }))
}

export default function PlayerPropsExplorer() {
  const [sport, setSport] = useState<SportKey>("basketball_nba")
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [selectedMarket, setSelectedMarket] = useState<string>("")
  const [viewMode, setViewMode] = useState<"standard" | "alternate">("standard")
  const [highlightMode, setHighlightMode] = useState<"line" | "odds">("line")
  const [displayMode, setDisplayMode] = useState<"table" | "card">("table")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedPointRange, setSelectedPointRange] = useState<string>("")

  const { events, loading: isLoadingEvents } = useEvents(sport)
  const { propData, loading: isLoadingProps, refetch } = usePlayerProps(sport, selectedEventId, [selectedMarket])
  const { sportsbooks, selectedBookmakers, toggleBookmaker, selectAllBookmakers, deselectAllBookmakers } = useSportsbooks()

  // Set default event when events load
  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id)
    }
  }, [events, selectedEventId])

  // Organize player props
  const players = useMemo(() => {
    return organizePlayerProps(propData)
  }, [propData])

  const bestValues = findBestValues(players)

  // Get all unique point values for the selected market
  const getAllPointValues = () => {
    const allPoints = new Set<number>()

    players.forEach((player) => {
      Object.values(player.bookmakers).forEach((bookieData) => {
        bookieData.alternateLines.forEach((line) => {
          allPoints.add(line.over.point)
        })
      })
    })

    return Array.from(allPoints)
  }

  // Get point ranges for the selected market
  const pointRanges = useMemo(() => {
    const allPoints = getAllPointValues()
    const marketName = MARKET_INFO[selectedMarket as keyof typeof MARKET_INFO]?.name || selectedMarket
    return groupPointsIntoRanges(allPoints, marketName)
  }, [selectedMarket, players])

  // Set default point range if none is selected
  useEffect(() => {
    if (pointRanges.length > 0 && !selectedPointRange) {
      setSelectedPointRange(pointRanges[0].label)
    }
  }, [pointRanges, selectedPointRange])

  // Filter points based on selected range
  const filterPointsByRange = (points: number[]) => {
    if (!selectedPointRange) return points

    const selectedRange = pointRanges.find((range) => range.label === selectedPointRange)
    if (!selectedRange) return points

    return points.filter((point) => point >= selectedRange.min && point < selectedRange.max)
  }

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  }

  // Add this function to toggle bookmaker selection
  const handleToggleBookmaker = (bookie: BookmakerKey) => {
    if (selectedBookmakers.includes(bookie)) {
      // If all bookmakers would be deselected, don't allow it
      if (selectedBookmakers.length === 1) return
      toggleBookmaker(bookie)
    } else {
      toggleBookmaker(bookie)
    }
  }

  // Add this function to toggle all bookmakers
  const handleToggleAllBookmakers = () => {
    if (selectedBookmakers.length === sportsbooks.length) {
      // If all are selected, select only the first one
      deselectAllBookmakers()
    } else {
      // Otherwise select all
      selectAllBookmakers()
    }
  }

  // Get the sport icon
  const getSportIcon = (sportKey: SportKey) => {
    const option = sportOptions.find((opt) => opt.value === sportKey)
    return option?.icon || null
  }

  // Add this effect to set default selected bookmakers when data loads
  useEffect(() => {
    if (sportsbooks.length > 0 && selectedBookmakers.length === 0) {
      // Only set selected bookmakers if none are currently selected
      selectAllBookmakers()
    } else if (sportsbooks.length > 0) {
      // If we already have selected bookmakers, only keep the ones that still exist
      const validBookmakers = selectedBookmakers.filter((bookie) => sportsbooks.includes(bookie))

      // If all selected bookmakers were filtered out, select all available ones
      if (validBookmakers.length === 0) {
        selectAllBookmakers()
      }
    }
  }, [sportsbooks, selectedBookmakers])

  return (
    <div className="flex flex-col gap-4">
      <Filters
        sport={sport}
        selectedEventId={selectedEventId}
        selectedMarket={selectedMarket}
        onSportChange={setSport}
        onEventChange={setSelectedEventId}
        onMarketChange={setSelectedMarket}
      />
      {selectedEventId && (
        <>
          <Header
            sport={sport}
            selectedEvent={events?.find((e) => e.id === selectedEventId)}
            viewMode={viewMode}
            highlightMode={highlightMode}
            selectedBookmakers={selectedBookmakers}
            onViewModeChange={setViewMode}
            onHighlightModeChange={setHighlightMode}
            onBookmakerToggle={handleToggleBookmaker}
            onBookmakerToggleAll={handleToggleAllBookmakers}
            onRefresh={refetch}
            isRefreshing={isLoadingProps}
            dataSource={propData?.source || "api"}
            bookmakers={sportsbooks}
          />
          {viewMode === "standard" ? (
            <StandardLinesView
              players={players}
              selectedBookmakers={selectedBookmakers}
              highlightMode={highlightMode}
              bestValues={bestValues}
            />
          ) : (
            <AlternateLinesView
              players={players}
              selectedBookmakers={selectedBookmakers}
              marketName={selectedMarket}
              highlightMode={highlightMode}
              bestValues={bestValues}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              sortDirection={sortDirection}
              onSortDirectionChange={setSortDirection}
              selectedPointRange={selectedPointRange}
              onPointRangeChange={setSelectedPointRange}
              pointRanges={pointRanges}
              filterPointsByRange={filterPointsByRange}
            />
          )}
        </>
      )}
    </div>
  )
} 