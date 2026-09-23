import { computeMaterial } from "@/lib/chess/material";

export function MaterialCount({ fen }: { fen: string }) {
  const { white, black, diff } = computeMaterial(fen);
  const diffLabel = diff === 0 ? "Even" : diff > 0 ? `White +${diff}` : `Black +${-diff}`;

  return (
    <div className="material-count">
      <span>White: {white}</span>
      <span className="material-diff">{diffLabel}</span>
      <span>Black: {black}</span>
    </div>
  );
}
