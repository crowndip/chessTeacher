import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";

const STOCKFISH_BIN = process.env.STOCKFISH_BIN ?? "stockfish";
const MIN_ELO = 1320;
const MAX_ELO = 3190;

export function clampElo(elo: number): number {
  if (Number.isNaN(elo)) return MIN_ELO;
  return Math.min(MAX_ELO, Math.max(MIN_ELO, Math.round(elo)));
}

export type AnalyzedPosition = {
  fen: string;
  bestMove: string | null;
  /** Evaluation in centipawns from White's perspective. Absent if a forced mate was found instead. */
  evalCp: number | null;
  /** Mate in N (positive = White mates, negative = Black mates), if the engine found a forced mate. */
  mate: number | null;
};

function sideToMove(fen: string): "w" | "b" {
  const parts = fen.trim().split(/\s+/);
  return parts[1] === "b" ? "b" : "w";
}

/**
 * Wraps a single Stockfish UCI child process. Not reusable across
 * concurrent callers - callers must serialize commands against one
 * instance (this class does that internally via an operation queue).
 */
export class StockfishProcess {
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly rl: ReturnType<typeof createInterface>;
  private queue: Promise<unknown> = Promise.resolve();

  private constructor(child: ChildProcessWithoutNullStreams) {
    this.child = child;
    this.rl = createInterface({ input: this.child.stdout });
    // Without a listener, a later 'error' event (e.g. the process dying
    // mid-request) would throw and crash the whole server process.
    this.child.on("error", (error) => {
      console.error("Stockfish process error:", error);
    });
  }

  static async create(): Promise<StockfishProcess> {
    const child = spawn(STOCKFISH_BIN, [], { stdio: "pipe" });
    const spawnError = new Promise<never>((_, reject) => {
      child.once("error", reject);
    });

    const proc = new StockfishProcess(child);
    await Promise.race([proc.handshake(), spawnError]);
    return proc;
  }

  private send(command: string) {
    this.child.stdin.write(`${command}\n`);
  }

  private waitFor(predicate: (line: string) => boolean, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.rl.off("line", onLine);
        reject(new Error(`Timed out waiting for engine response after ${timeoutMs}ms`));
      }, timeoutMs);

      const onLine = (line: string) => {
        if (predicate(line)) {
          clearTimeout(timer);
          this.rl.off("line", onLine);
          resolve(line);
        }
      };

      this.rl.on("line", onLine);
    });
  }

  private async handshake() {
    this.send("uci");
    await this.waitFor((line) => line.trim() === "uciok", 5000);
    this.send("isready");
    await this.waitFor((line) => line.trim() === "readyok", 5000);
  }

  private setStrength(elo: number) {
    this.send("setoption name UCI_LimitStrength value true");
    this.send(`setoption name UCI_Elo value ${clampElo(elo)}`);
  }

  private run<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.catch(() => undefined);
    return result;
  }

  /** Best move for a position at a given approximate ELO strength. */
  async bestMove(fen: string, elo: number, movetimeMs = 1000): Promise<string | null> {
    return this.run(async () => {
      this.setStrength(elo);
      this.send("ucinewgame");
      this.send(`position fen ${fen}`);
      this.send(`go movetime ${movetimeMs}`);
      const line = await this.waitFor((l) => l.startsWith("bestmove"), movetimeMs + 5000);
      const move = line.split(/\s+/)[1];
      return move === "(none)" ? null : move;
    });
  }

  /** Full-strength analysis of a position: eval + best move. Used for Game Review. */
  async analyze(fen: string, movetimeMs = 800): Promise<AnalyzedPosition> {
    return this.run(async () => {
      this.send("setoption name UCI_LimitStrength value false");
      this.send("ucinewgame");
      this.send(`position fen ${fen}`);
      this.send(`go movetime ${movetimeMs}`);

      let evalCp: number | null = null;
      let mate: number | null = null;
      const stm = sideToMove(fen);

      const onInfoLine = (line: string) => {
        const cpMatch = line.match(/score cp (-?\d+)/);
        const mateMatch = line.match(/score mate (-?\d+)/);
        if (cpMatch) {
          const raw = Number(cpMatch[1]);
          evalCp = stm === "w" ? raw : -raw;
          mate = null;
        } else if (mateMatch) {
          const raw = Number(mateMatch[1]);
          mate = stm === "w" ? raw : -raw;
          evalCp = null;
        }
      };

      this.rl.on("line", onInfoLine);
      const line = await this.waitFor((l) => l.startsWith("bestmove"), movetimeMs + 5000).finally(
        () => this.rl.off("line", onInfoLine),
      );
      const move = line.split(/\s+/)[1];

      return {
        fen,
        bestMove: move === "(none)" ? null : move,
        evalCp,
        mate,
      };
    });
  }

  quit() {
    try {
      this.send("quit");
    } finally {
      this.child.kill();
    }
  }
}
