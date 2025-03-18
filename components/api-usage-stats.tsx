"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { InfoIcon as InfoCircle, AlertTriangle } from "lucide-react"

export function ApiUsageStats() {
  const [stats, setStats] = useState<{
    today: number
    yesterday: number
    total: number
    remaining?: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Daily limit (adjust based on your API plan)
  const DAILY_LIMIT = 1000 // Update this based on your new plan

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/usage-stats")

        if (!response.ok) {
          throw new Error("Failed to fetch API usage stats")
        }

        const data = await response.json()

        // Get remaining requests from localStorage if available
        let remaining: number | undefined = undefined
        if (typeof window !== "undefined") {
          const remainingStr = localStorage.getItem("api_remaining_requests")
          if (remainingStr) {
            remaining = Number.parseInt(remainingStr, 10)
          }
        }

        setStats({
          ...data.data,
          remaining,
        })
      } catch (err) {
        setError("Error loading API usage statistics")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading usage statistics...</div>
        </CardContent>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error || "Failed to load statistics"}</div>
        </CardContent>
      </Card>
    )
  }

  const todayPercentage = Math.min(100, (stats.today / DAILY_LIMIT) * 100)
  const remainingPercentage = stats.remaining ? Math.min(100, (stats.remaining / DAILY_LIMIT) * 100) : null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>API Usage</CardTitle>
        <Badge variant={todayPercentage > 80 ? "destructive" : "outline"}>
          {stats.remaining ? `${stats.remaining} remaining` : `${stats.today} used today`}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Today&apos;s Usage</span>
              <span className="text-sm font-medium">
                {stats.today} / {DAILY_LIMIT}
              </span>
            </div>
            <Progress value={todayPercentage} className="h-2" />
          </div>

          {remainingPercentage !== null && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Remaining Quota</span>
                <span className="text-sm font-medium">
                  {stats.remaining} / {DAILY_LIMIT}
                </span>
              </div>
              <Progress value={remainingPercentage} className="h-2 bg-gray-200" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Yesterday</span>
              <p className="text-2xl font-bold">{stats.yesterday}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total (2 days)</span>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>

          {todayPercentage > 80 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Approaching daily limit</p>
                <p className="text-sm">Consider reducing refresh frequency or enabling mock data temporarily.</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded flex items-start">
            <InfoCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Using Real API Data</p>
              <p className="text-sm">You can switch to mock data at any time using the toggle in the header.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

