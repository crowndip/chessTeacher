"use client";

import { Chess } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { ChessBoard, type BoardArrow } from "@/components/chess/board";
import { CoachCard } from "@/components/chess/coach-card";
import { EloSlider } from "@/components/chess/elo-slider";
import { Legend } from "@/components/chess/legend";
import { MaterialCount } from "@/components/chess/material-count";
import { MoveList, type MoveListEntry } from "@/components/chess/move-list";
import { TrainerLayout } from "@/components/chess/trainer-layout";
import { WinBar } from "@/components/chess/win-bar";
import { annotateMove, type MoveAnnotation } from "@/lib/chess/annotate";
import { analyzePosition, requestEngineMove, type PositionAnalysis } from "@/lib/chess/engine-client";
import { parseUciMove } from "@/lib/chess/uci";
import { useSkillLevel } from "@/components/chess/skill-level-context";
import { SKILL_LEVELS } from "@/lib/chess/skill-level";
import { whiteWinPercent } from "@/lib/chess/win-probability";

type Status = "playing" | "analyzing" | "reviewing-mistake" | "engine-thinking" | "ended";

type PlyRecord =
  | { status: "pending"; ply: number; san: string; uci: string; fenBefore: string; fenAfter: string; mover: "w" | "b" }
  | { status: "done"; annotation: MoveAnnotation };

type PlayerColor = "w" | "b";

const EMPTY_ANALYSIS: PositionAnalysis = { fen: "", evalCp: 20, mate: null, bestMove: null, pv: [] };

