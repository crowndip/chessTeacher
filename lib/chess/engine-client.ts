export type PositionAnalysis = {
  fen: string;
  evalCp: number | null;
  mate: number | null;
  bestMove: string | null;
  pv: string[];
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Engine request to ${url} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function analyzePositions(fens: string[]): Promise<PositionAnalysis[]> {
  if (fens.length === 0) return [];
  const data = await postJson<{ positions?: PositionAnalysis[] }>("/api/engine/analyze", { fens });
  return data.positions ?? [];
}

export async function analyzePosition(fen: string): Promise<PositionAnalysis> {
  const [position] = await analyzePositions([fen]);
  return (
    position ?? {
      fen,
      evalCp: null,
      mate: null,
      bestMove: null,
      pv: [],
    }
  );
}

export async function requestEngineMove(fen: string, elo: number): Promise<string | null> {
  const data = await postJson<{ move: string | null }>("/api/engine/move", { fen, elo });
  return data.move;
}
