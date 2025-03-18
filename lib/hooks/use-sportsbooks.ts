"use client"

import { useState } from "react"
import type { BookmakerKey } from "@/lib/constants/odds-api"
import { DEFAULT_BOOKMAKERS } from "@/lib/utils/parlay-utils"

export function useSportsbooks() {
  const [sportsbooks, setSportsbooks] = useState<BookmakerKey[]>(DEFAULT_BOOKMAKERS)
  const [selectedBookmakers, setSelectedBookmakers] = useState<BookmakerKey[]>(DEFAULT_BOOKMAKERS)

  const updateSportsbooks = (newBookmakers: BookmakerKey[]) => {
    // Remove duplicates and sort based on DEFAULT_BOOKMAKERS order
    const uniqueBookmakers = Array.from(new Set(newBookmakers))
    const sortedBookmakers = uniqueBookmakers.sort((a, b) => {
      const aIndex = DEFAULT_BOOKMAKERS.indexOf(a)
      const bIndex = DEFAULT_BOOKMAKERS.indexOf(b)
      return aIndex - bIndex
    })
    setSportsbooks(sortedBookmakers)
  }

  const toggleBookmaker = (bookmaker: BookmakerKey) => {
    setSelectedBookmakers((prev) =>
      prev.includes(bookmaker)
        ? prev.filter((b) => b !== bookmaker)
        : [...prev, bookmaker],
    )
  }

  const selectAllBookmakers = () => {
    setSelectedBookmakers(sportsbooks)
  }

  const deselectAllBookmakers = () => {
    setSelectedBookmakers([])
  }

  return {
    sportsbooks,
    selectedBookmakers,
    updateSportsbooks,
    toggleBookmaker,
    selectAllBookmakers,
    deselectAllBookmakers,
  }
} 