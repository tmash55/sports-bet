"use client"

import { useState, useEffect } from "react"
import { findMatchingLines, type NormalizedOdds } from "@/lib/utils/alternate-lines"

interface UseAlternateLinesProps {
  eventId: string
  market: string
  targetPoint: number
  selection?: string
  bookmakers: any[]
}

export function useAlternateLines({ eventId, market, targetPoint, selection, bookmakers }: UseAlternateLinesProps) {
  const [normalizedOdds, setNormalizedOdds] = useState<NormalizedOdds[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId || !market || !targetPoint || !bookmakers || bookmakers.length === 0) {
      setNormalizedOdds([])
      return
    }

    setLoading(true)

    try {
      // Find matching lines across all bookmakers
      const matchedLines = findMatchingLines(targetPoint, market, bookmakers, selection)
      setNormalizedOdds(matchedLines)
      setLoading(false)
    } catch (err) {
      console.error("Error processing alternate lines:", err)
      setError("Failed to process alternate lines")
      setLoading(false)
    }
  }, [eventId, market, targetPoint, selection, bookmakers])

  return { normalizedOdds, loading, error }
}

