"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Card } from "@/components/ui";
import { SiteShell } from "@/components/site-shell";
import { useSkillLevel } from "@/components/chess/skill-level-context";
import { SEQUENCES, type SequenceTheme } from "@/lib/chess-data/sequences";
import { SKILL_LEVELS, type SkillLevel } from "@/lib/chess/skill-level";

const THEME_LABEL: Record<SequenceTheme, string> = {
  tactics: "Tactics",
  "checkmate-patterns": "Checkmate patterns",
  endgame: "Endgame",
  positional: "Positional",
};

const THEMES = Object.keys(THEME_LABEL) as SequenceTheme[];

const LEVEL_RANK: Record<SkillLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
  expert: 3,
};

function SequencesList() {
  const { skillLevel } = useSkillLevel();
  const [themeFilter, setThemeFilter] = useState<SequenceTheme | "all">("all");

  const sequences = useMemo(
    () =>
      SEQUENCES.filter(
        (s) => (themeFilter === "all" || s.theme === themeFilter) && LEVEL_RANK[s.level] <= LEVEL_RANK[skillLevel],
      ),
    [themeFilter, skillLevel],
  );

  return (
    <>
      <div className="page-intro">
        <h1>Sample sequences</h1>
        <p>
          Step through short tactical and endgame patterns with an explanation at each move. Showing sequences for{" "}
          {SKILL_LEVELS[skillLevel].label} level — change your level in the header to see more or fewer.
        </p>
      </div>

      <Card className="skill-level-picker">
        <span className="input-label">Theme</span>
        <div className="skill-level-options">
          <button
            type="button"
            className="skill-level-option"
            aria-pressed={themeFilter === "all"}
            onClick={() => setThemeFilter("all")}
          >
            All
          </button>
          {THEMES.map((theme) => (
            <button
              key={theme}
              type="button"
              className="skill-level-option"
              aria-pressed={themeFilter === theme}
              onClick={() => setThemeFilter(theme)}
            >
              {THEME_LABEL[theme]}
            </button>
          ))}
        </div>
      </Card>

      <div className="library-grid">
        {sequences.map((sequence) => (
          <Link key={sequence.slug} href={`/sequences/${sequence.slug}`} className="library-card-link">
            <Card className="library-card">
              <div className="library-card-header">
                <strong>{sequence.title}</strong>
                <div className="library-card-badges">
                  <Badge tone="green">{THEME_LABEL[sequence.theme]}</Badge>
                  <Badge tone="neutral">{SKILL_LEVELS[sequence.level].label}</Badge>
                </div>
              </div>
              <p>{sequence.summary}</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function SequencesPage() {
  return (
    <SiteShell>
      <SequencesList />
    </SiteShell>
  );
}
