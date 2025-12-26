'use client';

import { useState, useEffect } from 'react';
import { DrillGame } from '@/components/DrillGame';
import { SessionHistory } from '@/components/SessionHistory';
import { Welcome } from '@/components/Welcome';
import { About } from '@/components/About';
import { DrillConfig } from '@/lib/types';
import { SessionRecord, recordVisit, isFirstVisit, shouldShowMilestone, getVisitData } from '@/lib/storage';

type Tab = 'play' | 'history' | 'blunders' | 'about';

export default function Home() {
  const [config, setConfig] = useState<DrillConfig>({
    ratingLevel: 1200,
    timeLimit: 30,
    playerColor: 'white',
  });
  const [activeTab, setActiveTab] = useState<Tab>('play');
  const [showConfig, setShowConfig] = useState(true);
  const [lastResult, setLastResult] = useState<{ score: number; moves: number } | null>(null);
  const [replaySession, setReplaySession] = useState<SessionRecord | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check first visit and record visit on mount
  useEffect(() => {
    if (isFirstVisit()) {
      setShowWelcome(true);
    }
    const visitData = recordVisit();
    if (shouldShowMilestone(visitData.count)) {
      setMilestone(visitData.count);
    }
    setIsLoaded(true);
  }, []);

  const handleGameEnd = (score: number, moves: number) => {
    setLastResult({ score, moves });
  };

  const startNewGame = () => {
    setReplaySession(null);
    setShowConfig(false);
  };

  const handleReplay = (session: SessionRecord) => {
    setConfig({
      ratingLevel: session.ratingLevel,
      timeLimit: session.timeLimit,
      playerColor: session.playerColor,
    });
    setReplaySession(session);
    setActiveTab('play');
    setShowConfig(false);
  };

  const handleBackToConfig = () => {
    setShowConfig(true);
    setReplaySession(null);
  };

  const handleWelcomeContinue = () => {
    setShowWelcome(false);
  };

  const dismissMilestone = () => {
    setMilestone(null);
  };

  // Don't render until we've checked localStorage (avoid hydration mismatch)
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // Show welcome screen for first-time visitors
  if (showWelcome) {
    return <Welcome onContinue={handleWelcomeContinue} />;
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Milestone Banner */}
      {milestone && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-3 px-4">
          <div className="max-w-lg mx-auto flex justify-between items-center">
            <div>
              <span className="font-semibold">Welcome back! </span>
              <span className="text-blue-100">Visit #{milestone}. </span>
              <span className="text-sm text-blue-200">Sign up to keep your stats forever!</span>
            </div>
            <button
              onClick={dismissMilestone}
              className="text-white/70 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-zinc-800 py-4 px-6 shadow-lg">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <h1
            className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent cursor-pointer"
            onClick={handleBackToConfig}
          >
            OpeningBlitz
          </h1>
          {!showConfig && activeTab === 'play' && (
            <button
              onClick={handleBackToConfig}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Settings
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-zinc-800/50 border-b border-zinc-700">
        <div className="max-w-lg mx-auto flex">
          {(['play', 'history', 'blunders', 'about'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'play') {
                  setShowConfig(true);
                  setReplaySession(null);
                }
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab === 'play' && 'Play'}
              {tab === 'history' && 'History'}
              {tab === 'blunders' && 'Blunders'}
              {tab === 'about' && 'About'}
            </button>
          ))}
        </div>
      </div>

      <main className="py-6">
        {/* Play Tab */}
        {activeTab === 'play' && (
          <>
            {showConfig ? (
              <div className="max-w-md mx-auto p-6">
                <h2 className="text-xl font-bold mb-6 text-center">Configure Your Drill</h2>

                {/* Last Result */}
                {lastResult && (
                  <div className="bg-zinc-800 rounded-xl p-4 mb-6 text-center">
                    <div className="text-sm text-gray-400">Last Game</div>
                    <div className="text-2xl font-bold text-green-400">{lastResult.score} pts</div>
                    <div className="text-sm text-gray-400">{lastResult.moves} moves</div>
                  </div>
                )}

                {/* Difficulty (Rating Level) */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400">Difficulty</label>
                    <span className="text-sm font-medium text-white">{config.ratingLevel}</span>
                  </div>
                  <input
                    type="range"
                    min="800"
                    max="1600"
                    step="200"
                    value={config.ratingLevel}
                    onChange={(e) => setConfig((c) => ({ ...c, ratingLevel: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Easier</span>
                    <span>Harder</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {config.ratingLevel <= 800 && "Beginner - most common moves accepted"}
                    {config.ratingLevel === 1000 && "Casual - standard moves expected"}
                    {config.ratingLevel === 1200 && "Club player - solid moves required"}
                    {config.ratingLevel === 1400 && "Intermediate - precise moves needed"}
                    {config.ratingLevel >= 1600 && "Advanced - near-optimal play expected"}
                  </p>
                </div>

                {/* Time Limit */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400">Time Limit</label>
                    <span className="text-sm font-medium text-white">{config.timeLimit}s</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={config.timeLimit}
                    onChange={(e) => setConfig((c) => ({ ...c, timeLimit: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10s</span>
                    <span>120s</span>
                  </div>
                </div>

                {/* Player Color */}
                <div className="mb-8">
                  <label className="block text-sm text-gray-400 mb-2">Play As</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['white', 'black'] as const).map((color) => (
                      <button
                        key={color}
                        onClick={() => setConfig((c) => ({ ...c, playerColor: color }))}
                        className={`py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                          config.playerColor === color
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${color === 'white' ? 'bg-white' : 'bg-zinc-900 border border-gray-500'}`} />
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={startNewGame}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-xl transition-colors"
                >
                  START DRILL
                </button>

                {/* Info */}
                <p className="text-center text-sm text-gray-500 mt-6">
                  Play opening moves as fast as you can!<br />
                  Avoid blunders, earn points, build streaks.
                </p>
              </div>
            ) : (
              <DrillGame
                config={config}
                onGameEnd={handleGameEnd}
                replaySession={replaySession ?? undefined}
              />
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="max-w-lg mx-auto p-4">
            <h2 className="text-xl font-bold mb-4">Session History</h2>
            <p className="text-sm text-gray-400 mb-4">
              Click a session to see details. Replay to fix your blunders!
            </p>
            <SessionHistory onReplay={handleReplay} showBlundersOnly={false} />
          </div>
        )}

        {/* Blunders Tab */}
        {activeTab === 'blunders' && (
          <div className="max-w-lg mx-auto p-4">
            <h2 className="text-xl font-bold mb-4">Blunder Review</h2>
            <p className="text-sm text-gray-400 mb-4">
              Sessions where you made blunders. Replay to practice the right moves!
            </p>
            <SessionHistory onReplay={handleReplay} showBlundersOnly={true} />
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && <About />}
      </main>
    </div>
  );
}
