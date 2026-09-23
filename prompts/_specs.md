# Chess Trainer — Specification

## Summary

Generate an application for chess players. It should support levels from
beginners to experts — provide sample chess sequences with good
explanations, a library of opening moves with names and explanations, and
the possibility to play against an artificial opponent with adjustable ELO
rating.

## Target audience

- **Beginners** who know the rules but want guided explanations of why a
  move is good or bad.
- **Intermediate players** building an opening repertoire and pattern
  recognition.
- **Advanced/expert players** who want a sparring partner at a specific
  strength and deeper annotation.

A single skill-level selector should adapt content depth across all
features rather than requiring separate apps per level.

## Core features

### 1. Play against an artificial opponent

- Standard chess board and rules (legal move enforcement, check/checkmate/
  stalemate, castling, en passant, promotion, threefold repetition, fifty-move
  rule).
- Opponent strength adjustable by **approximate ELO rating** (e.g. a slider
  or presets: 400 / 800 / 1200 / 1600 / 2000 / 2400+), not just fixed
  "easy/medium/hard" buckets.
- Player can choose to play White, Black, or random.
- Post-move (or post-game) feedback: was the move a blunder/mistake/
  inaccuracy/good/best, in plain language, not just an evaluation number.
- Ability to undo a move / take back and try again (useful for learners).
- Game state persists across a session at minimum (reload-safe is a nice-to-have).

### 2. Sample chess sequences with explanations

- A curated set of short tactical/strategic sequences (e.g. forks, pins,
  skewers, discovered attacks, back-rank mates, common endgame patterns
  like king+pawn vs king, Lucena/Philidor positions).
- Each sequence includes: a title, the starting position (FEN), the move
  sequence, and a plain-language explanation of the idea at each key step.
- Sequences tagged by difficulty (beginner/intermediate/advanced) and by
  theme (tactics, endgame, positional, checkmate patterns).
- User can step through a sequence move-by-move on the board (like a replay/
  puzzle viewer), not just read static text.

### 3. Opening move library

- Library of named openings and variations (e.g. Italian Game, Sicilian
  Defense — Najdorf, Queen's Gambit Declined, King's Indian Defense, etc.).
- Each entry: name, ECO code, move list, short explanation of the idea/
  plan behind it, and typical follow-up plans for both sides.
- Searchable/filterable by name, ECO code, or resulting pawn structure/
  theme.
- Interactive board so the user can play through the opening's main line
  and common branches.
- Beginner mode surfaces a small curated subset (5–10 solid openings);
  advanced mode exposes the full library with deeper variations.

### 4. Difficulty / level adaptation

- A single explicit skill-level setting (e.g. Beginner / Intermediate /
  Advanced / Expert) that affects:
  - Vocabulary and depth of move explanations.
  - Which opening variations and sample sequences are surfaced by default.
  - Default opponent ELO suggestion (but still independently adjustable).

## Non-functional requirements

- Runs as a web app (fits this repo's existing Next.js + React setup).
- Chess rules/legal-move validation and the playing engine must be correct
  and enforced client- and/or server-side — no illegal moves accepted.
- Board and interactions must work on both desktop and mobile (touch-
  friendly drag/tap-to-move).
- Explanations should be understandable without a chess.com/Lichess account
  or any external dependency at play time.
- Reasonably fast engine response time so play doesn't feel laggy, even at
  higher ELO/search depth.

## Open questions / decisions needed before implementation

- **Chess engine choice**: use a well-known engine (e.g. Stockfish via
  WASM) with ELO simulated through search-depth/skill-level limiting, or a
  custom/AI (LLM-based) opponent? Stockfish-style is the standard,
  reliable approach for "adjustable ELO" — recommended default unless
  there's a reason to want LLM-driven play/commentary specifically.
- **Explanation source**: are move/opening explanations hand-authored
  content (static data), generated on the fly via an LLM (fits this repo's
  Promptbook integration), or a mix (static library + LLM for freeform
  "why was this a mistake?" questions)?
- **Persistence**: do games/progress need to be saved per user (requires
  auth + a database), or is this session-only / local-storage for v1?
- **Scope of opening library for v1**: how many openings/variations are
  "enough" to ship, versus an ever-growing library?
- **Multiplayer**: is playing against another human ever in scope, or is
  this strictly single-player vs. the artificial opponent?
