"use client";

import { Card } from "@/components/ui";
import { MoveStepper } from "@/components/chess/move-stepper";
import { STANDARD_START_FEN } from "@/lib/chess/fen";

export type OpeningViewerProps = {
  moves: string[];
  moveExplanations: string[];
};

export function OpeningViewer({ moves, moveExplanations }: OpeningViewerProps) {
  return (
    <MoveStepper
      startFen={STANDARD_START_FEN}
      moves={moves}
      renderStep={(step) => (
        <Card className="sequence-explanation">
          {step === 0 ? (
            <p>Starting position. Press Next to play through the main line, move by move.</p>
          ) : (
            <>
              <strong>{moves[step - 1]}</strong>
              <p>{moveExplanations[step - 1]}</p>
            </>
          )}
        </Card>
      )}
    />
  );
}
