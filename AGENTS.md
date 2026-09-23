# Agent guidelines

ChessTeacher is a Next.js (App Router, TypeScript) chess training app,
paired with a small Stockfish-backed engine service (`engine/`). Keep it
understandable enough that changes stay easy to review.

## Working rules

- Keep TypeScript strict and fix type errors instead of suppressing them.
- Prefer React Server Components. Add `"use client"` only where browser
  state or APIs are needed.
- Reuse `components/ui` and the CSS design tokens in `app/globals.css`
  before adding another UI dependency.
- Put shared utilities in `lib` and reusable React code in `components`.
- Verify chess facts (FENs, move legality, checkmate) with `chess.js`
  before trusting them — hand-built positions have been wrong before.
  A throwaway `npx tsx` script is the usual way to check.
- Never commit secrets or real credentials.
- Keep line endings LF.
- Keep changes small and the Git history linear where practical.

## Before finishing

Run:

```bash
npm run check
npm run build
```

If you introduce a direct import from another package, declare that
package explicitly in `dependencies` instead of relying on a transitive
dependency.
