import { formatEval } from "@/lib/chess/eval-format";
import type { MoveQuality } from "@/lib/chess/review";

export type EvalBadgeProps = {
  evalCp: number | null;
  mate: number | null;
  quality: MoveQuality | null;
};

/** A colored evaluation number - color reflects move quality, not the sign of the evaluation. */
export function EvalBadge({ evalCp, mate, quality }: EvalBadgeProps) {
  const qualityClass = quality ? `quality-${quality}` : "quality-neutral";
  return <span className={`eval-badge ${qualityClass}`}>{formatEval(evalCp, mate)}</span>;
}
