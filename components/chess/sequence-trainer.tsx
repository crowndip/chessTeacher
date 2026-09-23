"use client";

import { Chess } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { ChessBoard, type BoardArrow } from "@/components/chess/board";
import { CoachCard, type CoachCardAction } from "@/components/chess/coach-card";
import { MaterialCount } from "@/components/chess/material-count";
import { TrainerLayout } from "@/components/chess/trainer-layout";
import { WinBar } from "@/components/chess/win-bar";
import { useSkillLevel } from "@/components/chess/skill-level-context";
import { annotateMove, type MoveAnnotation } from "@/lib/chess/annotate";
import { analyzePosition, analyzePositions, type PositionAnalysis } from "@/lib/chess/engine-client";
import { sideToMoveOf } from "@/lib/chess/fen";
import { SKILL_LEVELS } from "@/lib/chess/skill-level";

export type SequenceTrainerProps = {
  startFen: string;
  moves: string[];
  explanations: string[];
  hints: [string, string];
  nextSequence?: { slug: string; title: string };
};

type Branch = {
  fen: string;
  san: string;
  loading: boolean;
  annotation: MoveAnnotation | null;
};

const EMPTY_ANALYSIS: PositionAnalysis = { fen: "", evalCp: null, mate: null, bestMove: null, pv: [] };

