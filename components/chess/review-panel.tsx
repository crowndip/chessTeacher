"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { classifyMove, MOVE_QUALITY_LABEL, type MoveQuality } from "@/lib/chess/review";

export type ReviewPanelProps = {
  /** SAN moves in the order they were played. */
  sanMoves: string[];
  /** FEN before each ply, i.e. sanMoves.length + 1 positions (start position included). */
  fens: string[];
};

type AnalyzedPosition = {
  fen: string;
  bestMove: string | null;
  evalCp: number | null;
  mate: number | null;
};

type ReviewedMove = {
  ply: number;
  san: string;
  quality: MoveQuality;
};

export function ReviewPanel({ sanMoves, fens }: ReviewPanelProps) {
  const [status, setStatus] = useState<"loading" | "error" | "done">("loading");
  const [moves, setMoves] = useState<ReviewedMove[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatus("loading");
      try {
        const response = await fetch("/api/engine/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fens }),
        });
        if (!response.ok) throw new Error("Analysis request failed");
        const data = (await response.json()) as { positions: AnalyzedPosition[] };
        if (cancelled) return;

        const reviewed: ReviewedMove[] = sanMoves.map((san, i) => {
          const before = data.positions[i];
          const after = data.positions[i + 1];
          const sideToMove = fens[i].split(/\s+/)[1] === "b" ? "b" : "w";
          const quality = classifyMove(
            { evalCp: before?.evalCp ?? null, mate: before?.mate ?? null },
            { evalCp: after?.evalCp ?? null, mate: after?.mate ?? null },
            sideToMove,
          );
          return { ply: i + 1, san, quality };
        });

        setMoves(reviewed);
        setStatus("done");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    if (sanMoves.length > 0) {
      void run();
    } else {
      setStatus("done");
    }

    return () => {
      cancelled = true;
    };
  }, [sanMoves, fens]);

  if (status === "loading") {
    return (
      <Card className="review-panel">
        <p>Analyzing the game…</p>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="review-panel">
        <p>Couldn&apos;t reach the analysis engine. Please try again.</p>
      </Card>
    );
  }

  return (
    <Card className="review-panel">
      <h3>Game review</h3>
      <ol className="review-move-list">
        {moves.map((move) => (
          <li key={move.ply} className="review-move">
            <span className="review-move-number">{Math.ceil(move.ply / 2)}.</span>
            <span className="review-move-san">{move.san}</span>
            <span className={`quality-badge quality-${move.quality}`}>
              {MOVE_QUALITY_LABEL[move.quality]}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
