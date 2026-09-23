export const MIN_ELO = 1320;
export const MAX_ELO = 3190;

export function clampElo(elo: number): number {
  if (Number.isNaN(elo)) return MIN_ELO;
  return Math.min(MAX_ELO, Math.max(MIN_ELO, Math.round(elo)));
}

export const ELO_PRESETS = [1320, 1600, 1900, 2200, 2500, 2800, 3190] as const;
