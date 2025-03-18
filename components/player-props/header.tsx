import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RefreshCw, SlidersHorizontal, ChevronDown, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SportKey } from "@/lib/constants/odds-api"
import { getSportOptions } from "@/lib/hooks/use-odds-api"

interface HeaderProps {
  sport: SportKey
  selectedEvent: {
    away_team: string
    home_team: string
    commence_time: string
  } | null
  viewMode: "standard" | "alternate"
  highlightMode: "line" | "odds"
  selectedBookmakers: string[]
  onViewModeChange: (mode: "standard" | "alternate") => void
  onHighlightModeChange: (mode: "line" | "odds") => void
  onRefresh: () => void
  isRefreshing: boolean
  dataSource: "cache" | "api" | null
  onBookmakerToggle: (bookie: string) => void
  onBookmakerToggleAll: () => void
  bookmakers: string[]
}

export function Header({
  sport,
  selectedEvent,
  viewMode,
  highlightMode,
  selectedBookmakers,
  onViewModeChange,
  onHighlightModeChange,
  onRefresh,
  isRefreshing,
  dataSource,
  onBookmakerToggle,
  onBookmakerToggleAll,
  bookmakers,
}: HeaderProps) {
  const sportOptions = getSportOptions()
  const getSportIcon = (sportKey: SportKey) => {
    const option = sportOptions.find((opt) => opt.value === sportKey)
    return option?.icon || null
  }

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b pb-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary/10 rounded-full">{getSportIcon(sport)}</div>
        <div>
          <h3 className="text-lg font-medium">
            {selectedEvent?.away_team} @ {selectedEvent?.home_team}
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedEvent ? new Date(selectedEvent.commence_time).toLocaleString() : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={viewMode} onValueChange={(value) => onViewModeChange(value as "standard" | "alternate")}>
          <TabsList>
            <TabsTrigger value="standard" className="text-xs">
              Standard Lines
            </TabsTrigger>
            <TabsTrigger value="alternate" className="text-xs">
              Alternate Lines
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Options
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onHighlightModeChange("line")}>
              <div className="flex items-center">
                <div
                  className={cn(
                    "w-4 h-4 rounded-full mr-2",
                    highlightMode === "line" ? "bg-primary" : "border",
                  )}
                />
                Highlight Best Lines
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHighlightModeChange("odds")}>
              <div className="flex items-center">
                <div
                  className={cn(
                    "w-4 h-4 rounded-full mr-2",
                    highlightMode === "odds" ? "bg-primary" : "border",
                  )}
                />
                Highlight Best Odds
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-4 w-4 mr-2" />
              Sportsbooks
              <Badge className="ml-2 h-5 text-xs">{selectedBookmakers.length}</Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Sportsbooks</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onBookmakerToggleAll}>
                  {selectedBookmakers.length === bookmakers.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="space-y-1">
                {bookmakers.map((bookie) => (
                  <div
                    key={bookie}
                    className="flex items-center space-x-2 rounded-md p-1 hover:bg-muted cursor-pointer"
                    onClick={() => onBookmakerToggle(bookie)}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-sm border flex items-center justify-center",
                        selectedBookmakers.includes(bookie) && "bg-primary border-primary",
                      )}
                    >
                      {selectedBookmakers.includes(bookie) && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3 text-primary-foreground"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm uppercase">{bookie}</span>
                  </div>
                ))}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh data from the API</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {dataSource && (
          <Badge variant={dataSource === "cache" ? "secondary" : "outline"} className="h-8">
            {dataSource === "cache" ? "From Cache" : "From API"}
          </Badge>
        )}
      </div>
    </div>
  )
} 