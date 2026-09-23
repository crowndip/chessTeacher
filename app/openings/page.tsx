"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { SiteShell } from "@/components/site-shell";
import { OPENINGS } from "@/lib/chess-data/openings";
import { SKILL_LEVELS, SKILL_LEVEL_ORDER, type SkillLevel } from "@/lib/chess/skill-level";

const LEVEL_RANK: Record<SkillLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
  expert: 3,
};

export default function OpeningsPage() {
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("beginner");
  const [showAll, setShowAll] = useState(false);

  const openings = useMemo(() => {
    const withinLevel = OPENINGS.filter((o) => LEVEL_RANK[o.level] <= LEVEL_RANK[skillLevel]);
    const preview = SKILL_LEVELS[skillLevel].openingLibraryPreviewSize;
    return showAll ? OPENINGS : withinLevel.slice(0, preview);
  }, [skillLevel, showAll]);

  return (
    <SiteShell>
      <div className="page-intro">
        <h1>Opening library</h1>
        <p>Named openings with the idea behind them and typical plans for both sides.</p>
      </div>

      <Card className="skill-level-picker">
        <span className="input-label">Skill level</span>
        <div className="skill-level-options">
          {SKILL_LEVEL_ORDER.map((level) => (
            <button
              key={level}
              type="button"
              className="skill-level-option"
              aria-pressed={skillLevel === level}
              onClick={() => {
                setSkillLevel(level);
                setShowAll(false);
              }}
            >
              {SKILL_LEVELS[level].label}
            </button>
          ))}
        </div>
      </Card>

      <div className="library-grid">
        {openings.map((opening) => (
          <Link key={opening.slug} href={`/openings/${opening.slug}`} className="library-card-link">
            <Card className="library-card">
              <div className="library-card-header">
                <strong>{opening.name}</strong>
                <Badge tone="neutral">{opening.eco}</Badge>
              </div>
              <p>{opening.summary}</p>
            </Card>
          </Link>
        ))}
      </div>

      {!showAll ? (
        <Button variant="ghost" onClick={() => setShowAll(true)}>
          Show all openings
        </Button>
      ) : null}
    </SiteShell>
  );
}
