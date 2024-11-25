'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface Player {
  id: string
  name: string
  position: string
  team: {
    id: string
    name: string
    abbreviation: string
  }
}

interface Odd {
  id: string
  market: string
  name: string
  price: string
  points: number
  selection: string
  players: Player[]
}

interface Game {
  id: string
  teams: {
    away: { name: string; abbreviation: string }
    home: { name: string; abbreviation: string }
  }
  start: string
  sportsbooks: Array<{
    id: string
    name: string
    odds: Odd[]
  }>
}

interface ApiResponse {
  games: Game[]
}

interface PlayerPoints {
  id: string
  name: string
  gameName: string
  gameTime: string
  points: number
  overPrice: string
  underPrice: string
}

export function NBAPlayerProps() {
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchPlayerPointsData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/oddsblaze/nba/points", {
        cache: "no-store",
        headers: {
          Pragma: "no-cache",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch data")
      }
      const data: ApiResponse = await response.json()
      setGames(data.games)
    } catch (err) {
      console.error("Error fetching player points data:", err)
      toast({
        title: "Error",
        description: "Failed to load odds data. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPlayerPointsData()
  }, [])

  const playerPointsData = useMemo(() => {
    return games.flatMap((game) =>
      game.sportsbooks[0]?.odds
        .filter((odd) => odd.market === "Player Points")
        .reduce((acc, odd) => {
          const existingPlayer = acc.find(
            (player) => player.name === odd.players[0]?.name
          )
          if (existingPlayer) {
            if (odd.selection === "Over") {
              existingPlayer.overPrice = odd.price
            } else {
              existingPlayer.underPrice = odd.price
            }
          } else {
            acc.push({
              id: odd.id,
              name: odd.players[0]?.name || "Unknown Player",
              gameName: `${game.teams.away.name} @ ${game.teams.home.name}`,
              gameTime: new Date(game.start).toLocaleString(),
              points: odd.points,
              overPrice: odd.selection === "Over" ? odd.price : "",
              underPrice: odd.selection === "Under" ? odd.price : "",
            })
          }
          return acc
        }, [] as PlayerPoints[])
    )
  }, [games])

  const sortedPlayerPointsData = useMemo(() => {
    return [...playerPointsData].sort((a, b) => b.points - a.points)
  }, [playerPointsData])

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Game</TableHead>
              <TableHead>Points Over/Under</TableHead>
              <TableHead>Over Odds</TableHead>
              <TableHead>Under Odds</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayerPointsData.map((player, index) => (
              <TableRow
                key={player.id}
                className={index % 2 === 0 ? "bg-background" : "bg-muted/50"}
              >
                <TableCell>{player.name}</TableCell>
                <TableCell>{player.gameName}</TableCell>
                <TableCell>{player.points}</TableCell>
                <TableCell>{player.overPrice}</TableCell>
                <TableCell>{player.underPrice}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

