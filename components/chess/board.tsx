"use client";

import { Chess, type Square } from "chess.js";
import { useMemo, useState, type CSSProperties } from "react";
import { Chessboard, type Arrow, type PieceDropHandlerArgs, type SquareHandlerArgs } from "react-chessboard";
import { sideToMoveOf } from "@/lib/chess/fen";

export type BoardArrow = { from: string; to: string; kind: "best" | "threat" | "idea" };
export type SquareHighlightKind = "hint" | "hanging";

export type ChessBoardProps = {
  fen: string;
  onMoveAttempt?: (sourceSquare: string, targetSquare: string) => boolean;
  boardOrientation?: "white" | "black";
  allowDragging?: boolean;
  lastMove?: { from: string; to: string } | null;
  arrows?: BoardArrow[];
  highlightSquares?: Record<string, SquareHighlightKind>;
};

const ARROW_COLOR: Record<BoardArrow["kind"], string> = {
  best: "rgba(34, 160, 90, 0.85)",
  threat: "rgba(210, 50, 50, 0.85)",
  idea: "rgba(48, 168, 189, 0.85)",
};

const HIGHLIGHT_COLOR: Record<SquareHighlightKind, string> = {
  hint: "rgba(48, 168, 189, 0.35)",
  hanging: "rgba(210, 50, 50, 0.35)",
};

const LAST_MOVE_COLOR = "rgba(255, 213, 79, 0.45)";
const SELECTED_COLOR = "rgba(48, 168, 189, 0.45)";
const LEGAL_TARGET_BG = "radial-gradient(circle, rgba(17,24,39,0.28) 22%, transparent 24%)";

export function ChessBoard({
  fen,
  onMoveAttempt,
  boardOrientation = "white",
  allowDragging = true,
  lastMove = null,
  arrows = [],
  highlightSquares = {},
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const legalTargets = useMemo(() => {
    if (!selectedSquare) return [];
    try {
      const chess = new Chess(fen);
      const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
      return moves.map((move): string => move.to);
    } catch {
      return [];
    }
  }, [fen, selectedSquare]);

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};
    const setBackground = (square: string, color: string) => {
      styles[square] = { ...(styles[square] ?? {}), backgroundColor: color };
    };

    if (lastMove) {
      setBackground(lastMove.from, LAST_MOVE_COLOR);
      setBackground(lastMove.to, LAST_MOVE_COLOR);
    }
    for (const [square, kind] of Object.entries(highlightSquares)) {
      setBackground(square, HIGHLIGHT_COLOR[kind]);
    }
    if (selectedSquare) {
      setBackground(selectedSquare, SELECTED_COLOR);
    }
    for (const target of legalTargets) {
      styles[target] = { ...(styles[target] ?? {}), backgroundImage: LEGAL_TARGET_BG };
    }
    return styles;
  }, [lastMove, highlightSquares, selectedSquare, legalTargets]);

  const boardArrows: Arrow[] = arrows.map((arrow) => ({
    startSquare: arrow.from,
    endSquare: arrow.to,
    color: ARROW_COLOR[arrow.kind],
  }));

  function attemptMove(from: string, to: string): boolean {
    setSelectedSquare(null);
    if (!onMoveAttempt) return false;
    return onMoveAttempt(from, to);
  }

  return (
    <Chessboard
      options={{
        position: fen,
        boardOrientation,
        allowDragging,
        arrows: boardArrows,
        squareStyles,
        onPieceDrop: ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
          if (!targetSquare) return false;
          return attemptMove(sourceSquare, targetSquare);
        },
        onSquareClick: ({ square, piece }: SquareHandlerArgs) => {
          if (!allowDragging) return;

          if (selectedSquare) {
            if (square === selectedSquare) {
              setSelectedSquare(null);
              return;
            }
            if (legalTargets.includes(square)) {
              attemptMove(selectedSquare, square);
              return;
            }
            const clickedOwnPiece = piece && piece.pieceType[0] === sideToMoveOf(fen);
            setSelectedSquare(clickedOwnPiece ? square : null);
            return;
          }

          const clickedOwnPiece = piece && piece.pieceType[0] === sideToMoveOf(fen);
          if (clickedOwnPiece) setSelectedSquare(square);
        },
      }}
    />
  );
}
