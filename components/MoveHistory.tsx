'use client';

import { MoveRating } from '@/lib/types';

interface MoveHistoryProps {
  moves: { move: string; rating: MoveRating }[];
}

const ratingColors: Record<MoveRating, string> = {
  best: 'bg-green-500',
  good: 'bg-blue-500',
  ok: 'bg-yellow-500',
  inaccuracy: 'bg-orange-500',
  blunder: 'bg-red-500',
  offbook: 'bg-purple-500',
};

export function MoveHistory({ moves }: MoveHistoryProps) {
  if (moves.length === 0) return null;

  // Count by rating
  const counts = moves.reduce(
    (acc, m) => {
      acc[m.rating]++;
      return acc;
    },
    { best: 0, good: 0, ok: 0, inaccuracy: 0, blunder: 0, offbook: 0 } as Record<MoveRating, number>
  );

  const total = moves.length;
  // Accuracy: best=100, good=75, ok=50, offbook=50 (unknown), inaccuracy=25, blunder=0
  const accuracy = total > 0
    ? Math.round(((counts.best * 100 + counts.good * 75 + counts.ok * 50 + counts.offbook * 50 + counts.inaccuracy * 25 + counts.blunder * 0) / total))
    : 0;

  return (
    <div className="w-full bg-zinc-800 rounded-lg p-3">
      {/* Header with accuracy */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wide">Your Moves</span>
        <span className="text-sm font-bold text-white">{accuracy}% accuracy</span>
      </div>

      {/* Visual bar - each move is a block */}
      <div className="flex gap-0.5 mb-3">
        {moves.map((m, i) => (
          <div
            key={i}
            className={`h-6 flex-1 ${ratingColors[m.rating]} rounded-sm flex items-center justify-center min-w-[20px] max-w-[40px]`}
            title={`Move ${i + 1}: ${m.move} (${m.rating})`}
          >
            <span className="text-[10px] font-mono text-white/80 truncate px-0.5">
              {m.move}
            </span>
          </div>
        ))}
      </div>

      {/* Legend - compact */}
      <div className="flex flex-wrap gap-2 text-xs border-t border-zinc-700 pt-2">
        {counts.best > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-white font-medium">{counts.best}</span>
          </span>
        )}
        {counts.good > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-white font-medium">{counts.good}</span>
          </span>
        )}
        {counts.ok > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <span className="text-white font-medium">{counts.ok}</span>
          </span>
        )}
        {counts.offbook > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span className="text-white font-medium">{counts.offbook}</span>
          </span>
        )}
        {counts.inaccuracy > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span className="text-white font-medium">{counts.inaccuracy}</span>
          </span>
        )}
        {counts.blunder > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-white font-medium">{counts.blunder}</span>
          </span>
        )}
      </div>
    </div>
  );
}
