import { Chess } from "chess.js";
import type { PositionAnalysis } from "@/lib/chess/engine-client";
import { classifyMove, type MoveQuality } from "@/lib/chess/review";
import { explainMove } from "@/lib/chess/reasons";
import { parseUciMove } from "@/lib/chess/uci";

export type MoveAnnotation = {
  ply: number;
  san: string;
  uci: string;
  mover: "w" | "b";
  fenBefore: string;
  fenAfter: string;
  before: PositionAnalysis;
  after: PositionAnalysis;
  quality: MoveQuality;
  bestMoveSan: string | null;
  reason: string;
  threatUci: string | null;
};

function uciToSan(uci: string, fen: string): string | null {
  try {
    const chess = new Chess(fen);
    const move = chess.move(parseUciMove(uci));
    return move?.san ?? null;
  } catch {
    return null;
  }
}

export function annotateMove(input: {
  ply: number;
  san: string;
  uci: string;
  mover: "w" | "b";
  fenBefore: string;
  fenAfter: string;
  before: PositionAnalysis;
  after: PositionAnalysis;
  /** Verbosity for the reason sentence; defaults to "verbose". */
  explanationDepth?: "verbose" | "terse";
}): MoveAnnotation {
  const { ply, san, uci, mover, fenBefore, fenAfter, before, after } = input;

  let quality = classifyMove(
    { evalCp: before.evalCp, mate: before.mate },
    { evalCp: after.evalCp, mate: after.mate },
    mover,
  );

  const playedTheBest = before.bestMove !== null && before.bestMove === uci;
  if (playedTheBest) quality = "best";

  const bestMoveSan = !playedTheBest && before.bestMove ? uciToSan(before.bestMove, fenBefore) : null;

  const threatUci = quality === "mistake" || quality === "blunder" ? (after.pv[0] ?? null) : null;

  const reason = explainMove({
    san,
    uci,
    mover,
    fenBefore,
    fenAfter,
    before,
    after,
    quality,
    bestMoveSan,
    explanationDepth: input.explanationDepth ?? "verbose",
  });

  return {
    ply,
    san,
    uci,
    mover,
    fenBefore,
    fenAfter,
    before,
    after,
    quality,
    bestMoveSan,
    reason,
    threatUci,
  };
}
