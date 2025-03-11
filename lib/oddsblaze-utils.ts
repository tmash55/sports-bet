import { NextResponse } from "next/server";

export interface Player {
  id: string;
  name: string;
  position: string;
  team: {
    id: string;
    name: string;
    abbreviation: string;
  };
}

export interface Odd {
  id: string;
  group: string;
  market: string;
  name: string;
  main: boolean;
  price: number | string; // Changed to number | string to accommodate string prices like "+290"
  points: number | null;
  selection: string | null; // Changed to allow null values
  link: string;
  sgp: string;
  grade: string | null; // Changed to allow null values
  players: Player[]; // Changed from any[] to Player[]
  updated: string;
}

export interface Sportsbook {
  id: string;
  name: string;
  odds: Odd[];
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
}

export interface Game {
  id: string;
  sport: string;
  league: string;
  teams: {
    away: Team;
    home: Team;
  };
  start: string;
  status: string;
  live: boolean;
  tournament: string;
  sportsbooks: Sportsbook[];
}

export interface OddsBlazeResponse {
  games: Game[];
}

export interface PlayerOdd {
  player: string;
  line: number;
  over?: number;
  under?: number;
  main: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface AccumulatedData {
  [player: string]: {
    player: string;
    gameDate: string;
    sportsbooks: {
      [bookName: string]: {
        main: {
          line: string | number;
          over: string | number;
          under: string | number;
        };
        alternates: {
          line: string | number;
          over: string | number;
          under: string | number;
        }[];
      };
    };
  };
}

export async function fetchOddsBlazeData(
  sport: string,
  market: string,
  isAlternate: boolean = false
): Promise<OddsBlazeResponse[]> {
  const apiKey = process.env.ODDSBLAZE_API_KEY;
  if (!apiKey) {
    throw new Error("ODDSBLAZE_API_KEY is not set in environment variables");
  }

  const sportsbooks = ["draftkings", "fanduel", "betmgm"];
  const encodedMarket = encodeURIComponent(market);
  const urls = sportsbooks.map(
    (book) =>
      `https://data.oddsblaze.com/v1/odds/${book}_${sport}.json?key=${apiKey}&market=${encodedMarket}&live=false${
        isAlternate ? "&main=false" : ""
      }`
  );

  try {
    const responses = await Promise.all(
      urls.map((url) => fetch(url, { cache: "no-store" }))
    );
    const data = await Promise.all(
      responses.map(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json() as Promise<OddsBlazeResponse>;
      })
    );
    return data;
  } catch (error) {
    console.error("Error fetching OddsBlaze data:", error);
    throw error;
  }
}

export function processOddsBlazeData(
  allData: OddsBlazeResponse[],
  market: string
): AccumulatedData {
  return allData.reduce<AccumulatedData>((acc, sportsbook, index) => {
    const bookName = ["DraftKings", "FanDuel", "BetMGM"][index];

    sportsbook.games.forEach((game) => {
      const gameDate = new Date(game.start).toISOString().split("T")[0];
      const playerOdds = new Map<string, PlayerOdd[]>();

      game.sportsbooks[0].odds.forEach((odd) => {
        if (odd.market === market && odd.players && odd.players[0]) {
          const player = odd.players[0].name;
          if (!playerOdds.has(player)) {
            playerOdds.set(player, []);
          }
          playerOdds.get(player)?.push({
            player,
            line: odd.points,
            [odd.selection.toLowerCase()]: odd.price,
            main: odd.main,
          });
        }
      });

      playerOdds.forEach((odds, player) => {
        if (!acc[player]) {
          acc[player] = { player, gameDate, sportsbooks: {} };
        }
        if (!acc[player].sportsbooks[bookName]) {
          acc[player].sportsbooks[bookName] = {
            main: { line: "N/A", over: "N/A", under: "N/A" },
            alternates: [],
          };
        }

        const mainOdd = odds.find((odd) => odd.main);
        const overOdd = odds.find((odd) => odd.main && odd.over !== undefined);
        const underOdd = odds.find(
          (odd) => odd.main && odd.under !== undefined
        );

        if (mainOdd) {
          acc[player].sportsbooks[bookName].main = {
            line: mainOdd.line,
            over: overOdd ? overOdd.over : "N/A",
            under: underOdd ? underOdd.under : "N/A",
          };
        }

        odds
          .filter((odd) => !odd.main)
          .forEach((odd) => {
            acc[player].sportsbooks[bookName].alternates.push({
              line: odd.line,
              over: odd.over ?? "N/A",
              under: odd.under ?? "N/A",
            });
          });
      });
    });

    return acc;
  }, {});
}

export function handleOddsBlazeRequest(
  sport: string,
  market: string,
  isAlternate: boolean = false
) {
  return async function GET() {
    try {
      console.log(
        `Handling request for sport: ${sport}, market: ${market}, isAlternate: ${isAlternate}`
      );
      const allData = await fetchOddsBlazeData(sport, market, isAlternate);

      const combinedData = processOddsBlazeData(allData, market);

      const sortedData = Object.values(combinedData).sort((a, b) =>
        a.player.localeCompare(b.player)
      );

      return NextResponse.json(sortedData, {
        headers: {
          "Cache-Control": "no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    } catch (error) {
      console.error("Detailed error:", error);
      return NextResponse.json(
        {
          error: `Failed to fetch ${market} data`,
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }
  };
}

export async function fetchAllMarkets(
  sport: string,
  sportsbook: string
): Promise<OddsBlazeResponse> {
  const apiKey = process.env.ODDSBLAZE_API_KEY;
  if (!apiKey) {
    throw new Error("ODDSBLAZE_API_KEY is not set in environment variables");
  }

  const url = `https://data.oddsblaze.com/v1/odds/${sportsbook}_${sport}.json?key=${apiKey}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as OddsBlazeResponse;
    return data;
  } catch (error) {
    console.error(
      `Error fetching all markets for ${sportsbook} ${sport}:`,
      error
    );
    throw error;
  }
}
