import { NextResponse } from "next/server";
import { fetchLichessExercise, type SequenceMotif } from "@/lib/chess/lichess-exercise";
import type { PositionAnalysis } from "@/lib/chess/engine-client";
import type { SkillLevel } from "@/lib/chess/skill-level";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:4000";

async function analyzePositionsServerSide(fens: string[]): Promise<PositionAnalysis[]> {
  const response = await fetch(`${ENGINE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fens }),
  });
  if (!response.ok) throw new Error(`engine analyze failed with status ${response.status}`);
  const data = (await response.json()) as { positions?: PositionAnalysis[] };
  return data.positions ?? [];
}

const KNOWN_MOTIFS: SequenceMotif[] = [
  "fork",
  "pin",
  "skewer",
  "backRankMate",
  "smotheredMate",
  "discoveredCheck",
  "deflection",
  "intermezzo",
  "capturingDefender",
  "attraction",
  "anastasiaMate",
  "bodenMate",
];
const KNOWN_SKILL_LEVELS: SkillLevel[] = ["beginner", "intermediate", "advanced", "expert"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const motif = body?.motif as SequenceMotif | undefined;
  const skillLevel = body?.skillLevel as SkillLevel | undefined;

  if (!motif || !KNOWN_MOTIFS.includes(motif) || !skillLevel || !KNOWN_SKILL_LEVELS.includes(skillLevel)) {
    return NextResponse.json({ ok: false, reason: "Bad request." }, { status: 400 });
  }

  const result = await fetchLichessExercise(motif, skillLevel, analyzePositionsServerSide);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
