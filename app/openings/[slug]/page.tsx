import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui";
import { SiteShell } from "@/components/site-shell";
import { OpeningViewer } from "@/components/chess/opening-viewer";
import { getOpening, OPENINGS } from "@/lib/chess-data/openings";

export function generateStaticParams() {
  return OPENINGS.map((opening) => ({ slug: opening.slug }));
}

export default async function OpeningDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const opening = getOpening(slug);
  if (!opening) notFound();

  return (
    <SiteShell>
      <div className="page-intro">
        <Link href="/openings">← Opening library</Link>
        <h1>{opening.name}</h1>
        <p>
          {opening.eco} · {opening.summary}
        </p>
      </div>

      <div className="detail-layout">
        <OpeningViewer moves={opening.moves} moveExplanations={opening.moveExplanations} />

        <div className="detail-notes">
          <Card>
            <strong>The idea</strong>
            <p>{opening.explanation}</p>
          </Card>
          <Card>
            <strong>Typical plans</strong>
            <p>
              <strong>White:</strong> {opening.plans.white}
            </p>
            <p>
              <strong>Black:</strong> {opening.plans.black}
            </p>
          </Card>
        </div>
      </div>
    </SiteShell>
  );
}
