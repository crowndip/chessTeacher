import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { SequenceExerciseView } from "@/components/chess/sequence-exercise-view";
import { getSequence, SEQUENCES } from "@/lib/chess-data/sequences";

export function generateStaticParams() {
  return SEQUENCES.map((sequence) => ({ slug: sequence.slug }));
}

export default async function SequenceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sequence = getSequence(slug);
  if (!sequence) notFound();

  const index = SEQUENCES.findIndex((s) => s.slug === slug);
  const next = SEQUENCES[index + 1];

  return (
    <SiteShell>
      <div className="page-intro">
        <Link href="/sequences">← Sample sequences</Link>
        <h1>{sequence.title}</h1>
        <p>{sequence.summary}</p>
      </div>

      <SequenceExerciseView
        sequence={sequence}
        nextSequence={next ? { slug: next.slug, title: next.title } : undefined}
      />
    </SiteShell>
  );
}
