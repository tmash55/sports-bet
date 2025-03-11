type MarketCategory =
  | {
      [subcategory: string]: string[];
    }
  | string[];

export type NFLMarkets = {
  [category: string]: MarketCategory;
};

export const nflMarkets: NFLMarkets = {
  "Game Props": {
    Moneyline: [
      "Moneyline",
      "1st Half Moneyline",
      "1st Half Moneyline 3-Way",
      "1st Quarter Moneyline",
      "1st Quarter Moneyline 3-Way",
      "2nd Half Moneyline",
      "2nd Quarter Moneyline",
      "3rd Quarter Moneyline",
      "4th Quarter Moneyline",
    ],
    "Point Spread": [
      "Point Spread",
      "1st Half Point Spread",
      "1st Quarter Point Spread",
      "2nd Quarter Point Spread",
      "3rd Quarter Point Spread",
      "4th Quarter Point Spread",
    ],
    "Total Points": [
      "Total Points",
      "1st Half Total Points",
      "1st Quarter Total Points",
      "2nd Quarter Total Points",
      "3rd Quarter Total Points",
      "4th Quarter Total Points",
      "Total Points Odd/Even",
      "1st Half Total Points Odd/Even",
    ],
    "Team Totals": [
      "Team Total Away Team",
      "Team Total Home Team",
      "1st Half Team Total Away Team",
      "1st Half Team Total Home Team",
      "1st Quarter Team Total Away Team",
      "1st Quarter Team Total Home Team",
      "Team Total Touchdowns Away Team",
      "Team Total Touchdowns Home Team",
      "1st Half Team Total Touchdowns Away Team",
      "1st Half Team Total Touchdowns Home Team",
    ],
  },
  "Player Props": {
    Passing: [
      "Passing Touchdowns",
      "Player Passing Touchdowns",
      "Player Passing Touchdowns (At Least)",
      "Passing Yards",
      "Player Passing Yards",
      "Player Passing Yards (At Least)",
      "Passing Attempts",
      "Player Passing Attempts",
      "Player Passing Attempts (At Least)",
      "Passing Completions",
      "Player Passing Completions",
      "Player Passing Completions (At Least)",
      "Passing Interceptions",
      "Player Passing Interceptions",
      "Player Passing Interceptions (At Least)",
      "Longest Passing Completion",
    ],
    Rushing: [
      "Rushing Yards",
      "Player Rushing Yards",
      "Player Rushing Yards (At Least)",
      "Rushing Attempts",
      "Player Rushing Attempts",
      "Player Rushing Attempts (At Least)",
      "Longest Rush",
    ],
    Receiving: [
      "Receiving Yards",
      "Player Receiving Yards",
      "Player Receiving Yards (At Least)",
      "Receptions",
      "Player Receptions",
      "Player Receptions (At Least)",
      "Longest Reception",
      "Player Longest Reception",
      "Player Longest Reception (At Least)",
    ],
    "Combined Stats": [
      "Passing + Rushing Yards",
      "Rushing + Receiving Touchdowns",
      "Rushing + Receiving Yards",
      "Tackles + Assists",
    ],
    "Defensive Stats": [
      "Player Defensive Interceptions",
      "Player Defensive Interceptions (At Least)",
      "Player Sacks",
      "Player Sacks (At Least)",
      "Player Tackles",
      "Player Tackles (At Least)",
    ],
    Kicking: [
      "Player Field Goals",
      "Player Extra Points",
      "Player Kicking Points",
    ],
    Touchdowns: [
      "First Touchdown Scorer",
      "Last Touchdown Scorer",
      "1st Half Player Rushing + Receiving Touchdowns (At Least)",
      "Player Rushing + Receiving Touchdowns (At Least)",
    ],
  },
  "Fantasy Points": ["Player Fantasy Points (Sleeper)"],
  "Situational Props": {
    Scoring: [
      "First Team To Score",
      "Last Team To Score",
      "Will There Be A Safety",
      "Will There Be Overtime",
    ],
    "Quarter/Period Specific": [
      "1st Quarter Both Teams To Score",
      "Highest Scoring Quarter",
      "1st Half Last Team To Score",
      "1st Half Total Touchdowns",
      "1st Quarter Total Touchdowns",
    ],
  },
};
