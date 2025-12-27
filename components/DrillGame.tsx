'use client';

import { useState, useCallback, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { ChessBoard } from './ChessBoard';
import { Timer } from './Timer';
import { MoveHints } from './MoveHints';
import { MoveHistory } from './MoveHistory';
import { getOpeningMoves, evaluateMove, getOpponentMove, isInBook } from '@/lib/lichess';
import { DrillConfig, MoveResult, POINTS, MoveRating, LichessResponse } from '@/lib/types';
import { saveSession, SessionRecord, MoveRecord, recordBlunder } from '@/lib/storage';

interface DrillGameProps {
  config: DrillConfig;
  onGameEnd: (score: number, moves: number, sessionId?: string) => void;
  replaySession?: SessionRecord; // If provided, we're in replay mode
}

export function DrillGame({ config, onGameEnd, replaySession }: DrillGameProps) {
  const [game, setGame] = useState(() => new Chess());
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [movesPlayed, setMovesPlayed] = useState(0);
  const [openingName, setOpeningName] = useState('Starting Position');
  const [lastMoveResult, setLastMoveResult] = useState<MoveResult | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [currentMoves, setCurrentMoves] = useState<LichessResponse['moves']>([]);
  const [moveHistory, setMoveHistory] = useState<{ move: string; rating: MoveRating }[]>([]);
  const [gameKey, setGameKey] = useState(0); // Increment to reset timer

  // For saving session
  const moveRecordsRef = useRef<MoveRecord[]>([]);

  // Replay mode state
  const isReplayMode = !!replaySession;
  const [replayMoveIndex, setReplayMoveIndex] = useState(0);
  const [replayAlert, setReplayAlert] = useState<{ type: 'deviation' | 'blunder' | 'fixed'; message: string } | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [undoState, setUndoState] = useState<{ fen: string; moveIndex: number } | null>(null);
  const [outOfBook, setOutOfBook] = useState(false);

  // Store current position data for move evaluation
  const positionDataRef = useRef<LichessResponse | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;

  // Determine if it's player's turn
  const isPlayerTurn = game.turn() === config.playerColor[0];

  // Prefetch opening data for current position
  const prefetchPositionData = useCallback(async (fen: string) => {
    try {
      const data = await getOpeningMoves(fen, config.ratingLevel);
      positionDataRef.current = data;
      setCurrentMoves(data.moves);
      if (data.opening?.name) {
        setOpeningName(data.opening.name);
      }
    } catch (error) {
      console.error('Error prefetching position data:', error);
      positionDataRef.current = null;
      setCurrentMoves([]);
    }
  }, [config.ratingLevel]);

  // Start the game
  const startGame = useCallback(async () => {
    const newGame = new Chess();
    setGame(newGame);
    setScore(0);
    setStreak(0);
    setMovesPlayed(0);
    setOpeningName(replaySession?.openingName || 'Starting Position');
    setLastMoveResult(null);
    setLastMove(null);
    setGameStarted(true);
    setIsRunning(true);
    setMoveHistory([]);
    setReplayMoveIndex(0);
    setReplayAlert(null);
    setCanUndo(false);
    setUndoState(null);
    setOutOfBook(false);
    setGameKey(k => k + 1); // Reset timer
    moveRecordsRef.current = [];
    positionDataRef.current = null;

    // If player is black, make first move for white
    if (config.playerColor === 'black') {
      setIsThinking(true);
      try {
        let opponentMoveSan: string | null = null;

        // In replay mode, use the original move
        if (isReplayMode && replaySession.moves.length > 0) {
          // First move was by opponent (white), get it from session
          // Actually the first entry in moves is the player's move, so opponent moved before
          // We need to reconstruct - the opponentMove field tells us what to play
          const response = await getOpeningMoves(newGame.fen(), config.ratingLevel);
          const opponentMove = getOpponentMove(response);
          opponentMoveSan = opponentMove?.san || null;
        } else {
          const response = await getOpeningMoves(newGame.fen(), config.ratingLevel);
          const opponentMove = getOpponentMove(response);
          opponentMoveSan = opponentMove?.san || null;
        }

        if (opponentMoveSan) {
          const move = newGame.move(opponentMoveSan);
          if (move) {
            setGame(new Chess(newGame.fen()));
            setLastMove({ from: move.from as Square, to: move.to as Square });
            await prefetchPositionData(newGame.fen());
          }
        }
      } catch (error) {
        console.error('Error making first move:', error);
      }
      setIsThinking(false);
    } else {
      await prefetchPositionData(newGame.fen());
    }
  }, [config.playerColor, config.ratingLevel, prefetchPositionData, isReplayMode, replaySession]);

  // End game due to out of book
  const endGameOutOfBook = useCallback(() => {
    setIsRunning(false);
    setOutOfBook(true);
    setReplayAlert(null); // Clear any "better move" message - we're ending

    // Don't save replay sessions
    if (isReplayMode) return;

    // Save session
    const blunderCount = moveRecordsRef.current.filter(m => m.rating === 'blunder').length;
    saveSession({
      ratingLevel: config.ratingLevel,
      playerColor: config.playerColor,
      timeLimit: config.timeLimit,
      totalScore: score,
      movesPlayed,
      moves: moveRecordsRef.current,
      openingName: openingName + ' (left book)',
      blunderCount,
    });
  }, [config, score, movesPlayed, openingName, isReplayMode]);

  // Make opponent's move
  const makeOpponentMove = useCallback(async (currentFen: string, moveIndex: number) => {
    setIsThinking(true);
    try {
      let opponentMoveSan: string | null = null;

      // In replay mode, use the recorded opponent move
      if (isReplayMode && replaySession && moveIndex < replaySession.moves.length) {
        opponentMoveSan = replaySession.moves[moveIndex].opponentMove || null;
      }

      // If no replay move, or not in replay mode, get from API
      if (!opponentMoveSan) {
        const response = await getOpeningMoves(currentFen, config.ratingLevel);

        // Check if we're still in the opening book
        if (isInBook(response)) {
          const opponentMove = getOpponentMove(response);
          opponentMoveSan = opponentMove?.san || null;
        } else {
          // OUT OF BOOK - end the game
          setIsThinking(false);
          endGameOutOfBook();
          return;
        }
      }

      if (opponentMoveSan) {
        const newGame = new Chess(currentFen);
        try {
          const move = newGame.move(opponentMoveSan);
          if (move) {
            setGame(newGame);
            setLastMove({ from: move.from as Square, to: move.to as Square });

            // Update move record with opponent's response
            if (moveRecordsRef.current.length > 0) {
              moveRecordsRef.current[moveRecordsRef.current.length - 1].opponentMove = opponentMoveSan;
            }

            await prefetchPositionData(newGame.fen());
          }
        } catch (moveError) {
          console.warn('Invalid opponent move:', opponentMoveSan);
          // Move failed - likely out of book
          endGameOutOfBook();
          return;
        }
      } else {
        // No move available - out of book
        endGameOutOfBook();
        return;
      }
    } catch (error) {
      console.error('Error getting opponent move:', error);
      // API error - end gracefully
      endGameOutOfBook();
      return;
    }
    setIsThinking(false);
  }, [config.ratingLevel, prefetchPositionData, isReplayMode, replaySession, endGameOutOfBook]);

  // Handle player's move - SYNC for the board
  const handleMove = useCallback(
    (from: Square, to: Square): boolean => {
      if (!isRunning || !isPlayerTurn || isThinking) return false;

      const currentGame = gameRef.current;
      const currentFen = currentGame.fen();
      const newGame = new Chess(currentFen);

      // Try to make the move
      let move;
      try {
        move = newGame.move({ from, to, promotion: 'q' });
      } catch {
        return false;
      }

      if (!move) return false;

      // Check replay mode alerts
      if (isReplayMode && replaySession && replayMoveIndex < replaySession.moves.length) {
        const originalMove = replaySession.moves[replayMoveIndex];

        // Save state for potential undo
        setUndoState({ fen: currentFen, moveIndex: replayMoveIndex });

        if (move.san !== originalMove.move) {
          // Deviated from original
          if (originalMove.rating === 'blunder') {
            // They played differently than their blunder - GOOD! No undo needed
            setCanUndo(false);
            setReplayAlert({
              type: 'fixed',
              message: `🎉 Great! You found a better move than ${originalMove.move}!`,
            });
          } else {
            // Deviated from a non-blunder move - offer undo
            setCanUndo(true);
            setReplayAlert({
              type: 'deviation',
              message: `Different move! Original was ${originalMove.move}`,
            });
          }
        } else if (originalMove.rating === 'blunder') {
          // Made the same blunder again! Offer undo
          setCanUndo(true);
          setReplayAlert({
            type: 'blunder',
            message: `⚠️ Same blunder again! Try a different move`,
          });
        } else {
          // Same move as original, not a blunder - all good
          setCanUndo(false);
          setReplayAlert(null);
        }
      }

      // Update board immediately
      setGame(newGame);
      setLastMove({ from, to });
      setMovesPlayed((prev) => prev + 1);
      setReplayMoveIndex((prev) => prev + 1);

      // Evaluate move
      const positionData = positionDataRef.current;
      let rating: MoveRating = 'ok';
      let points = POINTS.ok;

      if (positionData) {
        const evaluation = evaluateMove(move.san, positionData, config.playerColor);
        rating = evaluation.rating;
        const basePoints = POINTS[evaluation.rating];
        const currentStreak = evaluation.rating !== 'blunder' ? streak : 0;
        const streakBonus = evaluation.rating !== 'blunder' ? Math.floor(streak / 3) : 0;
        points = basePoints + streakBonus;

        setScore((prev) => prev + points);
        setStreak(evaluation.rating === 'blunder' ? 0 : currentStreak + 1);

        if (evaluation.move?.opening?.name) {
          setOpeningName(evaluation.move.opening.name);
        }

        setLastMoveResult({
          move: move.san,
          rating: evaluation.rating,
          points,
          openingName: evaluation.move?.opening?.name,
        });
        setMoveHistory((prev) => [...prev, { move: move.san, rating: evaluation.rating }]);
      } else {
        setLastMoveResult({ move: move.san, rating: 'ok', points: POINTS.ok });
        setScore((prev) => prev + POINTS.ok);
        setMoveHistory((prev) => [...prev, { move: move.san, rating: 'ok' }]);
      }

      // Record move for saving
      moveRecordsRef.current.push({
        move: move.san,
        rating,
        fen: currentFen,
        openingName: openingName,
      });

      // Track blunders for spaced repetition (only in regular mode, not replay)
      if (rating === 'blunder' && !isReplayMode) {
        recordBlunder(currentFen, move.san, openingName, config.playerColor, config.ratingLevel);
      }

      // Make opponent's response after a short delay
      if (!newGame.isGameOver()) {
        setTimeout(() => makeOpponentMove(newGame.fen(), replayMoveIndex), 300);
      }

      // Clear alert after a delay
      if (replayAlert) {
        setTimeout(() => setReplayAlert(null), 3000);
      }

      return true;
    },
    [isRunning, isPlayerTurn, isThinking, config.playerColor, config.ratingLevel, streak, makeOpponentMove, isReplayMode, replaySession, replayMoveIndex, openingName, replayAlert]
  );

  // Handle time up
  const handleTimeUp = useCallback(() => {
    setIsRunning(false);

    // Don't save replay sessions - they would duplicate/corrupt stats
    if (isReplayMode) {
      onGameEnd(score, movesPlayed);
      return;
    }

    // Calculate blunder count
    const blunderCount = moveRecordsRef.current.filter(m => m.rating === 'blunder').length;

    // Save session
    const savedSession = saveSession({
      ratingLevel: config.ratingLevel,
      playerColor: config.playerColor,
      timeLimit: config.timeLimit,
      totalScore: score,
      movesPlayed,
      moves: moveRecordsRef.current,
      openingName,
      blunderCount,
    });

    onGameEnd(score, movesPlayed, savedSession.id);
  }, [score, movesPlayed, onGameEnd, config, openingName, isReplayMode]);

  // Handle undo in replay mode
  const handleUndo = useCallback(async () => {
    if (!undoState || !isReplayMode) return;

    // Restore the previous position
    const restoredGame = new Chess(undoState.fen);
    setGame(restoredGame);
    setReplayMoveIndex(undoState.moveIndex);
    setCanUndo(false);
    setReplayAlert(null);
    setLastMove(null);

    // Remove the last move from history
    setMoveHistory((prev) => prev.slice(0, -1));
    setMovesPlayed((prev) => Math.max(0, prev - 1));

    // Remove from move records
    moveRecordsRef.current = moveRecordsRef.current.slice(0, -1);

    // Refetch position data
    await prefetchPositionData(undoState.fen);
  }, [undoState, isReplayMode, prefetchPositionData]);

  // Get rating badge color
  const getRatingColor = (rating: MoveRating) => {
    switch (rating) {
      case 'best': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'ok': return 'bg-yellow-500';
      case 'blunder': return 'bg-red-500';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-lg mx-auto px-2">
      {/* Replay Mode Banner - compact */}
      {isReplayMode && (
        <div className="w-full bg-blue-600/20 border border-blue-500 rounded-lg px-3 py-1 text-center">
          <span className="text-blue-400 font-semibold text-sm">🔄 REPLAY MODE</span>
          <span className="text-xs text-blue-300 ml-2">Fix your blunders</span>
        </div>
      )}

      {/* Replay Alert with Undo Button - compact */}
      {replayAlert && (
        <div
          className={`w-full px-3 py-2 rounded-lg text-center ${
            replayAlert.type === 'blunder'
              ? 'bg-red-500/20 border border-red-500'
              : replayAlert.type === 'fixed'
              ? 'bg-green-500/20 border border-green-500'
              : 'bg-yellow-500/20 border border-yellow-500'
          }`}
        >
          <div className={`font-bold text-sm ${
            replayAlert.type === 'blunder' ? 'text-red-400' :
            replayAlert.type === 'fixed' ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {replayAlert.message}
          </div>
          {canUndo && (
            <button
              onClick={handleUndo}
              className="mt-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium px-3 py-1 rounded-lg transition-colors"
            >
              ↩️ Undo
            </button>
          )}
        </div>
      )}

      {/* Header: Score | Timer | Streak - inline compact */}
      <div className="flex justify-between items-center w-full bg-zinc-800 rounded-lg px-4 py-2">
        <div className="text-center">
          <div className="text-xs text-gray-400">SCORE</div>
          <div className="text-2xl font-bold text-white">{score}</div>
        </div>

        <Timer
          seconds={config.timeLimit}
          isRunning={isRunning && isPlayerTurn && !isThinking}
          onTimeUp={handleTimeUp}
          resetKey={gameKey}
        />

        <div className="text-center">
          <div className="text-xs text-gray-400">STREAK</div>
          <div className="text-2xl font-bold text-orange-400">
            {streak > 0 ? `🔥${streak}` : '0'}
          </div>
        </div>
      </div>

      {/* Opening Name - smaller */}
      <div className="bg-zinc-800/50 px-3 py-1 rounded-lg text-center w-full">
        <div className="text-sm font-medium text-white truncate">{openingName}</div>
      </div>

      {/* Move Quality Progress Bar - inline with opening */}
      {moveHistory.length > 0 && (
        <MoveHistory moves={moveHistory} />
      )}

      {/* Chessboard */}
      <ChessBoard
        fen={game.fen()}
        orientation={config.playerColor}
        onMove={handleMove}
        disabled={!isRunning || !isPlayerTurn || isThinking}
        lastMove={lastMove ?? undefined}
      />

      {/* Arcade Move Feedback - compact inline */}
      {lastMoveResult && (
        <div className="flex items-center justify-center gap-3 bg-zinc-800/50 rounded-lg px-4 py-2 w-full">
          <div className={`text-3xl ${
            lastMoveResult.rating === 'best' ? 'animate-bounce' :
            lastMoveResult.rating === 'blunder' ? 'animate-pulse' : ''
          }`}>
            {lastMoveResult.rating === 'best' && '🎯'}
            {lastMoveResult.rating === 'good' && '👍'}
            {lastMoveResult.rating === 'ok' && '😐'}
            {lastMoveResult.rating === 'blunder' && '💥'}
          </div>
          <div>
            <div className={`text-lg font-black uppercase ${
              lastMoveResult.rating === 'best' ? 'text-green-400' :
              lastMoveResult.rating === 'good' ? 'text-blue-400' :
              lastMoveResult.rating === 'ok' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {lastMoveResult.rating === 'best' && 'PERFECT!'}
              {lastMoveResult.rating === 'good' && 'GREAT!'}
              {lastMoveResult.rating === 'ok' && 'OK'}
              {lastMoveResult.rating === 'blunder' && 'BLUNDER!'}
            </div>
            <div className="text-xs text-gray-400">
              <span className="font-mono">{lastMoveResult.move}</span>
              {streak >= 3 && lastMoveResult.rating !== 'blunder' && (
                <span className="text-orange-400 ml-2">🔥{streak}</span>
              )}
            </div>
          </div>
          <div className={`text-xl font-bold ${
            lastMoveResult.points > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {lastMoveResult.points > 0 ? '+' : ''}{lastMoveResult.points}
          </div>
        </div>
      )}

      {/* Thinking indicator */}
      {isThinking && (
        <div className="text-gray-400 text-sm animate-pulse">Thinking...</div>
      )}

      {/* Hints Toggle - smaller */}
      {isRunning && isPlayerTurn && (
        <div className="w-full">
          <button
            onClick={() => setShowHints(!showHints)}
            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showHints
                ? 'bg-yellow-600 text-white'
                : 'bg-zinc-700 text-gray-300'
            }`}
          >
            {showHints ? '🙈 Hide' : '💡 Hints'}
          </button>
          {showHints && (
            <div className="mt-1">
              <MoveHints
                moves={currentMoves}
                sideToMove={config.playerColor}
                show={showHints}
              />
            </div>
          )}
        </div>
      )}

      {/* Start Button */}
      {!gameStarted && (
        <button
          onClick={startGame}
          className={`w-full font-bold py-4 rounded-xl text-xl transition-colors ${
            isReplayMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isReplayMode ? '🔄 START REPLAY' : 'START DRILL'}
        </button>
      )}

      {/* Game Over / Play Again */}
      {gameStarted && !isRunning && (
        <div className="text-center w-full">
          {outOfBook ? (
            <div className="text-lg font-bold text-yellow-400 mb-2">Out of Book!</div>
          ) : (
            <div className="text-lg font-bold text-white mb-2">Time&apos;s Up!</div>
          )}
          <div className="text-sm text-gray-400 mb-3">
            {movesPlayed} moves • {score} points
          </div>
          <button
            onClick={startGame}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* Level indicator - tiny */}
      <div className="text-xs text-gray-500">
        {config.ratingLevel} • {config.timeLimit}s • {config.playerColor}
      </div>
    </div>
  );
}
