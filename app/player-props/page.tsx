import { ApiModeToggle } from "@/components/api-mode-toggle"
import { ApiUsageStats } from "@/components/api-usage-stats"
import PlayerPropsExplorer from "@/components/player-props-explorer"

export const metadata = {
  title: "Player Props Explorer",
  description: "Compare player props across different sportsbooks",
}

export default function PlayerPropsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Player Props Explorer</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <ApiModeToggle />
        </div>
        <div>
          <ApiUsageStats />
        </div>
      </div>
      <PlayerPropsExplorer />
    </div>
  )
}

