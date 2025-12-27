import { LichessResponse, LichessMove, MoveRating } from './types';

const LICHESS_EXPLORER_URL = 'https://explorer.lichess.ovh/lichess';

// Map rating level to Lichess rating ranges
function getRatingParams(level: number): string {
  const ranges: Record<number, string> = {
    800: '0,1000',
    1000: '1000,1200',
    1200: '1200,1400',
    1400: '1400,1600',
    1600: '1600,1800',
  };
  return ranges[level] || '1200,1400';
}

export async function getOpeningMoves(
  fen: string,
  ratingLevel: number = 1200
): Promise<LichessResponse> {
  const encodedFen = encodeURIComponent(fen);
  const ratings = getRatingParams(ratingLevel);

  const url = `${LICHESS_EXPLORER_URL}?variant=standard&speeds=bullet,blitz,rapid,classical&ratings=${ratings}&fen=${encodedFen}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Lichess API error: ${response.status}`);
  }

  return response.json();
}

// Calculate total games for a move
function totalGames(move: LichessMove): number {
  return move.white + move.draws + move.black;
}

// Calculate win rate for the side to move
function getWinRate(move: LichessMove, sideToMove: 'white' | 'black'): number {
  const total = totalGames(move);
  if (total === 0) return 0;

  if (sideToMove === 'white') {
    return (move.white + move.draws * 0.5) / total;
  } else {
    return (move.black + move.draws * 0.5) / total;
  }
}

// Rate a move based on its statistics
export function rateMoveFromStats(
  move: LichessMove,
  allMoves: LichessMove[],
  sideToMove: 'white' | 'black'
): MoveRating {
  const totalAllGames = allMoves.reduce((sum, m) => sum + totalGames(m), 0);
  const moveGames = totalGames(move);
  const frequency = moveGames / totalAllGames;
  const winRate = getWinRate(move, sideToMove);

  // Best move: most popular AND good win rate
  const mostPopular = allMoves[0]; // Lichess returns sorted by popularity
  if (move.san === mostPopular.san && winRate >= 0.45) {
    return 'best';
  }

  // Good move: reasonably popular (>5%) and decent win rate (>45%)
  if (frequency > 0.05 && winRate >= 0.45) {
    return 'good';
  }

  // OK move: played sometimes (>1%) and not losing (>40%)
  if (frequency > 0.01 && winRate >= 0.40) {
    return 'ok';
  }

  // Blunder: rare or losing
  return 'blunder';
}

// Find a move in the response and rate it
export function evaluateMove(
  san: string,
  response: LichessResponse,
  sideToMove: 'white' | 'black'
): { rating: MoveRating; move?: LichessMove } {
  const move = response.moves.find(m => m.san === san);

  if (!move) {
    // Move not in database = likely a blunder (or very rare)
    return { rating: 'blunder' };
  }

  const rating = rateMoveFromStats(move, response.moves, sideToMove);
  return { rating, move };
}

// Get a random opponent move (weighted by popularity)
export function getOpponentMove(response: LichessResponse): LichessMove | null {
  if (response.moves.length === 0) return null;

  // Weight by number of games played
  const totalGamesAll = response.moves.reduce((sum, m) => sum + totalGames(m), 0);
  const random = Math.random() * totalGamesAll;

  let cumulative = 0;
  for (const move of response.moves) {
    cumulative += totalGames(move);
    if (random <= cumulative) {
      return move;
    }
  }

  return response.moves[0]; // Fallback
}

// Check if position is in the opening book
export function isInBook(response: LichessResponse): boolean {
  const totalGamesPlayed = response.white + response.draws + response.black;
  // Threshold of 10 allows sidelines while still having meaningful data
  // Main lines have 1000s of games, sidelines may have only 10-50
  return response.moves.length > 0 && totalGamesPlayed >= 10;
}
