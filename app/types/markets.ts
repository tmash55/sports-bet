export interface Market {
  id: string;
  name: string;
  period: string;
  player: boolean;
  grade: boolean;
}

export interface League {
  id: string;
  name: string;
  sport: string;
  updated: string;
  markets: Market[];
}

export interface MarketsResponse {
  leagues: League[];
}
