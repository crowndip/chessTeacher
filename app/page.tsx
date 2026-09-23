import { PlayView } from "@/components/chess/play-view";
import { SiteShell } from "@/components/site-shell";

export default function Home() {
  return (
    <SiteShell>
      <div className="page-intro">
        <h1>ChessTeacher</h1>
        <p>Play against an adjustable-strength opponent, then review the game move by move.</p>
      </div>

      <PlayView />
    </SiteShell>
  );
}
