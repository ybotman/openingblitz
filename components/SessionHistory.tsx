'use client';

import { useState, useEffect } from 'react';
import { SessionRecord, getSessions, deleteSession } from '@/lib/storage';
import { MoveRating } from '@/lib/types';

interface SessionHistoryProps {
  onReplay: (session: SessionRecord) => void;
  showBlundersOnly?: boolean;
}

const ratingColors: Record<MoveRating, string> = {
  best: 'bg-green-500',
  good: 'bg-blue-500',
  ok: 'bg-yellow-500',
  blunder: 'bg-red-500',
};

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function SessionHistory({ onReplay, showBlundersOnly = false }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const allSessions = getSessions();
    if (showBlundersOnly) {
      setSessions(allSessions.filter(s => s.blunderCount > 0));
    } else {
      setSessions(allSessions);
    }
  }, [showBlundersOnly]);

  const handleDelete = (id: string) => {
    deleteSession(id);
    setSessions(sessions.filter(s => s.id !== id));
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-4">{showBlundersOnly ? '🎯' : '📝'}</div>
        <div className="text-lg">
          {showBlundersOnly ? 'No blunders yet!' : 'No sessions yet'}
        </div>
        <div className="text-sm mt-2">
          {showBlundersOnly ? 'Keep playing to find areas to improve' : 'Play a drill to see your history'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const isExpanded = expandedId === session.id;
        const blunders = session.moves.filter(m => m.rating === 'blunder');

        return (
          <div
            key={session.id}
            className="bg-zinc-800 rounded-lg overflow-hidden"
          >
            {/* Session header */}
            <div
              className="p-3 cursor-pointer hover:bg-zinc-700/50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : session.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-white">
                    {session.openingName || 'Opening Practice'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDate(session.timestamp)} • {session.timeLimit}s • Level {session.ratingLevel}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{session.totalScore} pts</div>
                  <div className="text-xs text-gray-400">{session.movesPlayed} moves</div>
                </div>
              </div>

              {/* Mini move bar */}
              <div className="flex gap-0.5 mt-2">
                {session.moves.slice(0, 20).map((m, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 ${ratingColors[m.rating]} rounded-sm`}
                    title={`${m.move} (${m.rating})`}
                  />
                ))}
                {session.moves.length > 20 && (
                  <div className="text-xs text-gray-500 ml-1">+{session.moves.length - 20}</div>
                )}
              </div>

              {/* Blunder indicator */}
              {session.blunderCount > 0 && (
                <div className="mt-2 text-xs text-red-400">
                  💥 {session.blunderCount} blunder{session.blunderCount > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="border-t border-zinc-700 p-3 bg-zinc-900/50">
                {/* Move list - showing both player and opponent moves */}
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-2">Move History:</div>
                  <div className="flex flex-wrap gap-1 items-center">
                    {session.moves.map((m, i) => (
                      <div key={i} className="flex items-center gap-1">
                        {/* Move number */}
                        <span className="text-xs text-gray-500">{i + 1}.</span>
                        {/* Player's move */}
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-mono ${ratingColors[m.rating]} text-white`}
                          title={`Your move${m.openingName ? ` - ${m.openingName}` : ''}`}
                        >
                          {m.move}
                        </span>
                        {/* Opponent's response */}
                        {m.opponentMove && (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-600 text-gray-300"
                            title="Opponent's move"
                          >
                            {m.opponentMove}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    <span className="text-green-400">■</span> Your moves &nbsp;
                    <span className="text-gray-400">■</span> Opponent moves
                  </div>
                </div>

                {/* Blunder positions */}
                {blunders.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-red-400 mb-2">Blunders to fix:</div>
                    <div className="space-y-1">
                      {blunders.map((b, i) => (
                        <div key={i} className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                          Move {session.moves.indexOf(b) + 1}: <span className="font-mono font-bold">{b.move}</span>
                          {b.openingName && <span className="text-gray-400 ml-2">in {b.openingName}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReplay(session);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors"
                  >
                    🔄 Replay & Fix Blunders
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(session.id);
                    }}
                    className="bg-zinc-700 hover:bg-red-600 text-gray-300 hover:text-white py-2 px-3 rounded-lg text-sm transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
