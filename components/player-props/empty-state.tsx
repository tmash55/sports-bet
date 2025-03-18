"use client"

import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"

interface EmptyStateProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
}

export function EmptyState({ searchTerm, setSearchTerm }: EmptyStateProps) {
  return (
    <div className="text-center py-12 bg-muted/20 rounded-lg">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
        <Info className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">No player props available</h3>
      <p className="text-sm text-muted-foreground mt-1">
        {searchTerm
          ? `No players found matching "${searchTerm}"`
          : "There are no player props available for this market."}
      </p>
      {searchTerm && (
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearchTerm("")}>
          Clear search
        </Button>
      )}
    </div>
  )
}

