"use client";

import { Card } from "@/components/ui";
import { ELO_PRESETS, MAX_ELO, MIN_ELO, clampElo } from "@/lib/chess/elo";

export type EloSliderProps = {
  elo: number;
  onChange: (elo: number) => void;
  disabled?: boolean;
};

export function EloSlider({ elo, onChange, disabled }: EloSliderProps) {
  return (
    <Card className="elo-slider">
      <div className="elo-slider-header">
        <span className="input-label">Opponent strength</span>
        <strong>{elo} ELO</strong>
      </div>
      <input
        type="range"
        min={MIN_ELO}
        max={MAX_ELO}
        step={10}
        value={elo}
        disabled={disabled}
        onChange={(event) => onChange(clampElo(Number(event.target.value)))}
        aria-label="Opponent ELO rating"
      />
      <div className="elo-slider-presets">
        {ELO_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className="elo-preset"
            disabled={disabled}
            aria-pressed={elo === preset}
            onClick={() => onChange(preset)}
          >
            {preset}
          </button>
        ))}
      </div>
    </Card>
  );
}