export function SequenceTrainer({ startFen, moves, explanations, hints, nextSequence }: SequenceTrainerProps) {
  const router = useRouter();
  const { skillLevel } = useSkillLevel();
  const hintLevels = SKILL_LEVELS[skillLevel].hintLevels;
  const learnerSide = useMemo(() => sideToMoveOf(startFen), [startFen]);

  const bookFens = useMemo(() => {
    const chess = new Chess(startFen);
    const positions = [chess.fen()];
    for (const san of moves) {
      chess.move(san);
      positions.push(chess.fen());
    }
    return positions;
  }, [startFen, moves]);

  const [bookEvals, setBookEvals] = useState<Array<PositionAnalysis | null>>(() => bookFens.map(() => null));
  const [mode, setMode] = useState<"solve" | "watch">("solve");
  const [step, setStep] = useState(0);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintStage, setHintStage] = useState(0);
  const autoPlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
    };
  }, []);

  const solved = step >= moves.length;

  // Auto-play the opponent's scripted reply in solve mode.
  useEffect(() => {
    if (mode !== "solve" || solved || branch) return;
    const toMove = sideToMoveOf(bookFens[step]);
    if (toMove === learnerSide) return;
    autoPlayTimer.current = setTimeout(() => setStep((s) => Math.min(moves.length, s + 1)), 650);
    return () => {
      if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
    };
  }, [mode, solved, branch, step, bookFens, learnerSide, moves.length]);

  function resetAttemptState() {
    setAttempts(0);
    setHintStage(0);
    setBranch(null);
  }

  function goTo(nextStep: number) {
    setStep(Math.max(0, Math.min(moves.length, nextStep)));
    setBranch(null);
  }

  async function handleWrongMove(fenBefore: string, san: string, uci: string, fenAfter: string) {
    setBranch({ fen: fenAfter, san, loading: true, annotation: null });
    try {
      const before = bookEvals[step] ?? (await analyzePosition(fenBefore));
      const after = await analyzePosition(fenAfter);
      const annotation = annotateMove({
        ply: step + 1,
        san,
        uci,
        mover: learnerSide,
        fenBefore,
        fenAfter,
        before,
        after,
        explanationDepth: SKILL_LEVELS[skillLevel].explanationDepth,
      });
      setBranch({ fen: fenAfter, san, loading: false, annotation });
    } catch {
      setBranch({ fen: fenAfter, san, loading: false, annotation: null });
    }
  }

  function handleSolveMoveAttempt(sourceSquare: string, targetSquare: string): boolean {
    if (solved || sideToMoveOf(bookFens[step]) !== learnerSide) return false;

    const fenBefore = bookFens[step];
    const chess = new Chess(fenBefore);
    const result = chess.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    if (!result) return false;

    const fenAfter = chess.fen();
    const uci = `${sourceSquare}${targetSquare}${result.promotion ?? ""}`;

    if (result.san === moves[step]) {
      resetAttemptState();
      setStep((s) => s + 1);
      return true;
    }

    setAttempts((n) => n + 1);
    void handleWrongMove(fenBefore, result.san, uci, fenAfter);
    return true;
  }

  function handleWatchMoveAttempt(sourceSquare: string, targetSquare: string): boolean {
    const baseFen = branch ? branch.fen : bookFens[step];
    const chess = new Chess(baseFen);
    const mover = chess.turn();
    const result = chess.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    if (!result) return false;

    const fenAfter = chess.fen();
    const uci = `${sourceSquare}${targetSquare}${result.promotion ?? ""}`;
    setBranch({ fen: fenAfter, san: result.san, loading: true, annotation: null });

    void (async () => {
      try {
        const fenBefore = baseFen;
        const before = branch?.annotation?.after ?? bookEvals[step] ?? (await analyzePosition(fenBefore));
        const after = await analyzePosition(fenAfter);
        const annotation = annotateMove({
          ply: step + 1,
          san: result.san,
          uci,
          mover,
          fenBefore,
          fenAfter,
          before,
          after,
          explanationDepth: SKILL_LEVELS[skillLevel].explanationDepth,
        });
        setBranch({ fen: fenAfter, san: result.san, loading: false, annotation });
      } catch {
        setBranch({ fen: fenAfter, san: result.san, loading: false, annotation: null });
      }
    })();

    return true;
  }

  function bookMoveSquares(index: number): { from: string; to: string } | null {
    try {
      const chess = new Chess(bookFens[index]);
      const result = chess.move(moves[index]);
      return result ? { from: result.from, to: result.to } : null;
    } catch {
      return null;
    }
  }

  function handleShowHint() {
    setHintStage((stage) => Math.min(hintLevels, stage + 1));
  }

  function handleShowSolution() {
    setMode("watch");
    setBranch(null);
  }

  function handleTryAgain() {
    setBranch(null);
  }

  function handleReplay() {
    setMode("solve");
    setStep(0);
    resetAttemptState();
  }

  const displayedFen = branch ? branch.fen : bookFens[step];
  const bookEval = bookEvals[step] ?? EMPTY_ANALYSIS;
  const displayedEval = branch?.annotation ? branch.annotation.after : bookEval;

  const arrows: BoardArrow[] = [];
  let highlightSquares: Record<string, "hint" | "hanging"> = {};
  let lastMove: { from: string; to: string } | null = null;

  if (branch?.annotation) {
    const [from, to] = [branch.annotation.uci.slice(0, 2), branch.annotation.uci.slice(2, 4)];
    lastMove = { from, to };
  } else if (mode === "watch" && step > 0) {
    lastMove = bookMoveSquares(step - 1);
  }

  if (mode === "solve" && !branch && hintStage > 0 && !solved) {
    const squares = bookMoveSquares(step);
    if (squares) {
      if (hintStage >= 2) highlightSquares = { [squares.from]: "hint" };
      if (hintStage >= 3) arrows.push({ from: squares.from, to: squares.to, kind: "best" });
    }
  }

  const showRawEval = SKILL_LEVELS[skillLevel].showRawEval === "always";

  let coach: React.ReactNode;
  if (mode === "solve" && solved) {
    coach = (
      <CoachCard
        title="Solved!"
        body={`Solved in ${attempts === 0 ? "1 try" : `${attempts + 1} tries`}${hintStage > 0 ? `, using ${hintStage} hint${hintStage > 1 ? "s" : ""}` : ""}.`}
        actions={[
          { label: "Replay", onClick: handleReplay, variant: "secondary" },
          ...(nextSequence
            ? [
                {
                  label: `Next: ${nextSequence.title}`,
                  onClick: () => router.push(`/sequences/${nextSequence.slug}`),
                  variant: "primary" as const,
                },
              ]
            : []),
        ]}
      />
    );
  } else if (mode === "solve" && branch) {
    const actions: CoachCardAction[] = [{ label: "Try again", onClick: handleTryAgain, variant: "primary" }];
    if (hintStage < hintLevels) actions.push({ label: "Show hint", onClick: handleShowHint, variant: "secondary" });
    actions.push({ label: "Show solution", onClick: handleShowSolution, variant: "ghost" });

    coach = branch.loading ? (
      <CoachCard loading />
    ) : (
      <CoachCard
        title="Not the key move"
        body={branch.annotation?.reason ?? "That doesn't lead anywhere useful here."}
        actions={actions}
        showRawEval={showRawEval}
      />
    );
  } else if (mode === "solve") {
    const actions: CoachCardAction[] = [];
    if (hintStage < hintLevels) actions.push({ label: "Show hint", onClick: handleShowHint, variant: "secondary" });
    actions.push({ label: "Show solution", onClick: handleShowSolution, variant: "ghost" });

    coach = (
      <CoachCard
        title={
          sideToMoveOf(bookFens[step]) === learnerSide
            ? "Your move — find the key move here"
            : "Opponent is replying…"
        }
        body={hintStage > 0 ? hints[Math.min(hintStage, 2) - 1] : undefined}
        actions={sideToMoveOf(bookFens[step]) === learnerSide ? actions : []}
      />
    );
  } else if (branch) {
    coach = branch.loading ? (
      <CoachCard loading />
    ) : (
      <CoachCard
        annotation={branch.annotation ?? undefined}
        title={!branch.annotation ? branch.san : undefined}
        body={!branch.annotation ? "That's a different move than the recorded line." : undefined}
        showRawEval={showRawEval}
        actions={[{ label: "Back to book line", onClick: () => setBranch(null) }]}
      />
    );
  } else {
    coach = (
      <CoachCard
        title={step === 0 ? "Starting position" : moves[step - 1]}
        body={
          step === 0
            ? `Starting position. Press Next to play through ${moves[0]}, or drag a piece to try your own move.`
            : explanations[step - 1]
        }
        showRawEval={showRawEval}
      />
    );
  }

  return (
    <TrainerLayout
      winBar={<WinBar evalCp={displayedEval.evalCp} mate={displayedEval.mate} loading={branch?.loading} />}
      board={
        <ChessBoard
          fen={displayedFen}
          onMoveAttempt={mode === "solve" ? handleSolveMoveAttempt : handleWatchMoveAttempt}
          allowDragging={mode === "watch" || (!solved && sideToMoveOf(bookFens[step]) === learnerSide)}
          lastMove={lastMove}
          arrows={arrows}
          highlightSquares={highlightSquares}
        />
      }
      belowBoard={
        <>
          <MaterialCount fen={displayedFen} />
          <div className="play-controls">
            {mode === "watch" ? (
              <>
                <Button variant="secondary" onClick={() => goTo(0)} disabled={step === 0 && !branch}>
                  Start
                </Button>
                <Button variant="secondary" onClick={() => goTo(step - 1)} disabled={step === 0 && !branch}>
                  Back
                </Button>
                <Button variant="secondary" onClick={() => goTo(step + 1)} disabled={step === moves.length && !branch}>
                  Next
                </Button>
                <Button variant="ghost" onClick={handleReplay}>
                  Solve it yourself
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={handleShowSolution}>
                Show solution
              </Button>
            )}
          </div>
        </>
      }
      coach={coach}
    />
  );
}
