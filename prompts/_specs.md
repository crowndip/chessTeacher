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
  or presets with 100 ELO steps from 200 to 2400+ , not just fixed
  "easy/medium/hard" buckets.
- Player can choose to play White, Black, or random.
- **Every move is recorded live, with its evaluation shown immediately next
  to it in the move list** — not only in a post-game summary. As soon as a
  move (by either side) is played, the engine evaluates the resulting
  position and that number is printed alongside the move, so the player can
  see right away whether their move was good or bad, and by how much,
  without waiting for the game to end. The number is **colored** to match
  the move-quality verdict (e.g. green for best/good, yellow for
  inaccuracy, orange for mistake, red for blunder) so quality reads at a
  glance without parsing the raw number.
- Post-move feedback in plain language too: was the move a blunder/
  mistake/inaccuracy/good/best, derived from the same evaluation.
- **Material count**: the current piece count for each side (or the
  material difference, e.g. "+3 White") shown next to the board, updating
  as pieces are captured — a quick sanity check alongside the engine
  evaluation.
- Ability to undo a move / take back and try again (useful for learners).
- Game state persists across a session at minimum (reload-safe is a nice-to-have).

### 2. Sample chess sequences with explanations

- A curated set of short tactical/strategic sequences, covering both the
  fundamentals and more advanced tactics, e.g.: forks, pins, skewers,
  discovered attacks, back-rank mates, common endgame patterns like
  king+pawn vs king, Lucena/Philidor positions — plus **advanced tactics**
  such as deflection, decoy, zwischenzug (in-between move), removing the
  defender, x-ray attacks, windmills, and classic sacrificial patterns
  (e.g. the Greek gift Bxh7+).
- Each sequence includes: a title, the starting position (FEN), the move
  sequence, and a plain-language explanation of the idea at each key step.
- Sequences tagged by difficulty (beginner/intermediate/advanced) and by
  theme (tactics, endgame, positional, checkmate patterns).
- User can step through a sequence move-by-move on the board (like a replay/
  puzzle viewer), not just read static text.
- **At each step, the user can try a different move than the recorded one**
  instead of only replaying it — drag any legal move on the board. The
  position's evaluation is always visible (not just after deviating), shown
  as the same **colored number** used in Play, and updates live to reflect
  whatever move was actually played, so the user can directly compare how
  their own idea changes the evaluation versus the book move, then return
  to the recorded line to keep stepping through it.
- Material count is shown here too, for the same at-a-glance sanity check.

### 3. Opening move library

- Library of named openings and variations (e.g. Italian Game, Sicilian
  Defense — Najdorf, Queen's Gambit Declined, King's Indian Defense, etc.).
- **Each entry shows the full opening line**, not just the first move or
  two — a realistic main line played out to a natural resting point (roughly
  10–20 ply), not a truncated preview.
- **Every move in the line has its own explanation**, the same way sample
  sequences do: stepping through the opening move-by-move shows why that
  specific move was chosen at that point (the idea, the threat it meets or
  creates, the plan it serves), not just one summary paragraph for the
  whole opening. The existing overall "idea" summary and White/Black plans
  stay too, as a higher-level framing around the per-move notes.
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

## Decisions made

- **Chess engine**: a dedicated Stockfish container (not client-side WASM),
  so ELO limiting is server-authoritative. Uses `UCI_LimitStrength` +
  `UCI_Elo` (range 1320–3190) for play, and full-strength analysis for
  evaluations/Game Review. No LLM involved in engine play or evaluation.
- **Explanation source**: static, hand-authored content bundled with the
  app (no LLM at runtime) — this now extends to per-move explanations for
  both the opening library and sample sequences, not just one summary per
  entry.
- **Persistence**: none for v1 — session/local component state only, no
  database, no auth. Revisit if saved progress across devices becomes a
  real requirement.
- **Multiplayer**: out of scope — single-player vs. the artificial
  opponent only.
- **Evaluation display**: a colored number (not a bar), color mapped to
  the move-quality verdict — used identically in Play's move list and in
  the always-visible sequence evaluation. Material count (piece
  count/difference per side) is shown alongside it in both places.

## Open questions / decisions needed before implementation

- **Scope of opening library for v1**: how many openings/variations are
  "enough" to ship, versus an ever-growing library — now a bigger question
  since each one needs a full, per-move-annotated line rather than a short
  preview.
- **"Try a different move" in sequences**: once the user deviates from the
  recorded line, do they need an explicit "back to book line" action, or
  does simply continuing play organically diverge (with no more scripted
  explanations, just evaluations) until they reset the sequence?
