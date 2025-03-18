"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings } from "lucide-react"
import { DEFAULT_BOOKMAKERS } from "@/lib/utils/parlay-utils"
import type { BookmakerKey } from "@/lib/constants/odds-api"
import { useUserPreferences } from "@/lib/contexts/user-preferences-context"

export function SportsbookPreferences() {
  const { preferredBookmakers, setPreferredBookmakers, showAllBookmakers, setShowAllBookmakers } = useUserPreferences()

  const [open, setOpen] = useState(false)
  const [tempPreferences, setTempPreferences] = useState<BookmakerKey[]>(preferredBookmakers)
  const [tempShowAll, setTempShowAll] = useState(showAllBookmakers)

  const handleToggleBookmaker = (bookmaker: BookmakerKey) => {
    setTempPreferences((current) => {
      if (current.includes(bookmaker)) {
        return current.filter((b) => b !== bookmaker)
      } else {
        return [...current, bookmaker]
      }
    })
  }

  const handleSave = () => {
    setPreferredBookmakers(tempPreferences)
    setShowAllBookmakers(tempShowAll)
    setOpen(false)
  }

  const handleReset = () => {
    setTempPreferences(DEFAULT_BOOKMAKERS.slice(0, 3))
    setTempShowAll(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Sportsbooks
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sportsbook Preferences</DialogTitle>
          <DialogDescription>Select which sportsbooks you want to compare odds from.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Switch id="show-all" checked={tempShowAll} onCheckedChange={setTempShowAll} />
              <Label htmlFor="show-all">Show all available sportsbooks</Label>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              When disabled, only your selected sportsbooks will be shown.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Preferred Sportsbooks</h4>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_BOOKMAKERS.map((bookmaker) => (
                <div key={bookmaker} className="flex items-center space-x-2">
                  <Checkbox
                    id={bookmaker}
                    checked={tempPreferences.includes(bookmaker)}
                    onCheckedChange={() => handleToggleBookmaker(bookmaker)}
                  />
                  <Label htmlFor={bookmaker} className="capitalize">
                    {bookmaker}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <Button onClick={handleSave}>Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

