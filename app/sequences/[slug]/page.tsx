import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { SequenceStepper } from "@/components/chess/sequence-stepper";
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

  return (
    <SiteShell>
      <div className="page-intro">
        <Link href="/sequences">← Sample sequences</Link>
        <h1>{sequence.title}</h1>
        <p>{sequence.summary}</p>
      </div>

      <SequenceStepper startFen={sequence.startFen} moves={sequence.moves} explanations={sequence.explanations} />
    </SiteShell>
  );
}
