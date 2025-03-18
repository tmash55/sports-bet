"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Database, RefreshCw, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function RedisDashboard() {
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean
    message: string
    data?: any
  } | null>(null)

  const [stats, setStats] = useState<{
    dbSize?: number
    keyCount?: number
    keysByPrefix?: Record<string, number>
    serverInfo?: any
  } | null>(null)

  const [cacheTestResult, setCacheTestResult] = useState<{
    success: boolean
    message: string
    data?: any
    source?: "cache" | "api"
  } | null>(null)

  const [selectedSport, setSelectedSport] = useState("basketball_nba")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/redis-test")
      const data = await response.json()
      setConnectionStatus(data)
    } catch (err) {
      setError("Failed to test Redis connection")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/redis-test?action=stats")
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      } else {
        setError(data.message || "Failed to fetch Redis stats")
      }
    } catch (err) {
      setError("Failed to fetch Redis stats")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const testCacheSports = async () => {
    setLoading(true)
    setCacheTestResult(null)

    try {
      const response = await fetch("/api/cache-test?action=sports")
      const data = await response.json()
      setCacheTestResult(data)
    } catch (err) {
      setError("Failed to test sports caching")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const testCacheEvents = async () => {
    setLoading(true)
    setCacheTestResult(null)

    try {
      const response = await fetch(`/api/cache-test?action=events&sport=${selectedSport}`)
      const data = await response.json()
      setCacheTestResult(data)
    } catch (err) {
      setError("Failed to test events caching")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const clearAllCache = async () => {
    if (!confirm("Are you sure you want to clear all cached data?")) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/cache-test?action=clear")
      const data = await response.json()

      if (data.success) {
        alert(`Cache cleared successfully. Deleted ${data.deletedKeys} keys.`)
        fetchStats() // Refresh stats after clearing
      } else {
        setError(data.message || "Failed to clear cache")
      }
    } catch (err) {
      setError("Failed to clear cache")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
    fetchStats()
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Redis Cache Status</CardTitle>
            <CardDescription>Upstash Redis connection and usage statistics</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              testConnection()
              fetchStats()
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status">
          <TabsList className="mb-4">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="test">Cache Testing</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-6">
            {/* Connection Status */}
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2">Connection Status</h3>

              {connectionStatus ? (
                <div className="flex items-center">
                  {connectionStatus.success ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-600 font-medium">{connectionStatus.message}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-red-600 font-medium">{connectionStatus.message}</span>
                    </>
                  )}
                </div>
              ) : loading ? (
                <div className="flex items-center">
                  <div className="h-5 w-5 border-2 border-t-blue-500 rounded-full animate-spin mr-2"></div>
                  <span>Testing connection...</span>
                </div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : null}
            </div>

            {/* Redis Stats */}
            {stats && (
              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium">Cache Statistics</h3>
                  <Button variant="outline" size="sm" onClick={clearAllCache} disabled={loading}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-md flex items-center">
                    <Database className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <div className="text-sm text-blue-700">Database Size</div>
                      <div className="text-xl font-bold">{stats.dbSize || 0}</div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-3 rounded-md flex items-center">
                    <Database className="h-5 w-5 text-purple-500 mr-2" />
                    <div>
                      <div className="text-sm text-purple-700">Total Keys</div>
                      <div className="text-xl font-bold">{stats.keyCount || 0}</div>
                    </div>
                  </div>
                </div>

                {stats.keysByPrefix && Object.keys(stats.keysByPrefix).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Keys by Prefix</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stats.keysByPrefix).map(([prefix, count]) => (
                        <Badge key={prefix} variant="outline" className="py-1">
                          {prefix}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Redis Server Info */}
            {stats?.serverInfo && (
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-2">Redis Server Info</h3>
                <div className="space-y-2">
                  {stats.serverInfo.ping && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium w-24">Ping:</span>
                      <span className="text-sm">{stats.serverInfo.ping}</span>
                    </div>
                  )}
                  {stats.serverInfo.serverTime && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium w-24">Server Time:</span>
                      <span className="text-sm">{stats.serverInfo.serverTime.toString()}</span>
                    </div>
                  )}
                  {stats.serverInfo.upstash && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium w-24">Provider:</span>
                      <span className="text-sm">Upstash Redis</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-4">Test Cache Functionality</h3>

              <div className="space-y-4">
                <div>
                  <Button onClick={testCacheSports} disabled={loading} className="w-full">
                    {loading ? "Testing..." : "Test Sports Caching"}
                  </Button>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">Sport</label>
                    <Select value={selectedSport} onValueChange={setSelectedSport}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Sport" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basketball_nba">NBA</SelectItem>
                        <SelectItem value="americanfootball_nfl">NFL</SelectItem>
                        <SelectItem value="baseball_mlb">MLB</SelectItem>
                        <SelectItem value="icehockey_nhl">NHL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={testCacheEvents} disabled={loading} className="flex-1">
                    {loading ? "Testing..." : "Test Events Caching"}
                  </Button>
                </div>
              </div>

              {/* Test Results */}
              {cacheTestResult && (
                <div
                  className={`mt-4 p-3 rounded-md ${
                    cacheTestResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center mb-2">
                    {cacheTestResult.success ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="font-medium text-green-700">{cacheTestResult.message}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="font-medium text-red-700">{cacheTestResult.message}</span>
                      </>
                    )}
                  </div>

                  {cacheTestResult.source && (
                    <div className="text-sm">
                      <span className="font-medium">Source:</span>{" "}
                      <Badge variant={cacheTestResult.source === "cache" ? "default" : "outline"}>
                        {cacheTestResult.source === "cache" ? "From Cache" : "From API"}
                      </Badge>
                    </div>
                  )}

                  {cacheTestResult.data && (
                    <div className="mt-2">
                      <details>
                        <summary className="text-sm font-medium cursor-pointer">View Data</summary>
                        <div className="mt-2 text-xs font-mono bg-gray-50 p-2 rounded-md max-h-40 overflow-auto">
                          <pre>{JSON.stringify(cacheTestResult.data, null, 2)}</pre>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

