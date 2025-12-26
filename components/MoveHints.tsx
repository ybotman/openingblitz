'use client';

import { LichessMove } from '@/lib/types';

interface MoveHintsProps {
  moves: LichessMove[];
  sideToMove: 'white' | 'black';
  show: boolean;
}

function getWinRate(move: LichessMove, side: 'white' | 'black'): number {
  const total = move.white + move.draws + move.black;
  if (total === 0) return 0;
  if (side === 'white') {
    return ((move.white + move.draws * 0.5) / total) * 100;
  }
  return ((move.black + move.draws * 0.5) / total) * 100;
}

function formatGames(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

export function MoveHints({ moves, sideToMove, show }: MoveHintsProps) {
  if (!show || moves.length === 0) return null;

  const topMoves = moves.slice(0, 5);
  const totalGames = moves.reduce((sum, m) => sum + m.white + m.draws + m.black, 0);

  return (
    <div className="w-full bg-zinc-800/50 rounded-lg p-3 backdrop-blur">
      <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
        <span>💡</span>
        <span>TOP MOVES</span>
      </div>
      <div className="space-y-1">
        {topMoves.map((move, index) => {
          const games = move.white + move.draws + move.black;
          const frequency = (games / totalGames) * 100;
          const winRate = getWinRate(move, sideToMove);

          return (
            <div
              key={move.san}
              className="flex items-center gap-2 text-sm"
            >
              {/* Rank badge */}
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0
                    ? 'bg-green-500 text-white'
                    : index === 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-zinc-600 text-gray-300'
                }`}
              >
                {index + 1}
              </span>

              {/* Move */}
              <span className="font-mono font-bold text-white w-12">
                {move.san}
              </span>

              {/* Stats bar */}
              <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    winRate >= 50 ? 'bg-green-500' : winRate >= 45 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(winRate, 100)}%` }}
                />
              </div>

              {/* Win rate */}
              <span className="text-xs text-gray-400 w-12 text-right">
                {winRate.toFixed(0)}%
              </span>

              {/* Games played */}
              <span className="text-xs text-gray-500 w-10 text-right">
                {formatGames(games)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-gray-500 mt-2 text-center">
        Win% • Games played at this level
      </div>
    </div>
  );
}
