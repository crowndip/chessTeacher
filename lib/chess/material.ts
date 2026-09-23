const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };

export type Material = {
  white: number;
  black: number;
  /** White material minus Black material. Positive favors White. */
  diff: number;
};

/** Computes material point totals for each side from a FEN's piece placement field. */
export function computeMaterial(fen: string): Material {
  const placement = fen.trim().split(/\s+/)[0] ?? "";
  let white = 0;
  let black = 0;

  for (const char of placement) {
    const lower = char.toLowerCase();
    const value = PIECE_VALUES[lower];
    if (!value) continue;
    if (char === lower) black += value;
    else white += value;
  }

  return { white, black, diff: white - black };
}
