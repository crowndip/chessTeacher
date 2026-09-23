import Link from "next/link";
import type { ReactNode } from "react";
import { SiteBrand } from "@/components/site-brand";
import { SkillLevelPicker, SkillLevelProvider } from "@/components/chess/skill-level-context";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <SkillLevelProvider>
      <div className="site-shell">
        <header className="site-header">
          <div className="container header-inner">
            <SiteBrand />
            <nav className="header-nav" aria-label="Main navigation">
              <Link href="/">Play</Link>
              <Link href="/openings">Openings</Link>
              <Link href="/sequences">Sequences</Link>
            </nav>
            <SkillLevelPicker />
          </div>
        </header>

        <main className="container main-content">{children}</main>

        <footer className="site-footer">
          <div className="container footer-inner">
            <SiteBrand />
            <span>ChessTeacher · 2026</span>
          </div>
        </footer>
      </div>
    </SkillLevelProvider>
  );
}
