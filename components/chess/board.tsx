"use client";

import { Chessboard, type PieceDropHandlerArgs } from "react-chessboard";

export type ChessBoardProps = {
  fen: string;
  onMoveAttempt?: (sourceSquare: string, targetSquare: string) => boolean;
  boardOrientation?: "white" | "black";
  allowDragging?: boolean;
};

export function ChessBoard({
  fen,
  onMoveAttempt,
  boardOrientation = "white",
  allowDragging = true,
}: ChessBoardProps) {
  return (
    <Chessboard
      options={{
        position: fen,
        boardOrientation,
        allowDragging,
        onPieceDrop: ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
          if (!onMoveAttempt || !targetSquare) return false;
          return onMoveAttempt(sourceSquare, targetSquare);
        },
      }}
    />
  );
}
