"use client";

import { Chess } from "chess.js";
import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import { ChessBoard } from "@/components/chess/board";
import { EvalBadge } from "@/components/chess/eval-badge";
import { MaterialCount } from "@/components/chess/material-count";
import { sideToMoveOf } from "@/lib/chess/fen";
import { classifyMove, type MoveQuality } from "@/lib/chess/review";

export type SequenceStepperProps = {
  startFen: string;
  moves: string[];
  explanations: string[];
};

type PositionEval = { evalCp: number | null; mate: number | null };
type Branch = { fen: string; san: string; loading: boolean } & Partial<PositionEval> & {
    quality?: MoveQuality;
  };

async function fetchEval(fen: string): Promise<PositionEval> {
  const response = await fetch("/api/engine/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fens: [fen] }),
  });
  const data = (await response.json()) as {
    positions?: Array<{ evalCp: number | null; mate: number | null }>;
  };
  const position = data.positions?.[0];
  return { evalCp: position?.evalCp ?? null, mate: position?.mate ?? null };
}

export function SequenceStepper({ startFen, moves, explanations }: SequenceStepperProps) {
  const bookFens = useMemo(() => {
    const chess = new Chess(startFen);
    const positions = [chess.fen()];
    for (const san of moves) {
      chess.move(san);
      positions.push(chess.fen());
    }
    return positions;
  }, [startFen, moves]);

  const [bookEvals, setBookEvals] = useState<Array<PositionEval | null>>(() => bookFens.map(() => null));
  const [step, setStep] = useState(0);
  const [branch, setBranch] = useState<Branch | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBookEvals(bookFens.map(() => null));
    (async () => {
      const response = await fetch("/api/engine/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fens: bookFens }),
      });
      const data = (await response.json()) as {
        positions?: Array<{ evalCp: number | null; mate: number | null }>;
      };
      if (cancelled) return;
      setBookEvals((data.positions ?? []).map((p) => ({ evalCp: p.evalCp, mate: p.mate })));
    })();
    return () => {
      cancelled = true;
    };
  }, [bookFens]);

  const bookQuality: MoveQuality | null = useMemo(() => {
    if (step === 0) return null;
    const before = bookEvals[step - 1];
    const after = bookEvals[step];
    if (!before || !after) return null;
    return classifyMove(before, after, sideToMoveOf(bookFens[step - 1]));
  }, [step, bookEvals, bookFens]);

  function goTo(nextStep: number) {
    setStep(Math.max(0, Math.min(moves.length, nextStep)));
    setBranch(null);
  }

  function handleMoveAttempt(sourceSquare: string, targetSquare: string): boolean {
    const baseFen = branch ? branch.fen : bookFens[step];
    const chess = new Chess(baseFen);
    const moverSide = chess.turn();
    const result = chess.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    if (!result) return false;

    const newFen = chess.fen();
    setBranch({ fen: newFen, san: result.san, loading: true });

    const before = branch
      ? { evalCp: branch.evalCp ?? null, mate: branch.mate ?? null }
      : (bookEvals[step] ?? { evalCp: null, mate: null });

    void fetchEval(newFen).then((after) => {
      const quality = classifyMove(before, after, moverSide);
      setBranch({ fen: newFen, san: result.san, loading: false, ...after, quality });
    });

    return true;
  }

  const displayedFen = branch ? branch.fen : bookFens[step];

  return (
    <div className="move-stepper">
      <ChessBoard fen={displayedFen} onMoveAttempt={handleMoveAttempt} allowDragging />
      <MaterialCount fen={displayedFen} />

      <div className="play-controls">
        <Button variant="secondary" onClick={() => goTo(0)} disabled={step === 0 && !branch}>
          Start
        </Button>
        <Button variant="secondary" onClick={() => goTo(step - 1)} disabled={step === 0 && !branch}>
          Back
        </Button>
        <Button variant="secondary" onClick={() => goTo(step + 1)} disabled={step === moves.length && !branch}>
          Next
        </Button>
      </div>

      {branch ? (
        <Card className="sequence-explanation">
          <div className="sequence-eval-row">
            <strong>{branch.san}</strong>
            <EvalBadge
              evalCp={branch.evalCp ?? null}
              mate={branch.mate ?? null}
              quality={branch.quality ?? null}
            />
          </div>
          <p>
            That&apos;s a different move than the recorded line. Compare its evaluation above to the book
            move&apos;s, then use Back or Next to return to the recorded sequence.
          </p>
        </Card>
      ) : (
        <Card className="sequence-explanation">
          <div className="sequence-eval-row">
            <strong>{step === 0 ? "Starting position" : moves[step - 1]}</strong>
            <EvalBadge
              evalCp={bookEvals[step]?.evalCp ?? null}
              mate={bookEvals[step]?.mate ?? null}
              quality={bookQuality}
            />
          </div>
          <p>
            {step === 0
              ? `Starting position. Press Next to play through ${moves[0]}, or drag a piece to try your own move.`
              : explanations[step - 1]}
          </p>
        </Card>
      )}
    </div>
  );
}
