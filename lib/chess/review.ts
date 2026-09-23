export type MoveQuality = "best" | "good" | "inaccuracy" | "mistake" | "blunder";

export const MOVE_QUALITY_LABEL: Record<MoveQuality, string> = {
  best: "Best",
  good: "Good",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

export type PositionEval = {
  /** Centipawn evaluation from White's perspective, before the move was played. */
  evalCp: number | null;
  /** Mate-in-N from White's perspective, before the move was played (positive = White mates). */
  mate: number | null;
};

/**
 * Classifies a played move by how much it dropped the evaluation for the
 * side that played it, comparing the position before and after the move
 * (both evaluated from White's perspective).
 */
export function classifyMove(
  before: PositionEval,
  after: PositionEval,
  sideToMove: "w" | "b",
): MoveQuality {
  // Missing/throwing away a forced mate is always a blunder, regardless of cp delta.
  if (before.mate !== null) {
    const hadMateForMover = sideToMove === "w" ? before.mate > 0 : before.mate < 0;
    const stillHasMateForMover =
      after.mate !== null && (sideToMove === "w" ? after.mate > 0 : after.mate < 0);
    if (hadMateForMover && !stillHasMateForMover) {
      return "blunder";
    }
  }

  const beforeCp = evalForMover(before, sideToMove);
  const afterCp = evalForMover(after, sideToMove);
  if (beforeCp === null || afterCp === null) {
    return "good";
  }

  const drop = beforeCp - afterCp;
  if (drop <= 10) return "best";
  if (drop <= 50) return "good";
  if (drop <= 100) return "inaccuracy";
  if (drop <= 300) return "mistake";
  return "blunder";
}

function evalForMover(position: PositionEval, sideToMove: "w" | "b"): number | null {
  if (position.mate !== null) {
    const cp = position.mate > 0 ? 100000 - position.mate * 100 : -100000 - position.mate * 100;
    return sideToMove === "w" ? cp : -cp;
  }
  if (position.evalCp === null) return null;
  return sideToMove === "w" ? position.evalCp : -position.evalCp;
}
