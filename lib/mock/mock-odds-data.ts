import type { SportKey, BookmakerKey } from "@/lib/constants/odds-api"
import type { Event, GameOdds } from "@/lib/types/odds-api"

// Mock events data
export const mockEvents: Record<SportKey, Event[]> = {
  basketball_nba: [
    {
      id: "mock-nba-1",
      sport_key: "basketball_nba",
      sport_title: "NBA",
      commence_time: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      home_team: "Los Angeles Lakers",
      away_team: "Golden State Warriors",
    },
    {
      id: "mock-nba-2",
      sport_key: "basketball_nba",
      sport_title: "NBA",
      commence_time: new Date(Date.now() + 172800000).toISOString(), // day after tomorrow
      home_team: "Boston Celtics",
      away_team: "Brooklyn Nets",
    },
    {
      id: "mock-nba-3",
      sport_key: "basketball_nba",
      sport_title: "NBA",
      commence_time: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      home_team: "Miami Heat",
      away_team: "Philadelphia 76ers",
    },
  ],
  americanfootball_nfl: [
    {
      id: "mock-nfl-1",
      sport_key: "americanfootball_nfl",
      sport_title: "NFL",
      commence_time: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      home_team: "Kansas City Chiefs",
      away_team: "Buffalo Bills",
    },
    {
      id: "mock-nfl-2",
      sport_key: "americanfootball_nfl",
      sport_title: "NFL",
      commence_time: new Date(Date.now() + 172800000).toISOString(), // day after tomorrow
      home_team: "Dallas Cowboys",
      away_team: "Philadelphia Eagles",
    },
  ],
  baseball_mlb: [
    {
      id: "mock-mlb-1",
      sport_key: "baseball_mlb",
      sport_title: "MLB",
      commence_time: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      home_team: "New York Yankees",
      away_team: "Boston Red Sox",
    },
    {
      id: "mock-mlb-2",
      sport_key: "baseball_mlb",
      sport_title: "MLB",
      commence_time: new Date(Date.now() + 172800000).toISOString(), // day after tomorrow
      home_team: "Los Angeles Dodgers",
      away_team: "San Francisco Giants",
    },
  ],
  icehockey_nhl: [
    {
      id: "mock-nhl-1",
      sport_key: "icehockey_nhl",
      sport_title: "NHL",
      commence_time: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      home_team: "Toronto Maple Leafs",
      away_team: "Montreal Canadiens",
    },
    {
      id: "mock-nhl-2",
      sport_key: "icehockey_nhl",
      sport_title: "NHL",
      commence_time: new Date(Date.now() + 172800000).toISOString(), // day after tomorrow
      home_team: "Boston Bruins",
      away_team: "New York Rangers",
    },
  ],
} as Record<SportKey, Event[]>

// Helper function to generate mock odds
const generateMockOdds = (event: Event): GameOdds => {
  const bookmakers: BookmakerKey[] = ["draftkings", "fanduel", "betmgm", "caesars", "pointsbet"]

  // Generate random odds
  const getRandomOdds = () => {
    const isPositive = Math.random() > 0.5
    return isPositive ? Math.floor(Math.random() * 250) + 100 : -1 * (Math.floor(Math.random() * 250) + 100)
  }

  // Generate random spread
  const getRandomSpread = () => {
    return (Math.floor(Math.random() * 15) + 1) * (Math.random() > 0.5 ? 1 : -1)
  }

  // Generate random total
  const getRandomTotal = () => {
    return Math.floor(Math.random() * 50) + 200
  }

  return {
    ...event,
    bookmakers: bookmakers.map((bookie) => ({
      key: bookie,
      title: bookie.charAt(0).toUpperCase() + bookie.slice(1),
      last_update: new Date().toISOString(),
      markets: [
        {
          key: "h2h",
          last_update: new Date().toISOString(),
          outcomes: [
            {
              name: event.home_team,
              price: getRandomOdds(),
            },
            {
              name: event.away_team,
              price: getRandomOdds(),
            },
          ],
        },
        {
          key: "spreads",
          last_update: new Date().toISOString(),
          outcomes: [
            {
              name: event.home_team,
              price: getRandomOdds(),
              point: getRandomSpread(),
            },
            {
              name: event.away_team,
              price: getRandomOdds(),
              point: -1 * getRandomSpread(),
            },
          ],
        },
        {
          key: "totals",
          last_update: new Date().toISOString(),
          outcomes: [
            {
              name: "Over",
              price: getRandomOdds(),
              point: getRandomTotal(),
            },
            {
              name: "Under",
              price: getRandomOdds(),
              point: getRandomTotal(),
            },
          ],
        },
      ],
    })),
  }
}

// Get mock events for a sport
export const getMockEvents = (sportKey: SportKey): Event[] => {
  return mockEvents[sportKey] || []
}

// Get mock odds for an event
export const getMockEventOdds = (sportKey: SportKey, eventId: string): GameOdds | null => {
  const event = mockEvents[sportKey]?.find((e) => e.id === eventId)
  if (!event) return null

  return generateMockOdds(event)
}

// Get all available sports
export const getMockSports = () => {
  return [
    {
      key: "basketball_nba",
      group: "Basketball",
      title: "NBA",
      description: "US Basketball",
      active: true,
      has_outrights: false,
    },
    {
      key: "americanfootball_nfl",
      group: "American Football",
      title: "NFL",
      description: "US Football",
      active: true,
      has_outrights: false,
    },
    {
      key: "baseball_mlb",
      group: "Baseball",
      title: "MLB",
      description: "US Baseball",
      active: true,
      has_outrights: false,
    },
    {
      key: "icehockey_nhl",
      group: "Ice Hockey",
      title: "NHL",
      description: "US Ice Hockey",
      active: true,
      has_outrights: false,
    },
  ]
}

