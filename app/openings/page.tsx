"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { SiteShell } from "@/components/site-shell";
import { useSkillLevel } from "@/components/chess/skill-level-context";
import { OPENINGS } from "@/lib/chess-data/openings";
import { SKILL_LEVELS, type SkillLevel } from "@/lib/chess/skill-level";

const LEVEL_RANK: Record<SkillLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
  expert: 3,
};

function OpeningsList() {
  const { skillLevel } = useSkillLevel();
  const [showAll, setShowAll] = useState(false);

  const openings = useMemo(() => {
    const withinLevel = OPENINGS.filter((o) => LEVEL_RANK[o.level] <= LEVEL_RANK[skillLevel]);
    const preview = SKILL_LEVELS[skillLevel].openingLibraryPreviewSize;
    return showAll ? OPENINGS : withinLevel.slice(0, preview);
  }, [skillLevel, showAll]);

  return (
    <>
      <div className="page-intro">
        <h1>Opening library</h1>
        <p>
          Named openings with the idea behind them and typical plans for both sides. Showing openings for{" "}
          {SKILL_LEVELS[skillLevel].label} level — change your level in the header to see more or fewer.
        </p>
      </div>

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
    </>
  );
}

export default function OpeningsPage() {
  return (
    <SiteShell>
      <OpeningsList />
    </SiteShell>
  );
}
