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

  // Is game actively being played?
  const isPlaying = activeTab === 'play' && !showConfig;

  return (
    <div className="h-[100dvh] bg-zinc-900 text-white flex flex-col overflow-hidden">
      {/* Milestone Banner - hide during game */}
      {milestone && !isPlaying && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-2 px-4 flex-shrink-0">
          <div className="max-w-lg mx-auto flex justify-between items-center text-sm">
            <div>
              <span className="font-semibold">Welcome back! </span>
              <span className="text-blue-100">Visit #{milestone}</span>
            </div>
            <button
              onClick={dismissMilestone}
              className="text-white/70 hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header - compact during game */}
      <header className={`bg-zinc-800 shadow-lg flex-shrink-0 ${isPlaying ? 'py-2 px-4' : 'py-3 px-4'}`}>
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <h1
            className={`font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent cursor-pointer ${isPlaying ? 'text-lg' : 'text-xl'}`}
            onClick={handleBackToConfig}
          >
            OpeningBlitz
          </h1>
          {isPlaying && (
            <button
              onClick={handleBackToConfig}
              className="text-xs bg-zinc-700 hover:bg-zinc-600 text-gray-300 px-3 py-1 rounded-full transition-colors"
            >
              ✕ Exit
            </button>
          )}
        </div>
      </header>

      {/* Tabs - hide during game */}
      {!isPlaying && (
        <div className="bg-zinc-800/50 border-b border-zinc-700 flex-shrink-0">
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
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
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
      )}

      <main className={`flex-1 overflow-y-auto ${isPlaying ? 'py-2' : 'py-4'}`}>
        {/* Play Tab */}
        {activeTab === 'play' && (
          <>
            {showConfig ? (
              <div className="max-w-md mx-auto px-4 py-2">
                {/* Start Button - FIRST on mobile */}
                <button
                  onClick={startNewGame}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-xl transition-colors shadow-lg shadow-green-600/30 mb-4"
                >
                  START DRILL
                </button>

                {/* Last Result - Compact inline */}
                {lastResult && (
                  <div className="bg-zinc-800 rounded-lg px-4 py-2 mb-4 flex justify-center items-center gap-4">
                    <span className="text-sm text-gray-400">Last:</span>
                    <span className="text-lg font-bold text-green-400">{lastResult.score} pts</span>
                    <span className="text-sm text-gray-400">({lastResult.moves} moves)</span>
                  </div>
                )}

                {/* Settings Grid - More compact */}
                <div className="bg-zinc-800 rounded-xl p-4 space-y-4">
                  {/* Difficulty */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-400">Difficulty</label>
                      <span className="text-sm font-bold text-white">{config.ratingLevel}</span>
                    </div>
                    <input
                      type="range"
                      min="800"
                      max="1600"
                      step="200"
                      value={config.ratingLevel}
                      onChange={(e) => setConfig((c) => ({ ...c, ratingLevel: parseInt(e.target.value) }))}
                      className="w-full h-3 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Easy</span>
                      <span>Hard</span>
                    </div>
                  </div>

                  {/* Time Limit */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-400">Time</label>
                      <span className="text-sm font-bold text-white">{config.timeLimit}s</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      step="5"
                      value={config.timeLimit}
                      onChange={(e) => setConfig((c) => ({ ...c, timeLimit: parseInt(e.target.value) }))}
                      className="w-full h-3 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>10s</span>
                      <span>120s</span>
                    </div>
                  </div>

                  {/* Player Color - Inline */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-400">Color:</label>
                    <div className="flex gap-2 flex-1">
                      {(['white', 'black'] as const).map((color) => (
                        <button
                          key={color}
                          onClick={() => setConfig((c) => ({ ...c, playerColor: color }))}
                          className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                            config.playerColor === color
                              ? 'bg-blue-600 text-white'
                              : 'bg-zinc-700 text-gray-300'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full ${color === 'white' ? 'bg-white' : 'bg-zinc-900 border border-gray-500'}`} />
                          {color.charAt(0).toUpperCase() + color.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Info - Smaller */}
                <p className="text-center text-xs text-gray-500 mt-3">
                  Tap piece → tap destination. Avoid blunders!
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
