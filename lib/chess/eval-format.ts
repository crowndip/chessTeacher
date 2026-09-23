/** Formats an engine evaluation (White's perspective) as a short signed label, e.g. "+0.4", "-1.2", "#3", "#-2". */
export function formatEval(evalCp: number | null, mate: number | null): string {
  if (mate !== null) {
    return mate > 0 ? `#${mate}` : `#${mate}`;
  }
  if (evalCp === null) return "—";
  const pawns = evalCp / 100;
  const sign = pawns > 0 ? "+" : pawns < 0 ? "" : "";
  return `${sign}${pawns.toFixed(1)}`;
}
