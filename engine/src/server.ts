import express from "express";
import { StockfishProcess } from "./stockfish-process.js";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT ?? 4000);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/move", async (req, res) => {
  const { fen, elo } = req.body as { fen?: string; elo?: number };
  if (typeof fen !== "string" || typeof elo !== "number") {
    res.status(400).json({ error: "Expected { fen: string, elo: number }" });
    return;
  }

  let engine: StockfishProcess | undefined;
  try {
    engine = await StockfishProcess.create();
    const move = await engine.bestMove(fen, elo);
    res.json({ move });
  } catch (error) {
    console.error("Error computing move:", error);
    res.status(500).json({ error: "Failed to compute a move" });
  } finally {
    engine?.quit();
  }
});

app.post("/api/analyze", async (req, res) => {
  const { fens } = req.body as { fens?: unknown };
  if (!Array.isArray(fens) || fens.some((f) => typeof f !== "string")) {
    res.status(400).json({ error: "Expected { fens: string[] }" });
    return;
  }

  let engine: StockfishProcess | undefined;
  try {
    engine = await StockfishProcess.create();
    const positions = [];
    for (const fen of fens as string[]) {
      positions.push(await engine.analyze(fen));
    }
    res.json({ positions });
  } catch (error) {
    console.error("Error analyzing game:", error);
    res.status(500).json({ error: "Failed to analyze the game" });
  } finally {
    engine?.quit();
  }
});

app.listen(PORT, () => {
  console.log(`Chess engine service listening on port ${PORT}`);
});
