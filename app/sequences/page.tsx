"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Card } from "@/components/ui";
import { SiteShell } from "@/components/site-shell";
import { SEQUENCES, type SequenceTheme } from "@/lib/chess-data/sequences";
import { SKILL_LEVELS, SKILL_LEVEL_ORDER, type SkillLevel } from "@/lib/chess/skill-level";

const THEME_LABEL: Record<SequenceTheme, string> = {
  tactics: "Tactics",
  "checkmate-patterns": "Checkmate patterns",
  endgame: "Endgame",
  positional: "Positional",
};

const THEMES = Object.keys(THEME_LABEL) as SequenceTheme[];

export default function SequencesPage() {
  const [themeFilter, setThemeFilter] = useState<SequenceTheme | "all">("all");
  const [levelFilter, setLevelFilter] = useState<SkillLevel | "all">("all");

  const sequences = useMemo(
    () =>
      SEQUENCES.filter(
        (s) => (themeFilter === "all" || s.theme === themeFilter) && (levelFilter === "all" || s.level === levelFilter),
      ),
    [themeFilter, levelFilter],
  );

  return (
    <SiteShell>
      <div className="page-intro">
        <h1>Sample sequences</h1>
        <p>Step through short tactical and endgame patterns with an explanation at each move.</p>
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

      <Card className="skill-level-picker">
        <span className="input-label">Level</span>
        <div className="skill-level-options">
          <button
            type="button"
            className="skill-level-option"
            aria-pressed={levelFilter === "all"}
            onClick={() => setLevelFilter("all")}
          >
            All
          </button>
          {SKILL_LEVEL_ORDER.map((level) => (
            <button
              key={level}
              type="button"
              className="skill-level-option"
              aria-pressed={levelFilter === level}
              onClick={() => setLevelFilter(level)}
            >
              {SKILL_LEVELS[level].label}
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
    </SiteShell>
  );
}
