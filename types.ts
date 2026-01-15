
export interface ScoreEntry {
  id: string;
  value: number;
  date: string;
}

export interface Player {
  id: string;
  name: string;
  scores: ScoreEntry[];
}

export interface LeagueStats {
  bestTwoTotal: number;
  bestTwoAvg: number;
  gamesPlayed: number;
  sortedScores: number[];
}
