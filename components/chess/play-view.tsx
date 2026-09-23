"use client";

import { Chess } from "chess.js";
import { useMemo, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { ChessBoard } from "@/components/chess/board";
import { EloSlider } from "@/components/chess/elo-slider";
import { ReviewPanel } from "@/components/chess/review-panel";
import { SKILL_LEVELS, SKILL_LEVEL_ORDER, type SkillLevel } from "@/lib/chess/skill-level";
import { parseUciMove } from "@/lib/chess/uci";

type GameStatus = "playing" | "thinking" | "ended";

export function PlayView() {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [sanMoves, setSanMoves] = useState<string[]>([]);
  const [fenHistory, setFenHistory] = useState<string[]>([gameRef.current.fen()]);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [resultText, setResultText] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("beginner");
  const [elo, setElo] = useState(SKILL_LEVELS.beginner.defaultElo);
  const [showReview, setShowReview] = useState(false);

  const movePairs = useMemo(() => {
    const pairs: Array<{ number: number; white: string; black?: string }> = [];
    for (let i = 0; i < sanMoves.length; i += 2) {
      pairs.push({ number: i / 2 + 1, white: sanMoves[i], black: sanMoves[i + 1] });
    }
    return pairs;
  }, [sanMoves]);

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

  async function requestEngineMove() {
    setStatus("thinking");
    try {
      const response = await fetch("/api/engine/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fen: gameRef.current.fen(), elo }),
      });
      const data = (await response.json()) as { move: string | null };
      if (data.move) {
        const result = gameRef.current.move(parseUciMove(data.move));
        if (result) {
          setSanMoves((moves) => [...moves, result.san]);
          setFenHistory((history) => [...history, gameRef.current.fen()]);
          setFen(gameRef.current.fen());
        }
      }
    } finally {
      if (!checkGameOver()) setStatus("playing");
    }
  }

  function handleMoveAttempt(sourceSquare: string, targetSquare: string): boolean {
    if (status !== "playing") return false;
    const result = gameRef.current.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    if (!result) return false;

    setSanMoves((moves) => [...moves, result.san]);
    setFenHistory((history) => [...history, gameRef.current.fen()]);
    setFen(gameRef.current.fen());

    if (!checkGameOver()) {
      void requestEngineMove();
    }
    return true;
  }

  function handleUndo() {
    if (status === "thinking") return;
    gameRef.current.undo();
    gameRef.current.undo();
    setSanMoves((moves) => moves.slice(0, -2));
    setFenHistory((history) => history.slice(0, -2));
    setFen(gameRef.current.fen());
    setStatus("playing");
    setResultText(null);
    setShowReview(false);
  }

  function handleResign() {
    if (status === "ended") return;
    setStatus("ended");
    setResultText("You resigned.");
  }

  function handleReset() {
    gameRef.current = new Chess();
    setSanMoves([]);
    setFenHistory([gameRef.current.fen()]);
    setFen(gameRef.current.fen());
    setStatus("playing");
    setResultText(null);
    setShowReview(false);
  }

  return (
    <div className="play-view">
      <div className="play-board-column">
        <ChessBoard fen={fen} onMoveAttempt={handleMoveAttempt} allowDragging={status === "playing"} />
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
                <span>{pair.white}</span>
                {pair.black ? <span>{pair.black}</span> : null}
              </li>
            ))}
          </ol>
        </Card>

        {status === "ended" ? (
          <Card className="game-result">
            <p>{resultText}</p>
            {!showReview ? (
              <Button onClick={() => setShowReview(true)}>Review this game</Button>
            ) : null}
          </Card>
        ) : null}

        {showReview ? <ReviewPanel sanMoves={sanMoves} fens={fenHistory} /> : null}
      </div>
    </div>
  );
}
