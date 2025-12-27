'use client';

import { useState, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Square, Chess } from 'chess.js';

interface ChessBoardProps {
  fen: string;
  orientation: 'white' | 'black';
  onMove: (from: Square, to: Square) => boolean;
  disabled?: boolean;
  lastMove?: { from: Square; to: Square };
}

export function ChessBoard({
  fen,
  orientation,
  onMove,
  disabled = false,
  lastMove,
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);

  // Clear selection when position changes (opponent moved or new game)
  useEffect(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [fen]);

  // Get legal moves for a piece
  const getLegalMovesForSquare = useCallback((square: Square, currentFen: string): Square[] => {
    try {
      const game = new Chess(currentFen);
      const moves = game.moves({ square, verbose: true });
      return moves.map(m => m.to as Square);
    } catch {
      return [];
    }
  }, []);

  // Handle square click (tap-to-move)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSquareClick = useCallback((args: any) => {
    if (disabled) return;

    const sq = args.square as Square;

    // If we have a selected piece and clicked a legal destination
    if (selectedSquare && legalMoves.includes(sq)) {
      onMove(selectedSquare, sq);
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // Check if clicking on own piece
    const game = new Chess(fen);
    const piece = game.get(sq);

    if (piece && piece.color === game.turn()) {
      // Select this piece
      setSelectedSquare(sq);
      setLegalMoves(getLegalMovesForSquare(sq, fen));
    } else {
      // Clear selection
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [disabled, selectedSquare, legalMoves, onMove, fen, getLegalMovesForSquare]);

  const handleDrop = ({
    sourceSquare,
    targetSquare,
  }: {
    piece: { isSparePiece: boolean; position: string; pieceType: string };
    sourceSquare: string;
    targetSquare: string | null;
  }) => {
    if (disabled || !targetSquare) return false;
    setSelectedSquare(null);
    setLegalMoves([]);
    return onMove(sourceSquare as Square, targetSquare as Square);
  };

  // Build square styles
  const squareStyles: Record<string, React.CSSProperties> = {};

  // Last move highlight
  if (lastMove) {
    squareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    squareStyles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
  }

  // Selected square highlight
  if (selectedSquare) {
    squareStyles[selectedSquare] = {
      backgroundColor: 'rgba(20, 180, 255, 0.5)',
      boxShadow: 'inset 0 0 0 3px rgba(20, 180, 255, 0.8)'
    };
  }

  // Legal move dots
  legalMoves.forEach(sq => {
    const game = new Chess(fen);
    const targetPiece = game.get(sq);
    if (targetPiece) {
      // Capture - ring around piece
      squareStyles[sq] = {
        ...squareStyles[sq],
        boxShadow: 'inset 0 0 0 4px rgba(20, 180, 255, 0.6)',
        borderRadius: '50%',
      };
    } else {
      // Empty square - dot in center
      squareStyles[sq] = {
        ...squareStyles[sq],
        background: `${squareStyles[sq]?.backgroundColor || 'transparent'} radial-gradient(circle, rgba(20, 180, 255, 0.7) 20%, transparent 20%)`,
      };
    }
  });

  return (
    <div className="w-full max-w-[400px] aspect-square touch-none">
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          onPieceDrop: handleDrop,
          onSquareClick: handleSquareClick,
          squareStyles: squareStyles,
          boardStyle: {
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          },
          darkSquareStyle: { backgroundColor: '#779952' },
          lightSquareStyle: { backgroundColor: '#edeed1' },
          allowDragging: !disabled,
        }}
      />
    </div>
  );
}
