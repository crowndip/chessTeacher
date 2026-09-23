"use client";

import { Chess } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { ChessBoard, type BoardArrow } from "@/components/chess/board";
import { CoachCard, type CoachCardAction } from "@/components/chess/coach-card";
import { MaterialCount } from "@/components/chess/material-count";
import { TrainerLayout } from "@/components/chess/trainer-layout";
import { WinBar } from "@/components/chess/win-bar";
import { analyzePositions, type PositionAnalysis } from "@/lib/chess/engine-client";
import { sideToMoveOf, STANDARD_START_FEN } from "@/lib/chess/fen";

export type OpeningTrainerProps = {
  moves: string[];
  moveExplanations: string[];
  moveIdeas: Array<Array<{ from: string; to: string }> | null>;
  explanation: string;
  plans: { white: string; black: string };
};

const EMPTY_ANALYSIS: PositionAnalysis = { fen: "", evalCp: null, mate: null, bestMove: null, pv: [] };

export function OpeningTrainer({ moves, moveExplanations, moveIdeas, explanation, plans }: OpeningTrainerProps) {
  const bookFens = useMemo(() => {
    const chess = new Chess(STANDARD_START_FEN);
    const positions = [chess.fen()];
    for (const san of moves) {
      chess.move(san);
      positions.push(chess.fen());
    }
    return positions;
  }, [moves]);

  const [bookEvals, setBookEvals] = useState<Array<PositionAnalysis | null>>(() => bookFens.map(() => null));

  useEffect(() => {
    let cancelled = false;
    setBookEvals(bookFens.map(() => null));
    void analyzePositions(bookFens).then((positions) => {
      if (!cancelled) setBookEvals(positions);
    });
    return () => {
      cancelled = true;
    };
  }, [bookFens]);

  function bookMoveSquares(index: number): { from: string; to: string } | null {
    try {
      const chess = new Chess(bookFens[index]);
      const result = chess.move(moves[index]);
      return result ? { from: result.from, to: result.to } : null;
    } catch {
      return null;
    }
  }

  const [mode, setMode] = useState<"learn" | "quiz">("learn");

  // Learn mode state
  const [step, setStep] = useState(0);

  // Quiz mode state
  const [quizSide, setQuizSide] = useState<"w" | "b">("w");
  const [quizStep, setQuizStep] = useState(0);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizFirstTryCorrect, setQuizFirstTryCorrect] = useState(0);
  const [quizWrong, setQuizWrong] = useState(false);
  const autoPlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
    };
  }, []);

  const quizSolved = quizStep >= moves.length;

  useEffect(() => {
    if (mode !== "quiz" || quizSolved) return;
    const toMove = sideToMoveOf(bookFens[quizStep]);
    if (toMove === quizSide) return;
    autoPlayTimer.current = setTimeout(() => setQuizStep((s) => Math.min(moves.length, s + 1)), 500);
    return () => {
      if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
    };
  }, [mode, quizSolved, quizStep, bookFens, quizSide, moves.length]);

  function startQuiz(side: "w" | "b") {
    setQuizSide(side);
    setQuizStep(0);
    setQuizAttempts(0);
    setQuizFirstTryCorrect(0);
    setQuizWrong(false);
    setMode("quiz");
  }

  function handleQuizMoveAttempt(sourceSquare: string, targetSquare: string): boolean {
    if (quizSolved || sideToMoveOf(bookFens[quizStep]) !== quizSide) return false;

    const chess = new Chess(bookFens[quizStep]);
    const result = chess.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    if (!result) return false;

    if (result.san === moves[quizStep]) {
      if (quizAttempts === 0) setQuizFirstTryCorrect((n) => n + 1);
      setQuizAttempts(0);
      setQuizWrong(false);
      setQuizStep((s) => s + 1);
      return true;
    }

    setQuizAttempts((n) => n + 1);
    setQuizWrong(true);
    return false;
  }

  const activeStep = mode === "learn" ? step : quizStep;
  const displayedFen = bookFens[activeStep];
  const displayedEval = bookEvals[activeStep] ?? EMPTY_ANALYSIS;

  const arrows: BoardArrow[] = [];
  let lastMove: { from: string; to: string } | null = null;
  if (mode === "learn" && step > 0) {
    lastMove = bookMoveSquares(step - 1);
    const ideas = moveIdeas[step - 1];
    if (ideas) for (const idea of ideas) arrows.push({ from: idea.from, to: idea.to, kind: "idea" });
  } else if (mode === "quiz" && quizStep > 0) {
    lastMove = bookMoveSquares(quizStep - 1);
  }
  if (mode === "quiz" && quizAttempts >= 2 && !quizSolved) {
    const squares = bookMoveSquares(quizStep);
    if (squares) arrows.push({ from: squares.from, to: squares.to, kind: "best" });
  }

  let coach: React.ReactNode;
  if (mode === "quiz" && quizSolved) {
    coach = (
      <CoachCard
        title="Line complete"
        body={`${quizFirstTryCorrect} of ${moves.filter((_, i) => sideToMoveOf(bookFens[i]) === quizSide).length} moves correct on the first try.`}
        actions={[
          { label: "Retry", onClick: () => startQuiz(quizSide), variant: "secondary" },
          { label: "Back to learn mode", onClick: () => setMode("learn"), variant: "primary" },
        ]}
      />
    );
  } else if (mode === "quiz") {
    const isQuizTurn = sideToMoveOf(bookFens[quizStep]) === quizSide;
    coach = (
      <CoachCard
        title={isQuizTurn ? "Your move" : "Opponent is replying…"}
        body={
          quizWrong
            ? "Not the book move — try again."
            : isQuizTurn
              ? "Play the next move of the main line."
              : undefined
        }
      />
    );
  } else {
    const actions: CoachCardAction[] = [
      { label: "Quiz me", onClick: () => startQuiz("w"), variant: "primary" },
    ];
    coach = (
      <CoachCard
        title={step === 0 ? "Starting position" : moves[step - 1]}
        body={step === 0 ? "Press Next to step through the main line, move by move." : moveExplanations[step - 1]}
        actions={actions}
      />
    );
  }

  return (
    <TrainerLayout
      winBar={<WinBar evalCp={displayedEval.evalCp} mate={displayedEval.mate} />}
      board={
        <ChessBoard
          fen={displayedFen}
          onMoveAttempt={mode === "quiz" ? handleQuizMoveAttempt : undefined}
          allowDragging={mode === "quiz" && !quizSolved && sideToMoveOf(bookFens[quizStep]) === quizSide}
          boardOrientation={mode === "quiz" && quizSide === "b" ? "black" : "white"}
          lastMove={lastMove}
          arrows={arrows}
        />
      }
      belowBoard={
        <>
          <MaterialCount fen={displayedFen} />
          <div className="play-controls">
            {mode === "learn" ? (
              <>
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
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setMode("learn")}>
                  Back to learn mode
                </Button>
                <Button variant="ghost" onClick={() => startQuiz(quizSide === "w" ? "b" : "w")}>
                  Quiz as {quizSide === "w" ? "Black" : "White"} instead
                </Button>
              </>
            )}
          </div>
        </>
      }
      coach={coach}
      sidebar={
        <Card className="about-opening-card">
          <details>
            <summary>About this opening</summary>
            <p>{explanation}</p>
            <p>
              <strong>White:</strong> {plans.white}
            </p>
            <p>
              <strong>Black:</strong> {plans.black}
            </p>
          </details>
        </Card>
      }
    />
  );
}
