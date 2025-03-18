import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "lucide-react"
import { format, isToday, isTomorrow } from "date-fns"
import { EventCard } from "./event-card"
import type { SportKey, BookmakerKey } from "@/lib/constants/odds-api"
import type { ParlayLeg } from "@/lib/utils/parlay-utils"

interface EventsListProps {
  events: any[]
  sport: SportKey
  parlayLegs: ParlayLeg[]
  eventsOdds: Record<string, any>
  selectedBookmaker: BookmakerKey | null
  loading: boolean
  error: string | null
  searchTerm: string
  onAddToParlayMoneyline: (eventId: string, teamName: string, isHome: boolean) => void
  onAddToParlaySpread: (eventId: string, teamName: string, point: number, price: number) => void
  onAddToParlayTotal: (eventId: string, isOver: boolean, point: number) => void
  onAddToParlayPlayerProp: (
    eventId: string,
    playerName: string,
    market: string,
    isOver: boolean,
    point: number,
    price: number,
    bookmaker?: string,
  ) => void
}

export function EventsList({
  events,
  sport,
  parlayLegs,
  eventsOdds,
  selectedBookmaker,
  loading,
  error,
  searchTerm,
  onAddToParlayMoneyline,
  onAddToParlaySpread,
  onAddToParlayTotal,
  onAddToParlayPlayerProp,
}: EventsListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 py-4">{error}</div>
  }

  if (events.length === 0) {
    return (
      <div className="py-4 text-center">
        {searchTerm
          ? `No games found matching "${searchTerm}". Try a different search term.`
          : "No upcoming events found for the selected sport and filters."}
      </div>
    )
  }

  // Group events by date
  const eventsByDate = events.reduce(
    (acc, event) => {
      const date = format(new Date(event.commence_time), "yyyy-MM-dd")
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(event)
      return acc
    },
    {} as Record<string, any[]>,
  )

  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort()

  return (
    <div className="space-y-8">
      {sortedDates.map((date) => (
        <div key={date} className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">
              {isToday(new Date(date))
                ? "Today"
                : isTomorrow(new Date(date))
                  ? "Tomorrow"
                  : format(new Date(date), "EEEE, MMMM d, yyyy")}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eventsByDate[date].map((event: any) => (
              <EventCard
                key={event.id}
                event={event}
                sport={sport}
                parlayLegs={parlayLegs}
                eventOdds={eventsOdds[event.id]}
                selectedBookmaker={selectedBookmaker}
                onAddToParlayMoneyline={onAddToParlayMoneyline}
                onAddToParlaySpread={onAddToParlaySpread}
                onAddToParlayTotal={onAddToParlayTotal}
                onAddToParlayPlayerProp={onAddToParlayPlayerProp}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

