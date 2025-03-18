"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Wallet, Check } from "lucide-react"
import { BOOKMAKERS } from "@/lib/constants/odds-api"

// Convert BOOKMAKERS object to array for easier rendering
const BOOKMAKER_LIST = Object.entries(BOOKMAKERS).map(([key, value]) => ({
  id: value,
  name: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase().replace("_", " "),
}))

interface SportsbookSelectorProps {
  selectedBookmakers: string[]
  onChange: (bookmakers: string[]) => void
}

export function SportsbookSelector({ selectedBookmakers, onChange }: SportsbookSelectorProps) {
  const [open, setOpen] = useState(false)
  const [localSelection, setLocalSelection] = useState<string[]>(selectedBookmakers)

  // Update local selection when props change
  useEffect(() => {
    setLocalSelection(selectedBookmakers)
  }, [selectedBookmakers])

  const handleToggle = (bookmakerId: string) => {
    setLocalSelection((current) => {
      if (current.includes(bookmakerId)) {
        return current.filter((id) => id !== bookmakerId)
      } else {
        return [...current, bookmakerId]
      }
    })
  }

  const handleSave = () => {
    onChange(localSelection)
    setOpen(false)
  }

  const handleSelectAll = () => {
    setLocalSelection(BOOKMAKER_LIST.map((bookmaker) => bookmaker.id))
  }

  const handleClearAll = () => {
    setLocalSelection([])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          <span>My Sportsbooks</span>
          <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
            {selectedBookmakers.length}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Your Sportsbooks</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Select the sportsbooks you have accounts with. We&apos;ll only show EV opportunities from these sportsbooks.
          </p>

          <div className="flex justify-between mb-4">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {BOOKMAKER_LIST.map((bookmaker) => (
                <div key={bookmaker.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={bookmaker.id}
                    checked={localSelection.includes(bookmaker.id)}
                    onCheckedChange={() => handleToggle(bookmaker.id)}
                  />
                  <label
                    htmlFor={bookmaker.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                  >
                    {bookmaker.name}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Check className="h-4 w-4" />
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

