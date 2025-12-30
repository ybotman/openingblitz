// Opening data from Lichess API
export interface LichessMove {
  uci: string;
  san: string;
  averageRating: number;
  white: number;
  draws: number;
  black: number;
  opening?: {
    eco: string;
    name: string;
  };
}

export interface LichessResponse {
  white: number;
  draws: number;
  black: number;
  moves: LichessMove[];
  opening?: {
    eco: string;
    name: string;
  };
}

// Game state
export type MoveRating = 'best' | 'good' | 'ok' | 'inaccuracy' | 'blunder' | 'offbook';

export interface MoveResult {
  move: string;
  rating: MoveRating;
  points: number;
  openingName?: string;
  frequency?: number;  // % of players who play this
  winRate?: number;    // % win rate for this move
}

export interface DrillState {
  fen: string;
  openingName: string;
  playerColor: 'white' | 'black';
  movesPlayed: number;
  score: number;
  streak: number;
  timeRemaining: number;
  isActive: boolean;
  lastMoveResult?: MoveResult;
}

export interface DrillConfig {
  ratingLevel: number;  // 800-1600, controls difficulty
  timeLimit: number;    // 10-120 seconds
  playerColor: 'white' | 'black';
}

// Scoring
export const POINTS = {
  best: 10,
  good: 7,
  ok: 3,
  inaccuracy: -3,
  blunder: -10,
  offbook: 0,  // Unknown - not penalized, not rewarded
} as const;
