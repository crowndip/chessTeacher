"use client";

import { formatWinSplit, whiteWinPercent } from "@/lib/chess/win-probability";

export type WinBarProps = {
  evalCp: number | null;
  mate: number | null;
  loading?: boolean;
};

export function WinBar({ evalCp, mate, loading = false }: WinBarProps) {
  const split = formatWinSplit(whiteWinPercent(evalCp, mate));
  const label =
    mate !== null
      ? mate > 0
        ? `White mates in ${Math.abs(mate)}`
        : `Black mates in ${Math.abs(mate)}`
      : `White ${split.white}%, Black ${split.black}%`;

  return (
    <div
      className={`win-bar${loading ? " win-bar-loading" : ""}`}
      role="meter"
      aria-valuenow={split.white}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="win-bar-white" style={{ width: `${split.white}%` }}>
        {mate !== null && mate > 0 ? (
          <span className="win-bar-mate">Mate in {Math.abs(mate)}</span>
        ) : (
          <span>White {split.white}%</span>
        )}
      </div>
      <div className="win-bar-black">
        {mate !== null && mate < 0 ? (
          <span className="win-bar-mate">Mate in {Math.abs(mate)}</span>
        ) : (
          <span>{split.black}% Black</span>
        )}
      </div>
    </div>
  );
}
