/** Converts a White-perspective centipawn evaluation into an estimated White win percentage. */
export function whiteWinPercent(evalCp: number | null, mate: number | null): number {
  if (mate !== null) return mate > 0 ? 100 : 0;
  if (evalCp === null) return 50;
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * evalCp)) - 1);
}

export type WinSplit = { white: number; black: number };

/** Rounds and clamps a White win percentage into a displayable White/Black split. */
export function formatWinSplit(whitePct: number): WinSplit {
  if (whitePct >= 100) return { white: 100, black: 0 };
  if (whitePct <= 0) return { white: 0, black: 100 };
  const white = Math.min(99, Math.max(1, Math.round(whitePct)));
  return { white, black: 100 - white };
}
