'use client';

import { Chessboard } from 'react-chessboard';
import { Square } from 'chess.js';

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
  const handleDrop = ({
    sourceSquare,
    targetSquare,
  }: {
    piece: { isSparePiece: boolean; position: string; pieceType: string };
    sourceSquare: string;
    targetSquare: string | null;
  }) => {
    if (disabled || !targetSquare) return false;
    return onMove(sourceSquare as Square, targetSquare as Square);
  };

  // Highlight last move
  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    squareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    squareStyles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
  }

  return (
    <div className="w-full max-w-[500px] aspect-square">
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          onPieceDrop: handleDrop,
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
