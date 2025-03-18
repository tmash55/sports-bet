"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { BookmakerKey } from "@/lib/constants/odds-api"
import { DEFAULT_BOOKMAKERS } from "@/lib/utils/parlay-utils"

type UserPreferencesContextType = {
  preferredBookmakers: BookmakerKey[]
  setPreferredBookmakers: (bookmakers: BookmakerKey[]) => void
  toggleBookmaker: (bookmaker: BookmakerKey) => void
  isBookmakerPreferred: (bookmaker: BookmakerKey) => boolean
  showAllBookmakers: boolean
  setShowAllBookmakers: (show: boolean) => void
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined)

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  // Initialize with default bookmakers or from localStorage
  const [preferredBookmakers, setPreferredBookmakers] = useState<BookmakerKey[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferredBookmakers")
      return saved ? JSON.parse(saved) : DEFAULT_BOOKMAKERS.slice(0, 3) // Default to top 3
    }
    return DEFAULT_BOOKMAKERS.slice(0, 3)
  })

  const [showAllBookmakers, setShowAllBookmakers] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("showAllBookmakers")
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem("preferredBookmakers", JSON.stringify(preferredBookmakers))
  }, [preferredBookmakers])

  useEffect(() => {
    localStorage.setItem("showAllBookmakers", JSON.stringify(showAllBookmakers))
  }, [showAllBookmakers])

  const toggleBookmaker = (bookmaker: BookmakerKey) => {
    setPreferredBookmakers((current) => {
      if (current.includes(bookmaker)) {
        return current.filter((b) => b !== bookmaker)
      } else {
        return [...current, bookmaker]
      }
    })
  }

  const isBookmakerPreferred = (bookmaker: BookmakerKey) => {
    return preferredBookmakers.includes(bookmaker)
  }

  return (
    <UserPreferencesContext.Provider
      value={{
        preferredBookmakers,
        setPreferredBookmakers,
        toggleBookmaker,
        isBookmakerPreferred,
        showAllBookmakers,
        setShowAllBookmakers,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (context === undefined) {
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider")
  }
  return context
}

