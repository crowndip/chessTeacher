import Link from "next/link";
import type { ReactNode } from "react";
import { PromptbookBrand } from "@/components/promptbook-brand";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container header-inner">
          <PromptbookBrand />
          <nav className="header-nav" aria-label="Main navigation">
            <Link href="/">Play</Link>
            <Link href="/openings">Openings</Link>
            <Link href="/sequences">Sequences</Link>
          </nav>
        </div>
      </header>

      <main className="container main-content">{children}</main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <PromptbookBrand />
          <span>Promptbook · 2026</span>
        </div>
      </footer>
    </div>
  );
}
