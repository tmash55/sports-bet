"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, SortAsc, Filter, ArrowUpDown } from "lucide-react"

interface SearchAndFilterBarProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  sortBy: "name" | "point"
  setSortBy: (sort: "name" | "point") => void
  viewMode: "standard" | "alternate" | "compare"
  setViewMode: (mode: "standard" | "alternate" | "compare") => void
  marketDisplayName: string
}

export function SearchAndFilterBar({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  marketDisplayName,
}: SearchAndFilterBarProps) {
  return (
    <div className="px-6 py-3 border-b shrink-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search ${marketDisplayName} props...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1"
            onClick={() => setSortBy(sortBy === "name" ? "point" : "name")}
          >
            <SortAsc className="h-3.5 w-3.5" />
            <span className="text-xs">{sortBy === "name" ? "Name" : "Line"}</span>
          </Button>
          <Button
            variant={viewMode === "standard" ? "default" : "outline"}
            size="sm"
            className="h-9 gap-1"
            onClick={() => setViewMode("standard")}
          >
            <span className="text-xs">Standard</span>
          </Button>
          <Button
            variant={viewMode === "alternate" ? "default" : "outline"}
            size="sm"
            className="h-9 gap-1"
            onClick={() => setViewMode("alternate")}
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Alt Lines</span>
          </Button>
          <Button
            variant={viewMode === "compare" ? "default" : "outline"}
            size="sm"
            className="h-9 gap-1"
            onClick={() => setViewMode("compare")}
          >
            <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Compare</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