export function PlayView() {
  const { skillLevel } = useSkillLevel();
  const gameRef = useRef(new Chess());
  const analysisCacheRef = useRef(new Map<string, PositionAnalysis>());

  const [fen, setFen] = useState(gameRef.current.fen());
  const [plies, setPlies] = useState<PlyRecord[]>([]);
  const [status, setStatus] = useState<Status>("playing");
  const [resultText, setResultText] = useState<string | null>(null);
  const [elo, setElo] = useState(SKILL_LEVELS[skillLevel].defaultElo);
  const [playerColor, setPlayerColor] = useState<PlayerColor>("w");
  const [lastPlayerAnnotation, setLastPlayerAnnotation] = useState<MoveAnnotation | null>(null);
  const [currentEval, setCurrentEval] = useState<PositionAnalysis>(EMPTY_ANALYSIS);
  const [selectedPly, setSelectedPly] = useState<number | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);

  const gameStarted = plies.length > 0;

  async function getAnalysis(targetFen: string): Promise<PositionAnalysis> {
    const cached = analysisCacheRef.current.get(targetFen);
    if (cached) return cached;
    const result = await analyzePosition(targetFen);
    analysisCacheRef.current.set(targetFen, result);
    return result;
  }

  useEffect(() => {
    void getAnalysis(gameRef.current.fen()).then((result) => setCurrentEval(result));
  }, []);

  function pushPendingPly(san: string, uci: string, mover: "w" | "b", fenBefore: string, fenAfter: string) {
    const ply = plies.length + 1;
    setPlies((current) => [...current, { status: "pending", ply, san, uci, fenBefore, fenAfter, mover }]);
    return ply;
  }

  function updatePlyDone(ply: number, annotation: MoveAnnotation) {
    setPlies((current) =>
      current.map((record) =>
        "annotation" in record ? record : record.ply === ply ? { status: "done", annotation } : record,
      ),
    );
  }

  function checkGameOver(): boolean {
    const game = gameRef.current;
    if (!game.isGameOver()) return false;
    setStatus("ended");
    if (game.isCheckmate()) {
      setResultText(`Checkmate — ${game.turn() === "w" ? "Black" : "White"} wins.`);
    } else if (game.isStalemate()) {
      setResultText("Draw by stalemate.");
    } else if (game.isThreefoldRepetition()) {
      setResultText("Draw by threefold repetition.");
    } else if (game.isInsufficientMaterial()) {
      setResultText("Draw by insufficient material.");
    } else {
      setResultText("Draw by the fifty-move rule.");
    }
    return true;
  }

  async function analyzePlayerMove(ply: number, mover: "w" | "b", fenBefore: string, fenAfter: string, san: string, uci: string) {
    setStatus("analyzing");
    setEngineError(null);
    try {
      const [before, after] = await Promise.all([getAnalysis(fenBefore), getAnalysis(fenAfter)]);
      setCurrentEval(after);
      const annotation = annotateMove({
        ply,
        san,
        uci,
        mover,
        fenBefore,
        fenAfter,
        before,
        after,
        explanationDepth: SKILL_LEVELS[skillLevel].explanationDepth,
      });
      updatePlyDone(ply, annotation);
      setLastPlayerAnnotation(annotation);

      if (annotation.quality === "mistake" || annotation.quality === "blunder") {
        setStatus("reviewing-mistake");
        return;
      }
      if (!checkGameOver()) {
        void playEngineReply();
      }
    } catch {
      setEngineError("Engine unavailable — try again.");
      setStatus("playing");
    }
  }

  async function playEngineReply() {
    setStatus("engine-thinking");
    setEngineError(null);
    try {
      const fenBefore = gameRef.current.fen();
      const mover = gameRef.current.turn();
      const uci = await requestEngineMove(fenBefore, elo);
      if (!uci) {
        checkGameOver();
        return;
      }
      const result = gameRef.current.move(parseUciMove(uci));
      if (!result) {
        checkGameOver();
        return;
      }
      const fenAfter = gameRef.current.fen();
      setFen(fenAfter);
      const ply = pushPendingPly(result.san, uci, mover, fenBefore, fenAfter);

      const [before, after] = await Promise.all([getAnalysis(fenBefore), getAnalysis(fenAfter)]);
      setCurrentEval(after);
      const annotation = annotateMove({
        ply,
        san: result.san,
        uci,
        mover,
        fenBefore,
        fenAfter,
        before,
        after,
        explanationDepth: SKILL_LEVELS[skillLevel].explanationDepth,
      });
      updatePlyDone(ply, annotation);

      if (!checkGameOver()) setStatus("playing");
    } catch {
      setEngineError("Engine unavailable — try again.");
      setStatus("playing");
    }
  }

  function handleMoveAttempt(sourceSquare: string, targetSquare: string): boolean {
    if (status !== "playing" || selectedPly !== null) return false;
    if (gameRef.current.turn() !== playerColor) return false;

    const mover = gameRef.current.turn();
    const fenBefore = gameRef.current.fen();
    const result = gameRef.current.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    if (!result) return false;

    const fenAfter = gameRef.current.fen();
    setFen(fenAfter);
    const uci = `${sourceSquare}${targetSquare}${result.promotion ?? ""}`;
    const ply = pushPendingPly(result.san, uci, mover, fenBefore, fenAfter);
    void analyzePlayerMove(ply, mover, fenBefore, fenAfter, result.san, uci);
    return true;
  }

  function handleTryAgain() {
    const last = plies[plies.length - 1];
    if (!last) return;
    gameRef.current.undo();
    setFen(gameRef.current.fen());
    setPlies((current) => current.slice(0, -1));
    setLastPlayerAnnotation(null);
    setStatus("playing");
    setEngineError(null);
  }

  function handleContinue() {
    setStatus("engine-thinking");
    void playEngineReply();
  }

  function handleResign() {
    if (status === "ended") return;
    setStatus("ended");
    setResultText("You resigned.");
  }

  function handleNewGame(nextColor?: PlayerColor) {
    const color = nextColor ?? playerColor;
    gameRef.current = new Chess();
    analysisCacheRef.current.clear();
    setFen(gameRef.current.fen());
    setPlies([]);
    setStatus("playing");
    setResultText(null);
    setLastPlayerAnnotation(null);
    setSelectedPly(null);
    setEngineError(null);
    setPlayerColor(color);
    void getAnalysis(gameRef.current.fen()).then((result) => setCurrentEval(result));
    if (color === "b") {
      setStatus("engine-thinking");
      void playEngineReply();
    }
  }

  function handleChoosePlayerColor(choice: "w" | "b" | "random") {
    if (gameStarted) return;
    const color = choice === "random" ? (Math.random() < 0.5 ? "w" : "b") : choice;
    handleNewGame(color);
  }

  const doneAnnotations = useMemo(
    () =>
      plies.filter((record): record is Extract<PlyRecord, { status: "done" }> => record.status === "done"),
    [plies],
  );

  const moveListEntries: MoveListEntry[] = plies.map((record) =>
    record.status === "done"
      ? {
          ply: record.annotation.ply,
          san: record.annotation.san,
          quality: record.annotation.quality,
          evalCp: record.annotation.after.evalCp,
          mate: record.annotation.after.mate,
        }
      : { ply: record.ply, san: record.san, quality: null },
  );

  const selectedRecord =
    selectedPly !== null
      ? doneAnnotations.find((record) => record.annotation.ply === selectedPly)
      : undefined;

  const displayedFen = selectedRecord ? selectedRecord.annotation.fenAfter : fen;
  const displayedEval = selectedRecord ? selectedRecord.annotation.after : currentEval;

  const reviewingMistake = status === "reviewing-mistake" && lastPlayerAnnotation && selectedPly === null;
  const activeAnnotation = selectedRecord ? selectedRecord.annotation : reviewingMistake ? lastPlayerAnnotation : null;

  const boardArrows: BoardArrow[] = [];
  let lastMoveSquares: { from: string; to: string } | null = null;
  if (activeAnnotation) {
    const { from, to } = parseUciMove(activeAnnotation.uci);
    lastMoveSquares = { from, to };
    if (activeAnnotation.quality === "mistake" || activeAnnotation.quality === "blunder") {
      if (activeAnnotation.bestMoveSan && activeAnnotation.before.bestMove) {
        const bestUci = parseUciMove(activeAnnotation.before.bestMove);
        boardArrows.push({ from: bestUci.from, to: bestUci.to, kind: "best" });
      }
      if (activeAnnotation.threatUci) {
        const threat = parseUciMove(activeAnnotation.threatUci);
        boardArrows.push({ from: threat.from, to: threat.to, kind: "threat" });
      }
    }
  }

  const showRawEval = SKILL_LEVELS[skillLevel].showRawEval;

  const playerMoveStats = useMemo(() => {
    const own = doneAnnotations.filter((record) => record.annotation.mover === playerColor);
    const counts = { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
    for (const record of own) counts[record.annotation.quality]++;
    const total = own.length;
    const accuracy = total > 0 ? Math.round(((counts.best + counts.good) / total) * 100) : null;

    const swings = own
      .map((record) => ({
        ply: record.annotation.ply,
        swing: Math.abs(
          whiteWinPercent(record.annotation.before.evalCp, record.annotation.before.mate) -
            whiteWinPercent(record.annotation.after.evalCp, record.annotation.after.mate),
        ),
      }))
      .sort((a, b) => b.swing - a.swing)
      .slice(0, 3);

    return { counts, accuracy, swings };
  }, [doneAnnotations, playerColor]);

  let coachCard: React.ReactNode;
  if (status === "ended" && selectedPly === null) {
    coachCard = (
      <CoachCard
        title={resultText ?? "Game over"}
        body={
          playerMoveStats.accuracy !== null
            ? `Your accuracy: ${playerMoveStats.accuracy}% (${playerMoveStats.counts.best + playerMoveStats.counts.good} of ${doneAnnotations.filter((r) => r.annotation.mover === playerColor).length} moves were best or good).`
            : undefined
        }
        actions={[
          ...playerMoveStats.swings.map((swing, i) => ({
            label: `Review moment ${i + 1} (move ${Math.ceil(swing.ply / 2)})`,
            onClick: () => setSelectedPly(swing.ply),
            variant: "secondary" as const,
          })),
          { label: "New game", onClick: () => handleNewGame(), variant: "primary" as const },
        ]}
      />
    );
  } else if (selectedRecord) {
    coachCard = (
      <CoachCard
        annotation={selectedRecord.annotation}
        showRawEval={showRawEval === "always"}
        actions={[{ label: "Back to game", onClick: () => setSelectedPly(null) }]}
      />
    );
  } else if (status === "analyzing") {
    coachCard = <CoachCard loading />;
  } else if (engineError) {
    coachCard = (
      <CoachCard
        error={engineError}
        actions={[{ label: "Retry", onClick: () => (status === "reviewing-mistake" ? handleContinue() : handleNewGame()) }]}
      />
    );
  } else if (reviewingMistake && lastPlayerAnnotation) {
    coachCard = (
      <CoachCard
        annotation={lastPlayerAnnotation}
        showRawEval={showRawEval === "always"}
        actions={[
          { label: "Try again", onClick: handleTryAgain, variant: "primary" },
          { label: "Continue", onClick: handleContinue, variant: "secondary" },
        ]}
      />
    );
  } else if (lastPlayerAnnotation) {
    coachCard = <CoachCard annotation={lastPlayerAnnotation} showRawEval={showRawEval === "always"} />;
  } else {
    coachCard = <CoachCard title="Starting position" body="Make a move to get feedback on it." />;
  }

  return (
    <TrainerLayout
      winBar={<WinBar evalCp={displayedEval.evalCp} mate={displayedEval.mate} loading={status === "analyzing"} />}
      board={
        <ChessBoard
          fen={displayedFen}
          onMoveAttempt={handleMoveAttempt}
          allowDragging={status === "playing" && selectedPly === null && gameRef.current.turn() === playerColor}
          boardOrientation={playerColor === "b" ? "black" : "white"}
          lastMove={lastMoveSquares}
          arrows={boardArrows}
        />
      }
      belowBoard={
        <>
          <MaterialCount fen={displayedFen} />
          <div className="play-controls">
            {!gameStarted ? (
              <>
                <Button variant="secondary" onClick={() => handleChoosePlayerColor("w")}>
                  Play as White
                </Button>
                <Button variant="secondary" onClick={() => handleChoosePlayerColor("b")}>
                  Play as Black
                </Button>
                <Button variant="ghost" onClick={() => handleChoosePlayerColor("random")}>
                  Random
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={handleResign} disabled={status === "ended"}>
                  Resign
                </Button>
                <Button variant="ghost" onClick={() => handleNewGame()}>
                  New game
                </Button>
              </>
            )}
          </div>
          <EloSlider elo={elo} onChange={setElo} disabled={status === "engine-thinking" || status === "analyzing"} />
        </>
      }
      coach={coachCard}
      sidebar={
        <Card className="move-list-card">
          <div className="move-list-card-header">
            <span className="input-label">Moves</span>
            <Legend />
          </div>
          <MoveList
            entries={moveListEntries}
            selectedPly={selectedPly}
            onSelect={(ply) => setSelectedPly(ply)}
            showRawEval={showRawEval}
          />
          {selectedPly !== null ? (
            <Button variant="ghost" onClick={() => setSelectedPly(null)}>
              Back to live game
            </Button>
          ) : null}
        </Card>
      }
    />
  );
}
