"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SportKey } from "@/lib/constants/odds-api"

interface SportSelectorProps {
  sport: SportKey
  onSportChange: (sport: string) => void
  sportOptions: { value: string; label: string }[]
}

export function SportSelector({ sport, onSportChange, sportOptions }: SportSelectorProps) {
  return (
    <div className="w-full sm:w-1/3">
      <label className="text-sm font-medium mb-1 block">Sport</label>
      <Select value={sport} onValueChange={onSportChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select Sport" />
        </SelectTrigger>
        <SelectContent>
          {sportOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

