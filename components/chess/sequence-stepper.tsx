"use client";

import { Card } from "@/components/ui";
import { MoveStepper } from "@/components/chess/move-stepper";

export type SequenceStepperProps = {
  startFen: string;
  moves: string[];
  explanations: string[];
};

export function SequenceStepper({ startFen, moves, explanations }: SequenceStepperProps) {
  return (
    <MoveStepper
      startFen={startFen}
      moves={moves}
      renderStep={(step) => (
        <Card className="sequence-explanation">
          {step === 0 ? (
            <p>Starting position. Press Next to play through {moves[0]}.</p>
          ) : (
            <>
              <strong>{moves[step - 1]}</strong>
              <p>{explanations[step - 1]}</p>
            </>
          )}
        </Card>
      )}
    />
  );
}
