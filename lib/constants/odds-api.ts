/**
 * Constants for the Odds API
 */

 export const SPORTS = {
    NBA: "basketball_nba",
    NFL: "americanfootball_nfl",
    MLB: "baseball_mlb",
    NHL: "icehockey_nhl",
    NCAAF: "americanfootball_ncaaf",
    NCAAB: "basketball_ncaab",
    UFC: "mma_mixed_martial_arts",
    EPL: "soccer_epl",
    // Add more sports as needed
  } as const
  
  export type SportKey = (typeof SPORTS)[keyof typeof SPORTS]
  
  // Game markets
  export const GAME_MARKETS = {
    MONEYLINE: "h2h",
    SPREADS: "spreads",
    TOTALS: "totals",
    ALTERNATE_SPREADS: "alternate_spreads",
    ALTERNATE_TOTALS: "alternate_totals",
    BTTS: "btts",
    DRAW_NO_BET: "draw_no_bet",
    H2H_3WAY: "h2h_3_way",
    TEAM_TOTALS: "team_totals",
    ALTERNATE_TEAM_TOTALS: "alternate_team_totals",
    // Add more game markets as needed
  } as const
  
  export type GameMarketKey = (typeof GAME_MARKETS)[keyof typeof GAME_MARKETS]
  
  // Player prop markets by sport
  export const PLAYER_MARKETS = {
    [SPORTS.NBA]: {
      POINTS: "player_points",
      POINTS_ALTERNATE: "player_points_alternate",
      REBOUNDS: "player_rebounds",
      REBOUNDS_ALTERNATE: "player_rebounds_alternate",
      ASSISTS: "player_assists",
      ASSISTS_ALTERNATE: "player_assists_alternate",
      THREES: "player_threes",
      THREES_ALTERNATE: "player_threes_alternate",
      STEALS: "player_steals",
      STEALS_ALTERNATE: "player_steals_alternate",
      BLOCKS: "player_blocks",
      BLOCKS_ALTERNATE: "player_blocks_alternate",
      PRA: "player_points_rebounds_assists",
      PRA_ALTERNATE: "player_points_rebounds_assists_alternate",
      PR: "player_points_rebounds",
      PR_ALTERNATE: "player_points_rebounds_alternate",
      PA: "player_points_assists",
      PA_ALTERNATE: "player_points_assists_alternate",
      RA: "player_rebounds_assists",
      RA_ALTERNATE: "player_rebounds_assists_alternate",
    },
    [SPORTS.NCAAB]: {
      POINTS: "player_points",
      POINTS_ALTERNATE: "player_points_alternate",
      REBOUNDS: "player_rebounds",
      REBOUNDS_ALTERNATE: "player_rebounds_alternate",
      ASSISTS: "player_assists",
      ASSISTS_ALTERNATE: "player_assists_alternate",
      THREES: "player_threes",
      THREES_ALTERNATE: "player_threes_alternate",
      PRA: "player_points_rebounds_assists",
      PRA_ALTERNATE: "player_points_rebounds_assists_alternate",
    },
    [SPORTS.NFL]: {
      PASS_YARDS: "player_pass_yds",
      PASS_TDS: "player_pass_tds",
      RUSH_YARDS: "player_rush_yds",
      RECEIVING_YARDS: "player_recv_yds",
      RECEPTIONS: "player_receptions",
    },
    [SPORTS.MLB]: {
      STRIKEOUTS: "pitcher_strikeouts",
      HITS: "batter_hits",
      HOME_RUNS: "batter_home_runs",
      RUNS: "batter_runs",
      RBIS: "batter_rbis",
      TOTAL_BASES: "batter_total_bases",
    },
    [SPORTS.NHL]: {
      POINTS: "player_points_nhl",
      GOALS: "player_goals",
      ASSISTS: "player_assists_nhl",
      SHOTS: "player_shots",
      SAVES: "player_saves",
    },
  } as const
  
  export type PlayerMarketKey<T extends SportKey> = T extends keyof typeof PLAYER_MARKETS
    ? (typeof PLAYER_MARKETS)[T][keyof (typeof PLAYER_MARKETS)[T]]
    : never
  
  // Regions
  export const REGIONS = {
    US: "us",
    US2: "us2",
    UK: "uk",
    EU: "eu",
    AU: "au",
  } as const
  
  export type RegionKey = (typeof REGIONS)[keyof typeof REGIONS]

  
  // Bookmakers
  export const BOOKMAKERS = {
    FANDUEL: "fanduel",
    DRAFTKINGS: "draftkings",
    BETMGM: "betmgm",
    CAESARS: "caesars",
    POINTSBET: "pointsbet",
    PINNACLE: "pinnacle",
    BET365: "bet365",
    BOVADA: "bovada",
    BETONLINE: "betonline",
    BETONLINEAG: "betonlineag",
    BETUS: "betus",
    LOWVIG: "lowvig",
    FANATICS: "fanatics",
    MYBOOKIEAG: "mybookieag",
    WILLIAMHILL: "caesars",
    BETRIVERS: "betrivers",
    // Add more bookmakers as needed
  } as const
  
  export type BookmakerKey = (typeof BOOKMAKERS)[keyof typeof BOOKMAKERS]
  
  // Sport display information (for UI)
  export const SPORT_INFO = {
    [SPORTS.NBA]: {
      name: "NBA",
      fullName: "National Basketball Association",
      icon: "basketball",
    },
    [SPORTS.NFL]: {
      name: "NFL",
      fullName: "National Football League",
      icon: "football",
    },
    [SPORTS.MLB]: {
      name: "MLB",
      fullName: "Major League Baseball",
      icon: "baseball",
    },
    [SPORTS.NHL]: {
      name: "NHL",
      fullName: "National Hockey League",
      icon: "hockey",
    },
    // Add more sports info
  } as const
  
  // Market display information (for UI)
  export const MARKET_INFO = {
    // Game markets
    [GAME_MARKETS.MONEYLINE]: {
      name: "Moneyline",
      description: "Bet on which team will win the game",
    },
    [GAME_MARKETS.SPREADS]: {
      name: "Spreads",
      description: "Bet on the margin of victory",
    },
    [GAME_MARKETS.TOTALS]: {
      name: "Totals",
      description: "Bet on the total combined score",
    },
    [GAME_MARKETS.ALTERNATE_SPREADS]: {
      name: "Alternate Spreads",
      description: "All available point spread outcomes for each team",
    },
    [GAME_MARKETS.ALTERNATE_TOTALS]: {
      name: "Alternate Totals",
      description: "All available over/under outcomes",
    },
    [GAME_MARKETS.BTTS]: {
      name: "Both Teams to Score",
      description: 'Odds that both teams will score during the game. Outcomes are "Yes" or "No". Available for soccer.',
    },
    [GAME_MARKETS.DRAW_NO_BET]: {
      name: "Draw No Bet",
      description:
        "Odds for the match winner, excluding the draw outcome. A draw will result in a returned bet. Available for soccer.",
    },
    [GAME_MARKETS.H2H_3WAY]: {
      name: "Head to head / Moneyline 3 way",
      description: "Match winner including draw",
    },
    [GAME_MARKETS.TEAM_TOTALS]: {
      name: "Team Totals",
      description: "Featured team totals (Over/Under)",
    },
    [GAME_MARKETS.ALTERNATE_TEAM_TOTALS]: {
      name: "Alternate Team Totals",
      description: "All available team totals (Over/Under)",
    },
  
    // NBA player markets
    [PLAYER_MARKETS[SPORTS.NBA].POINTS]: {
      name: "Points",
      description: "Bet on how many points a player will score",
    },
    [PLAYER_MARKETS[SPORTS.NBA].POINTS_ALTERNATE]: {
      name: "Alternate Points",
      description: "Bet on alternate point lines for a player",
    },
    [PLAYER_MARKETS[SPORTS.NBA].REBOUNDS]: {
      name: "Rebounds",
      description: "Bet on how many rebounds a player will grab",
    },
    [PLAYER_MARKETS[SPORTS.NBA].REBOUNDS_ALTERNATE]: {
      name: "Alternate Rebounds",
      description: "Bet on alternate rebound lines for a player",
    },
    [PLAYER_MARKETS[SPORTS.NBA].ASSISTS]: {
      name: "Assists",
      description: "Bet on how many assists a player will dish out",
    },
    [PLAYER_MARKETS[SPORTS.NBA].ASSISTS_ALTERNATE]: {
      name: "Alternate Assists",
      description: "Bet on alternate assist lines for a player",
    },
    [PLAYER_MARKETS[SPORTS.NBA].THREES]: {
      name: "3-Pointers",
      description: "Bet on how many three-pointers a player will make",
    },
    [PLAYER_MARKETS[SPORTS.NBA].THREES_ALTERNATE]: {
      name: "Alternate 3-Pointers",
      description: "Bet on alternate three-pointer lines for a player",
    },
    [PLAYER_MARKETS[SPORTS.NBA].STEALS]: {
      name: "Steals",
      description: "Bet on how many steals a player will get",
    },
    [PLAYER_MARKETS[SPORTS.NBA].STEALS_ALTERNATE]: {
      name: "Alternate Steals",
      description: "Bet on alternate steal lines for a player",
    },
    [PLAYER_MARKETS[SPORTS.NBA].BLOCKS]: {
      name: "Blocks",
      description: "Bet on how many blocks a player will get",
    },
    [PLAYER_MARKETS[SPORTS.NBA].BLOCKS_ALTERNATE]: {
      name: "Alternate Blocks",
      description: "Bet on alternate block lines for a player",
    },
    [PLAYER_MARKETS[SPORTS.NBA].PRA]: {
      name: "PRA",
      description: "Bet on combined points, rebounds, and assists",
    },
    [PLAYER_MARKETS[SPORTS.NBA].PRA_ALTERNATE]: {
      name: "Alternate PRA",
      description: "Bet on alternate combined points, rebounds, and assists lines",
    },
    [PLAYER_MARKETS[SPORTS.NBA].PR]: {
      name: "PR",
      description: "Bet on combined points and rebounds",
    },
    [PLAYER_MARKETS[SPORTS.NBA].PR_ALTERNATE]: {
      name: "Alternate PR",
      description: "Bet on alternate combined points and rebounds lines",
    },
    [PLAYER_MARKETS[SPORTS.NBA].PA]: {
      name: "PA",
      description: "Bet on combined points and assists",
    },
    [PLAYER_MARKETS[SPORTS.NBA].PA_ALTERNATE]: {
      name: "Alternate PA",
      description: "Bet on alternate combined points and assists lines",
    },
    [PLAYER_MARKETS[SPORTS.NBA].RA]: {
      name: "RA",
      description: "Bet on combined rebounds and assists",
    },
    [PLAYER_MARKETS[SPORTS.NBA].RA_ALTERNATE]: {
      name: "Alternate RA",
      description: "Bet on alternate combined rebounds and assists lines",
    },
  

  
    // NFL player markets
    [PLAYER_MARKETS[SPORTS.NFL].PASS_YARDS]: {
      name: "Passing Yards",
      description: "Bet on how many passing yards a player will throw for",
    },
    [PLAYER_MARKETS[SPORTS.NFL].PASS_TDS]: {
      name: "Passing TDs",
      description: "Bet on how many passing touchdowns a player will throw",
    },
    [PLAYER_MARKETS[SPORTS.NFL].RUSH_YARDS]: {
      name: "Rushing Yards",
      description: "Bet on how many rushing yards a player will gain",
    },
    [PLAYER_MARKETS[SPORTS.NFL].RECEIVING_YARDS]: {
      name: "Receiving Yards",
      description: "Bet on how many receiving yards a player will gain",
    },
    [PLAYER_MARKETS[SPORTS.NFL].RECEPTIONS]: {
      name: "Receptions",
      description: "Bet on how many passes a player will catch",
    },
  
    // MLB player markets
    [PLAYER_MARKETS[SPORTS.MLB].STRIKEOUTS]: {
      name: "Strikeouts",
      description: "Bet on how many batters a pitcher will strike out",
    },
    [PLAYER_MARKETS[SPORTS.MLB].HITS]: {
      name: "Hits",
      description: "Bet on how many hits a player will get",
    },
    [PLAYER_MARKETS[SPORTS.MLB].HOME_RUNS]: {
      name: "Home Runs",
      description: "Bet on how many home runs a player will hit",
    },
    [PLAYER_MARKETS[SPORTS.MLB].RUNS]: {
      name: "Runs",
      description: "Bet on how many runs a player will score",
    },
    [PLAYER_MARKETS[SPORTS.MLB].RBIS]: {
      name: "RBIs",
      description: "Bet on how many runs a player will bat in",
    },
    [PLAYER_MARKETS[SPORTS.MLB].TOTAL_BASES]: {
      name: "Total Bases",
      description: "Bet on how many total bases a player will get",
    },
  
    // NHL player markets
    [PLAYER_MARKETS[SPORTS.NHL].POINTS]: {
      name: "Points",
      description: "Bet on how many points a player will score",
    },
    [PLAYER_MARKETS[SPORTS.NHL].GOALS]: {
      name: "Goals",
      description: "Bet on how many goals a player will score",
    },
    [PLAYER_MARKETS[SPORTS.NHL].ASSISTS]: {
      name: "Assists",
      description: "Bet on how many assists a player will record",
    },
    [PLAYER_MARKETS[SPORTS.NHL].SHOTS]: {
      name: "Shots",
      description: "Bet on how many shots a player will take",
    },
    [PLAYER_MARKETS[SPORTS.NHL].SAVES]: {
      name: "Saves",
      description: "Bet on how many saves a goalie will make",
    },
  
    // Add more market info
  } as const
  
  