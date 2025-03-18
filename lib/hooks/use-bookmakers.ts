"use client"

import { useState, useEffect } from "react"
import type { BookmakerKey } from "@/lib/constants/odds-api"
import { DEFAULT_BOOKMAKERS } from "@/lib/utils/parlay-utils"

export function useBookmakers() {
  const [availableBookmakers, setAvailableBookmakers] = useState<BookmakerKey[]>([])
  const [selectedBookmaker, setSelectedBookmaker] = useState<BookmakerKey | null>(null)

  // Update the list of available bookmakers
  const updateAvailableBookmakers = (bookmakers: any[]) => {
    if (!bookmakers || bookmakers.length === 0) return

    const bookmakerKeys = bookmakers.map((b) => b.key as BookmakerKey)

    setAvailableBookmakers((prev) => {
      // Create a Set and then convert back to array to remove duplicates
      const uniqueBookmakers = Array.from(new Set([...prev, ...bookmakerKeys]))

      // Sort by our preferred order
      return uniqueBookmakers.sort((a, b) => {
        const indexA = DEFAULT_BOOKMAKERS.indexOf(a)
        const indexB = DEFAULT_BOOKMAKERS.indexOf(b)
        if (indexA === -1 && indexB === -1) return 0
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })
    })
  }

  // Set default bookmaker when available bookmakers change
  useEffect(() => {
    if (availableBookmakers.length > 0 && !selectedBookmaker) {
      setSelectedBookmaker(availableBookmakers[0])
    }
  }, [availableBookmakers, selectedBookmaker])

  return {
    availableBookmakers,
    selectedBookmaker,
    setSelectedBookmaker,
    updateAvailableBookmakers,
  }
}

