import { NextResponse } from "next/server";

interface Odd {
  market: string;
  players?: { name: string }[];
  points: number;
  selection: string;
  price: number;
  main: boolean;
}

interface Sportsbook {
  odds: Odd[];
}

interface Game {
  start: string;
  sportsbooks: Sportsbook[];
}

interface OddsBlazeResponse {
  games: Game[];
}

interface PlayerOdd {
  player: string;
  line: number;
  over?: number;
  under?: number;
  main: boolean;
  [key: string]: string | number | boolean | undefined;
}

interface AccumulatedData {
  [player: string]: {
    player: string;
    gameDate: string;
    sportsbooks: {
      [bookName: string]: {
        line: string | number;
        over: string | number;
        under: string | number;
      };
    };
  };
}

async function fetchOddsBlazeData(): Promise<OddsBlazeResponse[]> {
  const apiKey = process.env.ODDSBLAZE_API_KEY;
  if (!apiKey) {
    throw new Error("ODDSBLAZE_API_KEY is not set in environment variables");
  }

  const sportsbooks = ["draftkings", "fanduel", "betmgm"];
  const urls = sportsbooks.map(
    (book) =>
      `https://data.oddsblaze.com/v1/odds/${book}_nba.json?key=${apiKey}&market=Player%20Points&live=false`
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

export async function GET() {
  try {
    const allData = await fetchOddsBlazeData();

    const combinedData = allData.reduce<AccumulatedData>(
      (acc, sportsbook, index) => {
        const bookName = ["DraftKings", "FanDuel", "BetMGM"][index];

        sportsbook.games.forEach((game) => {
          const gameDate = new Date(game.start).toISOString().split("T")[0];
          const playerOdds = new Map<string, PlayerOdd>();

          game.sportsbooks[0].odds.forEach((odd) => {
            if (
              odd.market === "Player Points" &&
              odd.players &&
              odd.players[0]
            ) {
              const player = odd.players[0].name;
              const key = `${player}-${odd.points}`;

              if (
                !playerOdds.has(key) ||
                (odd.main && !playerOdds.get(key)?.main)
              ) {
                playerOdds.set(key, {
                  player,
                  line: odd.points,
                  [odd.selection.toLowerCase()]: odd.price,
                  main: odd.main,
                });
              } else {
                const existingOdd = playerOdds.get(key);
                if (existingOdd && odd.main === existingOdd.main) {
                  existingOdd[odd.selection.toLowerCase()] = odd.price;
                }
              }
            }
          });

          playerOdds.forEach((odds) => {
            if (!acc[odds.player]) {
              acc[odds.player] = {
                player: odds.player,
                gameDate,
                sportsbooks: {},
              };
            }
            if (!acc[odds.player].sportsbooks[bookName] || odds.main) {
              acc[odds.player].sportsbooks[bookName] = {
                line: odds.main ? odds.line : "N/A",
                over: odds.main ? odds.over ?? "N/A" : "N/A",
                under: odds.main ? odds.under ?? "N/A" : "N/A",
              };
            }
          });
        });

        return acc;
      },
      {}
    );

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
        error: "Failed to fetch OddsBlaze data",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
