'use client';

interface WelcomeProps {
  onContinue: () => void;
}

export function Welcome({ onContinue }: WelcomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-800 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">♟️</div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
            OpeningBlitz
          </h1>
          <p className="text-xl text-gray-300">Speed Chess Opening Trainer</p>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-5 mb-6 text-center">
          <p className="text-lg text-blue-100 mb-2">Welcome!</p>
          <p className="text-sm text-gray-300">
            Thanks for checking out OpeningBlitz. We built this to help chess players
            like you stop blundering in the opening and build solid instincts fast.
          </p>
        </div>

        {/* What it IS */}
        <div className="bg-zinc-800 rounded-xl p-5 mb-4">
          <h2 className="text-md font-semibold text-green-400 mb-3 flex items-center gap-2">
            <span>✓</span> What This Is
          </h2>
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
              <span>Graded by <strong>real data</strong> from millions of games</span>
            </li>
          </ul>
        </div>

        {/* What it is NOT */}
        <div className="bg-zinc-800 rounded-xl p-5 mb-6">
          <h2 className="text-md font-semibold text-red-400 mb-3 flex items-center gap-2">
            <span>✗</span> What This Is NOT
          </h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">•</span>
              <span>Not a game against a player or engine</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">•</span>
              <span>Not a full chess game - just the opening</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">•</span>
              <span>Not about memorizing exact lines</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">•</span>
              <span>Not looking for "perfect" GM moves</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <button
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-4 rounded-xl text-xl transition-all shadow-lg shadow-green-600/20 mb-6"
        >
          Start Training
        </button>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>Free to use. No account required.</p>
          <p>Opening data powered by Lichess.</p>
          <p className="pt-2">
            Questions? <a href="mailto:hello@openingblitz.com" className="text-blue-400 hover:underline">hello@openingblitz.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
