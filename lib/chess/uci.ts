export type UciMove = { from: string; to: string; promotion?: string };

/** Parses a UCI move string like "e2e4" or "e7e8q" into a chess.js move input. */
export function parseUciMove(uci: string): UciMove {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci.slice(4) : undefined,
  };
}
