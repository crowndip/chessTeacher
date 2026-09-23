import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { OpeningTrainer } from "@/components/chess/opening-trainer";
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

      <OpeningTrainer
        moves={opening.moves}
        moveExplanations={opening.moveExplanations}
        moveIdeas={opening.moveIdeas}
        explanation={opening.explanation}
        plans={opening.plans}
      />
    </SiteShell>
  );
}
