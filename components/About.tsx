'use client';

import { getVisitData, getStats } from '@/lib/storage';
import { useEffect, useState } from 'react';

export function About() {
  const [visitCount, setVisitCount] = useState(0);
  const [stats, setStats] = useState<ReturnType<typeof getStats> | null>(null);

  useEffect(() => {
    setVisitCount(getVisitData().count);
    setStats(getStats());
  }, []);

  return (
    <div className="max-w-lg mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">♟️</div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          About OpeningBlitz
        </h2>
      </div>

      {/* Thank You */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-5 mb-4 text-center">
        <p className="text-lg text-blue-100 mb-2">Thanks for being here!</p>
        <p className="text-sm text-gray-300">
          We built OpeningBlitz to help chess players stop blundering in the opening.
          Whether you're warming up before a game or drilling your repertoire, we hope this helps you improve.
        </p>
      </div>

      {/* What it IS */}
      <div className="bg-zinc-800 rounded-xl p-5 mb-4">
        <h3 className="text-md font-semibold text-green-400 mb-3 flex items-center gap-2">
          <span>✓</span> What This Is
        </h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">•</span>
            <span>A <strong>speed drill</strong> for chess openings</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">•</span>
            <span>Practice playing <strong>solid moves</strong> under time pressure</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">•</span>
            <span>Learn to <strong>avoid blunders</strong> in the first 10-15 moves</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">•</span>
            <span>Graded by <strong>real data</strong> from millions of Lichess games</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">•</span>
            <span><strong>Replay mode</strong> to practice fixing your mistakes</span>
          </li>
        </ul>
      </div>

      {/* What it is NOT */}
      <div className="bg-zinc-800 rounded-xl p-5 mb-4">
        <h3 className="text-md font-semibold text-red-400 mb-3 flex items-center gap-2">
          <span>✗</span> What This Is NOT
        </h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">•</span>
            <span>Not a game against another player or engine</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">•</span>
            <span>Not a full chess game - just the opening phase</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">•</span>
            <span>Not about memorizing exact lines - it's about instincts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">•</span>
            <span>Not looking for "perfect" GM moves - just solid moves for your level</span>
          </li>
        </ul>
      </div>

      {/* Your Stats */}
      {visitCount > 0 && (
        <div className="bg-zinc-800 rounded-xl p-5 mb-4">
          <h3 className="text-md font-semibold text-blue-400 mb-3">Your Stats</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-zinc-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{visitCount}</div>
              <div className="text-xs text-gray-400">Visits</div>
            </div>
            <div className="bg-zinc-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{stats?.totalSessions || 0}</div>
              <div className="text-xs text-gray-400">Sessions</div>
            </div>
            <div className="bg-zinc-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{stats?.totalMoves || 0}</div>
              <div className="text-xs text-gray-400">Moves</div>
            </div>
            <div className="bg-zinc-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{stats?.avgAccuracy || 0}%</div>
              <div className="text-xs text-gray-400">Accuracy</div>
            </div>
          </div>
        </div>
      )}

      {/* Sign Up CTA */}
      <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-xl p-5 mb-4">
        <h3 className="text-md font-semibold text-green-400 mb-2">Coming Soon: Accounts</h3>
        <p className="text-sm text-gray-300 mb-3">
          Sign up (free!) to:
        </p>
        <ul className="space-y-1 text-sm text-gray-300 mb-3">
          <li>• Keep your stats forever across devices</li>
          <li>• Track progress over time</li>
          <li>• See which openings you're best/worst at</li>
          <li>• Compete on leaderboards</li>
        </ul>
        <p className="text-xs text-gray-500">
          For now, your data is stored locally in this browser.
        </p>
      </div>

      {/* Contact */}
      <div className="bg-zinc-800 rounded-xl p-5 mb-4">
        <h3 className="text-md font-semibold text-purple-400 mb-3">Contact Us</h3>
        <p className="text-sm text-gray-300 mb-3">
          Have feedback, questions, or ideas? We'd love to hear from you!
        </p>
        <a
          href="mailto:hello@openingblitz.com"
          className="inline-flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <span>✉️</span>
          <span>hello@openingblitz.com</span>
        </a>
      </div>

      {/* Credits */}
      <div className="text-center text-xs text-gray-500 mt-6 space-y-1">
        <p>Opening data powered by <a href="https://lichess.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Lichess</a></p>
        <p>Built for chess players who want to stop blundering in the opening</p>
        <p className="pt-2 text-gray-600">© {new Date().getFullYear()} OpeningBlitz</p>
      </div>
    </div>
  );
}
