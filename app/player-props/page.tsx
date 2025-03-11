import PlayerPropsExplorer from "@/components/player-props-explorer"


export const metadata = {
  title: "Player Props Explorer",
  description: "Compare player props across different sportsbooks",
}

export default function PlayerPropsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Player Props Explorer</h1>
      <PlayerPropsExplorer />
    </div>
  )
}

