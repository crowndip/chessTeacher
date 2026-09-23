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
  | "bodenMate"
  | "advancedPawn"
  | "attackingF2F7"
  | "clearance"
  | "collinearMove"
  | "defensiveMove"
  | "discoveredAttack"
  | "doubleCheck"
  | "enPassant"
  | "hangingPiece"
  | "interference"
  | "quietMove"
  | "sacrifice"
  | "trappedPiece"
  | "xRayAttack"
  | "zugzwang"
  | "arabianMate"
  | "balestraMate"
  | "blindSwineMate"
  | "cornerMate"
  | "doubleBishopMate"
  | "dovetailMate"
  | "epauletteMate"
  | "hookMate"
  | "killBoxMate"
  | "morphysMate"
  | "operaMate"
  | "pillsburysMate"
  | "swallowstailMate"
  | "triangleMate"
  | "vukovicMate";

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
  advancedPawn: ["Nothing stands between your pawn and the last rank.", "Push it all the way to a queen."],
  attackingF2F7: ["f7 is defended only by the king this early — is anything attacking it twice?", "Jump a piece into f7."],
  clearance: ["Something is in your own piece's way.", "Move the blocking piece out of the way, ideally with tempo."],
  collinearMove: [
    "Your rook and the enemy rook are already staring at each other on the same line.",
    "Slide your piece further up that same line, without trading.",
  ],
  defensiveMove: ["The king has no escape squares — this check must be blocked, not run from.", "Find the only move that holds the position together."],
  discoveredAttack: ["A piece of yours is blocking your own attack on something valuable.", "Move it away — see what it reveals."],
  doubleCheck: ["Moving one piece can attack the king directly and reveal a check from behind it.", "Look for a move that gives two checks at once."],
  enPassant: ["A black pawn just jumped two squares past yours — there's a special rule for that.", "Capture it as if it had only moved one square."],
  hangingPiece: ["Scan the board for a piece nobody is protecting.", "Just capture it — no tricks needed."],
  interference: ["A piece landing between two enemy pieces can cut a defense.", "Find the square that blocks the defender's line."],
  quietMove: ["Nothing needs to happen on this move — think about what could go wrong later instead.", "Look for a calm move that removes your opponent's only hope."],
  sacrifice: ["Material doesn't matter if you can win it back with interest.", "Give up material to open the position or the king."],
  trappedPiece: ["An enemy piece has very few squares to escape to.", "Cover its remaining escape squares one by one."],
  xRayAttack: ["One of your pieces is defending a square all the way through an enemy piece.", "Look past the piece in front — what's really being defended?"],
  zugzwang: ["Every move available here makes the position worse — that's the whole idea.", "Find the least-bad option; there is no good one."],
  arabianMate: ["The knight already covers both of the king's escape squares.", "Bring the rook all the way down the open file."],
  balestraMate: ["A bishop check needs a defender in place first.", "Capture toward the king with the bishop."],
  blindSwineMate: ["Two rooks doubled on the 7th rank can dominate a king trapped on the back rank.", "Bring the second rook onto the 7th rank to join the first."],
  cornerMate: ["The queen already covers every escape square around the corner.", "Jump the knight in to finish it."],
  doubleBishopMate: ["One bishop already covers half the board — bring the second one into the attack.", "Move the other bishop onto the diagonal."],
  dovetailMate: ["The king's own pieces are blocking both of its escape squares.", "Bring the queen in beside the king, defended."],
  epauletteMate: ["The king's own pieces are blocking its escape, not helping it.", "Deliver check right in front of the king."],
  hookMate: ["Bring your rook onto the open file — a knight and a pawn cover the rest.", "Check along the file."],
  killBoxMate: ["Your queen already covers the squares beside the king.", "Bring the rook in to deliver check."],
  morphysMate: ["Capturing near the king gives check — make sure that piece is protected first.", "Capture toward the king with the bishop."],
  operaMate: ["Capturing gives check, and something is already covering that square.", "Capture with the rook."],
  pillsburysMate: ["Slide your rook onto the open file — your bishop already covers the other escape square.", "Check along the file."],
  swallowstailMate: ["A defended queen right next to a cornered king covers everything around it.", "Bring the queen in beside the king."],
  triangleMate: ["A piece lined up behind where your queen wants to go can defend her there.", "Bring the queen in to deliver check."],
  vukovicMate: ["A bishop is already guarding the square your rook wants to land on.", "Bring the rook in to check."],
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
