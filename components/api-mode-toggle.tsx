"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { InfoIcon } from "lucide-react"

// This is just a UI component - the actual toggle is in the odds-api-client.ts file
export function ApiModeToggle() {
  const [useMockData, setUseMockData] = useState(false)

  // This is just for UI state - the actual toggle happens by refreshing the page
  // which will pick up the localStorage value
  const toggleMockData = () => {
    const newValue = !useMockData
    setUseMockData(newValue)
    localStorage.setItem("USE_MOCK_DATA", newValue.toString())
    // Force reload to apply the change
    window.location.reload()
  }

  // Initialize from localStorage on component mount
  useEffect(() => {
    const storedValue = localStorage.getItem("USE_MOCK_DATA")
    if (storedValue !== null) {
      setUseMockData(storedValue === "true")
    }
  }, [])

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <InfoIcon className="h-5 w-5 text-blue-500" />
            <div>
              <h3 className="font-medium">API Mode</h3>
              <p className="text-sm text-muted-foreground">
                {useMockData ? "Using mock data (no API calls)" : "Using real API (counts toward quota)"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="mock-data-toggle">Use Mock Data</Label>
            <Switch id="mock-data-toggle" checked={useMockData} onCheckedChange={toggleMockData} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

