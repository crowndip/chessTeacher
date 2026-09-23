import { Chess } from "chess.js";
import type { PositionAnalysis } from "@/lib/chess/engine-client";
import { MOVE_QUALITY_LABEL, type MoveQuality } from "@/lib/chess/review";
import { parseUciMove } from "@/lib/chess/uci";

const PIECE_NAMES: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

const PIECE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };

export type ExplainMoveInput = {
  san: string;
  uci: string;
  mover: "w" | "b";
  fenBefore: string;
  fenAfter: string;
  before: PositionAnalysis;
  after: PositionAnalysis;
  quality: MoveQuality;
  bestMoveSan: string | null;
  explanationDepth: "verbose" | "terse";
};

/** Generates a short, deterministic, template-based explanation for a played move. No LLM. */
export function explainMove(input: ExplainMoveInput): string {
  const detectors = [
    detectCheckmate,
    detectMissedMate,
    detectAllowsMate,
    detectHangingPiece,
    detectAllowsCheckAndMaterial,
    detectGoodCapture,
    detectMissedCapture,
    detectCastling,
    detectGoodFallback,
    detectBadFallback,
  ];

  for (const detector of detectors) {
    try {
      const sentence = detector(input);
      if (sentence) return applyDepth(sentence, input.explanationDepth);
    } catch {
      // Fall through to the next detector on any parsing issue.
    }
  }

  return applyDepth("A move was played.", input.explanationDepth);
}

function applyDepth(sentence: string, depth: "verbose" | "terse"): string {
  if (depth !== "terse") return sentence;
  // Terse mode: drop a leading "This ..." clause when a colon-separated
  // core message follows; otherwise keep the sentence as-is.
  const colonIndex = sentence.indexOf(": ");
  if (colonIndex > 0) return sentence;
  return sentence.replace(/^This /, "");
}

function detectCheckmate(input: ExplainMoveInput): string | null {
  const chess = new Chess(input.fenAfter);
  return chess.isCheckmate() ? "Checkmate!" : null;
}

function detectMissedMate(input: ExplainMoveInput): string | null {
  const { mover, before, after, bestMoveSan } = input;
  if (before.mate === null) return null;
  const hadMateForMover = mover === "w" ? before.mate > 0 : before.mate < 0;
  if (!hadMateForMover) return null;
  const stillHasMate = after.mate !== null && (mover === "w" ? after.mate > 0 : after.mate < 0);
  if (stillHasMate) return null;
  const n = Math.abs(before.mate);
  if (bestMoveSan) return `This misses a forced mate — ${bestMoveSan} mates in ${n}.`;
  return `This misses a forced mate in ${n}.`;
}

function detectAllowsMate(input: ExplainMoveInput): string | null {
  const { mover, after } = input;
  if (after.mate === null) return null;
  const opponentHasMate = mover === "w" ? after.mate < 0 : after.mate > 0;
  if (!opponentHasMate) return null;
  const n = Math.abs(after.mate);
  return `This allows a forced mate in ${n}.`;
}

function detectHangingPiece(input: ExplainMoveInput): string | null {
  const { mover, after } = input;
  const replyUci = after.pv[0];
  if (!replyUci) return null;

  const { to } = parseUciMove(replyUci);
  const chess = new Chess(input.fenAfter);
  const piece = chess.get(to as Parameters<typeof chess.get>[0]);
  if (!piece || piece.color !== mover) return null;
  const value = PIECE_VALUE[piece.type] ?? 0;
  if (value < 3) return null;

  return `This leaves the ${PIECE_NAMES[piece.type]} on ${to} to be captured.`;
}

function detectAllowsCheckAndMaterial(input: ExplainMoveInput): string | null {
  const { after } = input;
  if (after.pv.length < 3) return null;

  const chess = new Chess(input.fenAfter);
  const first = chess.move(parseUciMove(after.pv[0]));
  if (!first) return null;
  if (!chess.inCheck()) return null;

  const second = chess.move(parseUciMove(after.pv[1]));
  if (!second) return null;
  const third = chess.move(parseUciMove(after.pv[2]));
  if (!third) return null;

  if (!third.captured) return null;
  return "This allows a check that wins material.";
}

function detectGoodCapture(input: ExplainMoveInput): string | null {
  if (input.quality !== "best" && input.quality !== "good") return null;
  if (!input.san.includes("x")) return null;
  return "Good capture — it wins material cleanly.";
}

function detectMissedCapture(input: ExplainMoveInput): string | null {
  if (!input.bestMoveSan) return null;
  if (!input.bestMoveSan.includes("x")) return null;
  if (input.san.includes("x")) return null;
  return `This misses ${input.bestMoveSan}, which wins material.`;
}

function detectCastling(input: ExplainMoveInput): string | null {
  if (input.quality !== "best" && input.quality !== "good") return null;
  if (input.san !== "O-O" && input.san !== "O-O-O") return null;
  return "Castling gets the king safe and connects the rooks.";
}

function detectGoodFallback(input: ExplainMoveInput): string | null {
  if (input.quality === "best") return "The strongest move here.";
  if (input.quality === "good") return "A solid move that keeps the position balanced.";
  return null;
}

function detectBadFallback(input: ExplainMoveInput): string | null {
  const label = MOVE_QUALITY_LABEL[input.quality];
  if (input.bestMoveSan) return `${label}: ${input.bestMoveSan} was stronger here.`;
  return `${label}.`;
}
