"use client";

import { Chess } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { ChessBoard } from "@/components/chess/board";
import { EloSlider } from "@/components/chess/elo-slider";
import { EvalBadge } from "@/components/chess/eval-badge";
import { MaterialCount } from "@/components/chess/material-count";
import { classifyMove, type MoveQuality } from "@/lib/chess/review";
import { SKILL_LEVELS, SKILL_LEVEL_ORDER, type SkillLevel } from "@/lib/chess/skill-level";
import { parseUciMove } from "@/lib/chess/uci";

type GameStatus = "playing" | "thinking" | "ended";

type MoveRecord = {
  san: string;
  evalCp: number | null;
  mate: number | null;
  quality: MoveQuality | null;
};

type PositionEval = { evalCp: number | null; mate: number | null };

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

export function PlayView() {
  const gameRef = useRef(new Chess());
  const runningEvalRef = useRef<PositionEval>({ evalCp: 20, mate: null });
  const [fen, setFen] = useState(gameRef.current.fen());
  const [sanMoves, setSanMoves] = useState<string[]>([]);
  const [moveRecords, setMoveRecords] = useState<MoveRecord[]>([]);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [resultText, setResultText] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("beginner");
  const [elo, setElo] = useState(SKILL_LEVELS.beginner.defaultElo);

  useEffect(() => {
    void fetchEval(gameRef.current.fen()).then((result) => {
      runningEvalRef.current = result;
    });
  }, []);

  const movePairs = useMemo(() => {
    const pairs: Array<{ number: number; white: MoveRecord; black?: MoveRecord }> = [];
    for (let i = 0; i < sanMoves.length; i += 2) {
      pairs.push({ number: i / 2 + 1, white: moveRecords[i], black: moveRecords[i + 1] });
    }
    return pairs;
  }, [sanMoves, moveRecords]);

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

  async function recordMove(san: string, moverSide: "w" | "b", newFen: string) {
    let recordIndex = -1;
    setMoveRecords((records) => {
      recordIndex = records.length;
      return [...records, { san, evalCp: null, mate: null, quality: null }];
    });

    const before = runningEvalRef.current;
    const after = await fetchEval(newFen);
    const quality = classifyMove(before, after, moverSide);
    runningEvalRef.current = after;

    setMoveRecords((records) =>
      records.map((record, i) =>
        i === recordIndex ? { ...record, evalCp: after.evalCp, mate: after.mate, quality } : record,
      ),
    );
  }

  async function requestEngineMove() {
    setStatus("thinking");
    try {
      const moverSide = gameRef.current.turn();
      const response = await fetch("/api/engine/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fen: gameRef.current.fen(), elo }),
      });
      const data = (await response.json()) as { move: string | null };
      if (data.move) {
        const result = gameRef.current.move(parseUciMove(data.move));
        if (result) {
          const newFen = gameRef.current.fen();
          setSanMoves((moves) => [...moves, result.san]);
          setFen(newFen);
          void recordMove(result.san, moverSide, newFen);
        }
      }
    } finally {
      if (!checkGameOver()) setStatus("playing");
    }
  }

  function handleMoveAttempt(sourceSquare: string, targetSquare: string): boolean {
    if (status !== "playing") return false;
    const moverSide = gameRef.current.turn();
    const result = gameRef.current.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    if (!result) return false;

    const newFen = gameRef.current.fen();
    setSanMoves((moves) => [...moves, result.san]);
    setFen(newFen);
    void recordMove(result.san, moverSide, newFen);

    if (!checkGameOver()) {
      void requestEngineMove();
    }
    return true;
  }

  function handleUndo() {
    if (status === "thinking" || sanMoves.length < 2) return;
    gameRef.current.undo();
    gameRef.current.undo();
    const newFen = gameRef.current.fen();
    setSanMoves((moves) => moves.slice(0, -2));
    setMoveRecords((records) => records.slice(0, -2));
    setFen(newFen);
    setStatus("playing");
    setResultText(null);
    void fetchEval(newFen).then((result) => {
      runningEvalRef.current = result;
    });
  }

  function handleResign() {
    if (status === "ended") return;
    setStatus("ended");
    setResultText("You resigned.");
  }

  function handleReset() {
    gameRef.current = new Chess();
    const startFen = gameRef.current.fen();
    setSanMoves([]);
    setMoveRecords([]);
    setFen(startFen);
    setStatus("playing");
    setResultText(null);
    void fetchEval(startFen).then((result) => {
      runningEvalRef.current = result;
    });
  }

  return (
    <div className="play-view">
      <div className="play-board-column">
        <ChessBoard fen={fen} onMoveAttempt={handleMoveAttempt} allowDragging={status === "playing"} />
        <MaterialCount fen={fen} />
        <div className="play-controls">
          <Button variant="secondary" onClick={handleUndo} disabled={sanMoves.length < 2}>
            Undo
          </Button>
          <Button variant="secondary" onClick={handleResign} disabled={status === "ended"}>
            Resign
          </Button>
          <Button variant="ghost" onClick={handleReset}>
            New game
          </Button>
        </div>
      </div>

      <div className="play-side-column">
        <Card className="skill-level-picker">
          <span className="input-label">Skill level</span>
          <div className="skill-level-options">
            {SKILL_LEVEL_ORDER.map((level) => (
              <button
                key={level}
                type="button"
                className="skill-level-option"
                aria-pressed={skillLevel === level}
                onClick={() => {
                  setSkillLevel(level);
                  setElo(SKILL_LEVELS[level].defaultElo);
                }}
              >
                {SKILL_LEVELS[level].label}
              </button>
            ))}
          </div>
          <p className="skill-level-description">{SKILL_LEVELS[skillLevel].description}</p>
        </Card>

        <EloSlider elo={elo} onChange={setElo} disabled={status === "thinking"} />

        <Card className="move-list-card">
          <span className="input-label">Moves</span>
          <ol className="move-list">
            {movePairs.map((pair) => (
              <li key={pair.number}>
                <span className="move-list-number">{pair.number}.</span>
                <span className="move-list-entry">
                  {pair.white.san}
                  <EvalBadge evalCp={pair.white.evalCp} mate={pair.white.mate} quality={pair.white.quality} />
                </span>
                {pair.black ? (
                  <span className="move-list-entry">
                    {pair.black.san}
                    <EvalBadge evalCp={pair.black.evalCp} mate={pair.black.mate} quality={pair.black.quality} />
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </Card>

        {status === "ended" ? (
          <Card className="game-result">
            <p>{resultText}</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
