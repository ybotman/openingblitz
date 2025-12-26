'use client';

interface WelcomeProps {
  onContinue: () => void;
}

export function Welcome({ onContinue }: WelcomeProps) {
  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          OpeningBlitz
        </h1>
        <p className="text-center text-gray-400 mb-8">Speed Chess Opening Trainer</p>

        {/* What it IS */}
        <div className="bg-zinc-800 rounded-xl p-6 mb-4">
          <h2 className="text-lg font-semibold text-green-400 mb-3">What This Is</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>A <strong>speed drill</strong> for chess openings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Practice playing <strong>solid opening moves</strong> fast</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Learn to <strong>avoid blunders</strong> in the first 10-15 moves</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Graded by <strong>real game data</strong> from millions of players</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span><strong>Replay mode</strong> to fix your mistakes</span>
            </li>
          </ul>
        </div>

        {/* What it is NOT */}
        <div className="bg-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-red-400 mb-3">What This Is NOT</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-red-400">✗</span>
              <span>Not a game against another player or engine</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">✗</span>
              <span>Not a full chess game - just the opening phase</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">✗</span>
              <span>Not about memorizing exact lines - it's about good instincts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">✗</span>
              <span>Not looking for the "perfect" GM move - just solid moves</span>
            </li>
          </ul>
        </div>

        {/* How it works */}
        <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-gray-400">
            You have limited time to make as many good opening moves as possible.
            <br />
            <strong className="text-white">Avoid blunders. Build streaks. Beat your score.</strong>
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onContinue}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-xl transition-colors mb-4"
        >
          Let's Go!
        </button>

        <p className="text-center text-xs text-gray-500">
          Free to use. No account required.
          <br />
          Data from Lichess open database.
        </p>
      </div>
    </div>
  );
}
