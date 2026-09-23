import { Chess } from "chess.js";
import { annotateMove } from "@/lib/chess/annotate";
import type { PositionAnalysis } from "@/lib/chess/engine-client";
import { sideToMoveOf } from "@/lib/chess/fen";
import type { SkillLevel } from "@/lib/chess/skill-level";
import { parseUciMove } from "@/lib/chess/uci";

/**
 * Lichess's own puzzle theme ("angle") values - verified against
 * https://github.com/ornicar/lila/blob/master/translation/source/puzzleTheme.xml
 * and by calling https://lichess.org/api/puzzle/next?angle=<value> directly.
 * Used as-is (no separate translation table) to avoid a class of "did I
 * spell the tag right" bugs.
 */
export type SequenceMotif =
  | "fork"
  | "pin"
  | "skewer"
  | "backRankMate"
  | "smotheredMate"
  | "discoveredCheck"
  | "deflection"
  | "intermezzo"
  | "capturingDefender"
  | "attraction"
  | "anastasiaMate"
  | "bodenMate";

const DIFFICULTY_BY_SKILL_LEVEL: Record<SkillLevel, "easiest" | "easier" | "harder" | "hardest"> = {
  beginner: "easiest",
  intermediate: "easier",
  advanced: "harder",
  expert: "hardest",
};

/** Generic, motif-level hints - Lichess puzzles don't ship explanation/hint text. */
const MOTIF_HINTS: Record<SequenceMotif, [string, string]> = {
  fork: [
    "Look for a move that attacks two pieces at once.",
    "Which piece can jump to a square that hits both targets?",
  ],
  pin: ["One of the enemy pieces can't move without exposing its king.", "Attack the pinned piece — it can't run."],
  skewer: [
    "A valuable piece and a weaker one are lined up on the same file, rank or diagonal.",
    "Attack the piece in front with check — the one behind is defenseless once it has to move.",
  ],
  backRankMate: [
    "The enemy king is trapped behind its own pawns.",
    "Bring a rook or queen all the way down the open file or rank.",
  ],
  smotheredMate: ["The enemy king has no flight squares at all.", "A knight check can be unstoppable here."],
  discoveredCheck: [
    "Something is blocking your own piece's attack on the enemy king.",
    "Move the blocking piece out of the way.",
  ],
  deflection: ["A defender is doing more than one job at once.", "Force that defender away with a check or capture."],
  intermezzo: [
    "Don't recapture right away — is there a stronger in-between move first?",
    "Look for a forcing move (check or a bigger threat) before the obvious recapture.",
  ],
  capturingDefender: [
    "One piece is the only thing defending another.",
    "Remove the defender first, then take what it was guarding.",
  ],
  attraction: ["A sacrifice can lure a piece onto a bad square.", "What happens if you force a capture here?"],
  anastasiaMate: [
    "The king is stuck on the edge of the board.",
    "A rook and a knight can team up to trap it completely.",
  ],
  bodenMate: [
    "Two bishops on crossing diagonals can be deadly to a boxed-in king.",
    "Look for a way to open a diagonal straight at the king.",
  ],
};

export type ExerciseResult = {
  startFen: string;
  moves: string[];
  explanations: string[];
  hints: [string, string];
};

export type ExerciseFetchResult = ({ ok: true } & ExerciseResult) | { ok: false; reason: string };

type LichessPuzzleResponse = {
  game?: { pgn?: string };
  puzzle?: {
    id?: string;
    rating?: number;
    solution?: string[];
    themes?: string[];
    initialPly?: number;
  };
};

/**
 * Fetches one random Lichess puzzle for `motif`, verifies it, and derives
 * everything SequenceTrainer needs. Never throws - every failure mode
 * (network, bad data, illegal moves, theme mismatch) resolves to
 * `{ ok: false }` so callers can degrade gracefully.
 */
export async function fetchLichessExercise(
  motif: SequenceMotif,
  skillLevel: SkillLevel,
  analyzePositions: (fens: string[]) => Promise<PositionAnalysis[]>,
): Promise<ExerciseFetchResult> {
  const difficulty = DIFFICULTY_BY_SKILL_LEVEL[skillLevel];
  const url = `https://lichess.org/api/puzzle/next?angle=${encodeURIComponent(motif)}&difficulty=${difficulty}`;

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  } catch {
    return { ok: false, reason: "Couldn't reach Lichess." };
  }
  if (!response.ok) {
    return { ok: false, reason: `Lichess returned status ${response.status}.` };
  }

  let data: LichessPuzzleResponse;
  try {
    data = await response.json();
  } catch {
    return { ok: false, reason: "Lichess returned an unexpected response." };
  }

  const pgn = data.game?.pgn;
  const puzzle = data.puzzle;
  if (!pgn || !puzzle?.solution || puzzle.initialPly === undefined || !puzzle.themes) {
    return { ok: false, reason: "Lichess returned an incomplete puzzle." };
  }

  // Lichess silently ignores an unrecognized `angle` instead of erroring -
  // always confirm the puzzle actually has the theme we asked for.
  if (!puzzle.themes.includes(motif)) {
    return { ok: false, reason: "The returned puzzle didn't match the requested theme." };
  }

  // Derive the puzzle's starting position: replay the source game's PGN
  // through initialPly inclusive. The move that "sets up" the puzzle is
  // the last PGN move played here, not part of `solution` at all.
  const chess = new Chess();
  const pgnMoves = pgn.trim().split(/\s+/);
  for (let i = 0; i <= puzzle.initialPly; i++) {
    let move;
    try {
      move = chess.move(pgnMoves[i]);
    } catch {
      move = null;
    }
    if (!move) return { ok: false, reason: "The puzzle's source game didn't replay legally." };
  }
  const startFen = chess.fen();

  // Replay the full solution (solver and opponent moves alternating).
  const sanMoves: string[] = [];
  const fens = [startFen];
  for (const uci of puzzle.solution) {
    let move;
    try {
      move = chess.move(parseUciMove(uci));
    } catch {
      move = null;
    }
    if (!move) return { ok: false, reason: "The puzzle's solution didn't replay legally." };
    sanMoves.push(move.san);
    fens.push(chess.fen());
  }

  const explanations = await generateExplanations(sanMoves, puzzle.solution, fens, analyzePositions);

  return { ok: true, startFen, moves: sanMoves, explanations, hints: MOTIF_HINTS[motif] };
}

async function generateExplanations(
  sanMoves: string[],
  uciMoves: string[],
  fens: string[],
  analyzePositions: (fens: string[]) => Promise<PositionAnalysis[]>,
): Promise<string[]> {
  try {
    const analyses = await analyzePositions(fens);
    return sanMoves.map((san, i) => {
      const before = analyses[i];
      const after = analyses[i + 1];
      if (!before || !after) return "A move from the solution line.";
      const annotation = annotateMove({
        ply: i + 1,
        san,
        uci: uciMoves[i],
        mover: sideToMoveOf(fens[i]),
        fenBefore: fens[i],
        fenAfter: fens[i + 1],
        before,
        after,
      });
      return annotation.reason;
    });
  } catch {
    // The engine being unreachable shouldn't sink an otherwise-good puzzle.
    return sanMoves.map(() => "A move from the solution line.");
  }
}
