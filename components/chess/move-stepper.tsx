"use client";

import { Chess } from "chess.js";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { ChessBoard } from "@/components/chess/board";

export type MoveStepperProps = {
  startFen: string;
  moves: string[];
  /** Rendered below the board for the currently reached step (0 = start position, before any move). */
  renderStep?: (stepIndex: number) => React.ReactNode;
};

export function MoveStepper({ startFen, moves, renderStep }: MoveStepperProps) {
  const fens = useMemo(() => {
    const chess = new Chess(startFen);
    const positions = [chess.fen()];
    for (const san of moves) {
      chess.move(san);
      positions.push(chess.fen());
    }
    return positions;
  }, [startFen, moves]);

  const [step, setStep] = useState(0);

  return (
    <div className="move-stepper">
      <ChessBoard fen={fens[step]} allowDragging={false} />
      <div className="play-controls">
        <Button variant="secondary" onClick={() => setStep(0)} disabled={step === 0}>
          Start
        </Button>
        <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </Button>
        <Button
          variant="secondary"
          onClick={() => setStep((s) => Math.min(moves.length, s + 1))}
          disabled={step === moves.length}
        >
          Next
        </Button>
      </div>
      {renderStep ? renderStep(step) : null}
    </div>
  );
}
