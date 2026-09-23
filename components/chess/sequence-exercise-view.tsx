"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { SequenceTrainer } from "@/components/chess/sequence-trainer";
import { useSkillLevel } from "@/components/chess/skill-level-context";
import type { ExerciseResult, SequenceMotif } from "@/lib/chess/lichess-exercise";
import type { Sequence } from "@/lib/chess-data/sequences";

export type SequenceExerciseViewProps = {
  sequence: Sequence;
  nextSequence?: { slug: string; title: string };
};

type FetchStatus = "idle" | "loading" | "error";

export function SequenceExerciseView({ sequence, nextSequence }: SequenceExerciseViewProps) {
  const { skillLevel } = useSkillLevel();
  const [exercise, setExercise] = useState<ExerciseResult | null>(null);
  const [status, setStatus] = useState<FetchStatus>("idle");

  const motif = sequence.motif;

  async function pullExercise(motif: SequenceMotif) {
    setStatus("loading");
    try {
      const response = await fetch("/api/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motif, skillLevel }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatus("error");
        return;
      }
      setExercise(data);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      {motif ? (
        <div className="exercise-controls">
          {exercise ? (
            <>
              <Button variant="secondary" onClick={() => pullExercise(motif)} disabled={status === "loading"}>
                {status === "loading" ? "Finding an exercise…" : "New exercise"}
              </Button>
              <Button variant="ghost" onClick={() => setExercise(null)}>
                Back to the example
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => pullExercise(motif)} disabled={status === "loading"}>
              {status === "loading" ? "Finding an exercise…" : "Exercise"}
            </Button>
          )}
          {status === "error" ? (
            <p className="exercise-error">Couldn&apos;t fetch an exercise right now — try again.</p>
          ) : null}
        </div>
      ) : null}

      {exercise ? (
        <SequenceTrainer
          key={exercise.startFen}
          startFen={exercise.startFen}
          moves={exercise.moves}
          explanations={exercise.explanations}
          hints={exercise.hints}
        />
      ) : (
        <SequenceTrainer
          startFen={sequence.startFen}
          moves={sequence.moves}
          explanations={sequence.explanations}
          hints={sequence.hints}
          nextSequence={nextSequence}
        />
      )}
    </>
  );
}
