"use client";

import { useEffect, useRef } from "react";
import { formatEval } from "@/lib/chess/eval-format";
import type { MoveQuality } from "@/lib/chess/review";

export type MoveListEntry = {
  ply: number;
  san: string;
  quality: MoveQuality | null;
  evalCp?: number | null;
  mate?: number | null;
};

export type MoveListProps = {
  entries: MoveListEntry[];
  selectedPly: number | null;
  onSelect: (ply: number) => void;
  showRawEval: "never" | "hover" | "always";
};

export function MoveList({ entries, selectedPly, onSelect, showRawEval }: MoveListProps) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const lastButton = list.querySelector<HTMLButtonElement>("button:last-of-type");
    lastButton?.scrollIntoView({ block: "nearest" });
  }, [entries.length]);

  const pairs: Array<{ number: number; white?: MoveListEntry; black?: MoveListEntry }> = [];
  for (const entry of entries) {
    const number = Math.ceil(entry.ply / 2);
    let pair = pairs.find((p) => p.number === number);
    if (!pair) {
      pair = { number };
      pairs.push(pair);
    }
    if (entry.ply % 2 === 1) pair.white = entry;
    else pair.black = entry;
  }

  function handleKeyDown(event: React.KeyboardEvent, ply: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const index = entries.findIndex((entry) => entry.ply === ply);
    const nextIndex = event.key === "ArrowRight" ? index + 1 : index - 1;
    const next = entries[nextIndex];
    if (next) onSelect(next.ply);
  }

  function renderEntry(entry: MoveListEntry) {
    const pending = entry.quality === null;
    const evalText = formatEval(entry.evalCp ?? null, entry.mate ?? null);
    return (
      <button
        key={entry.ply}
        type="button"
        className={`move-list-item${selectedPly === entry.ply ? " move-list-item-selected" : ""}`}
        onClick={() => onSelect(entry.ply)}
        onKeyDown={(event) => handleKeyDown(event, entry.ply)}
        title={showRawEval === "hover" && !pending ? evalText : undefined}
      >
        <span className="move-list-item-san">{entry.san}</span>
        <span
          className={`quality-dot${pending ? " quality-dot-pending" : ` quality-${entry.quality}`}`}
          aria-hidden="true"
        />
        {showRawEval === "always" && !pending ? <span className="move-list-item-eval">{evalText}</span> : null}
      </button>
    );
  }

  return (
    <ol className="move-list-trainer" ref={listRef}>
      {pairs.map((pair) => (
        <li key={pair.number} className="move-list-trainer-row">
          <span className="move-list-number">{pair.number}.</span>
          {pair.white ? renderEntry(pair.white) : null}
          {pair.black ? renderEntry(pair.black) : null}
        </li>
      ))}
    </ol>
  );
}
