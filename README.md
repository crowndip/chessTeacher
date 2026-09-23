# ChessTeacher

A chess training app: play against an adjustable-strength engine, study
openings move by move, and drill tactics — with live evaluation, a
coach that explains why a move was good or bad, and puzzles pulled
live from [Lichess](https://lichess.org).

## Features

- **Play** — play White or Black against a Stockfish opponent tuned to
  a chosen ELO. Every move gets a live evaluation and, on a mistake or
  blunder, a coach card explaining what went wrong and what was better.
  Review any past move, or the game's biggest swings, after it ends.
- **Openings** — step through full annotated lines for eight openings,
  with a plain-language explanation for every move, or quiz yourself
  on the line from memory.
- **Sequences** — short, hand-verified tactical and checkmate patterns
  (forks, pins, skewers, back-rank mates, and more) in a puzzle mode
  with escalating hints, plus a "Watch" mode that steps through the
  solution with commentary.
- **Exercises** — pull a fresh, real puzzle for the same tactical theme
  straight from Lichess's puzzle database, live, on demand.
- Content, hints and evaluation depth adapt to a Beginner / Intermediate
  / Advanced / Expert skill level, set once in the header.

## Architecture

Two services, wired together with Docker Compose:

- **`web`** — this Next.js (App Router, TypeScript) app.
- **`engine`** — a small Node service that wraps a Stockfish binary,
  used for both playing moves (`UCI_Elo`-limited) and analyzing
  positions. It's not exposed outside the Docker network — `web`
  proxies to it server-side.

## Running locally

```bash
npm install
npm run dev
```

The dev server talks to `ENGINE_URL` (default `http://localhost:4000`)
for engine moves/analysis — you'll need the engine service running too
(see below) for Play, Sequences, and Exercises to work; Openings' static
content works without it.

## Running with Docker

```bash
docker compose up -d --build
```

Serves the app at `http://localhost:3000`. The engine container is
internal-only by design (no published port).

## Checks

```bash
npm run typecheck
npm run build
```

See `AGENTS.md` for contributor guidelines.
