"use client";

import { useEffect, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { MOVE_QUALITY_LABEL, type MoveQuality } from "@/lib/chess/review";

const STORAGE_KEY = "chess-trainer:legend-seen";
const QUALITIES: MoveQuality[] = ["best", "good", "inaccuracy", "mistake", "blunder"];

export function Legend() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
        window.localStorage.setItem(STORAGE_KEY, "1");
      }
    } catch {
      // localStorage unavailable - just don't auto-open.
    }
  }, []);

  return (
    <div className="legend">
      <button
        type="button"
        className="legend-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="What do the colors and numbers mean?"
      >
        <HelpCircle size={16} />
        Legend
      </button>

      {open ? (
        <div className="legend-popover">
          <button type="button" className="legend-close" onClick={() => setOpen(false)} aria-label="Close legend">
            <X size={14} />
          </button>
          <p>
            <strong>Win bar</strong> — who's ahead in the current position, as a percentage estimated from
            the engine's evaluation.
          </p>
          <p>
            <strong>Move dots</strong> — how good each move was:
          </p>
          <ul className="legend-list">
            {QUALITIES.map((quality) => (
              <li key={quality}>
                <span className={`quality-dot quality-${quality}`} aria-hidden="true" />
                {MOVE_QUALITY_LABEL[quality]}
              </li>
            ))}
          </ul>
          <p>Numbers, when shown, are in pawns from White's point of view (e.g. +1.0 favors White).</p>
        </div>
      ) : null}
    </div>
  );
}
