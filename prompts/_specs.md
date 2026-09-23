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
- **Win-probability indicator**: a single, always-visible summary of the
  *current* position's standing next to the board — e.g. "White 55% —
  Black 45%" (as a bar or a pair of percentages) — converted from the same
  centipawn evaluation used for the per-move numbers. This is distinct
  from, and in addition to, the per-move colored numbers in the move list:
  the move-list numbers are always in White's-perspective pawn units and
  colored by move quality (which needs a legend to read correctly), while
  this indicator is a single glance-able "who's better, right now" summary
  that doesn't require interpreting a signed decimal or a color code.
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
- The same win-probability indicator as Play is shown here too, reflecting
  whatever position is currently on the board (book line or a tried move).

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

## Learning UX — what the user should see

### Problems with the current GUI

- **Numbers without meaning.** The move list shows `+0.4`, `-0.7` with a
  color, but nothing says what the number is, whose perspective it's from,
  or what the color means. A learner can't turn it into a lesson.
- **Verdict without reason.** A red number says "bad" but not *why* or
  *what was better*. The engine already returns the best move — we throw it
  away.
- **Feedback is buried in a side list.** The learner's eyes are on the
  board; the verdict appears in a small list on the right, one line among
  many.
- **No "try again".** After a mistake the only options are Undo (which
  also removes the engine's reply, silently) or play on. Learning happens
  when you retry the position, not when you read about it.
- **Three pages, three different layouts** for the same activity (look at
  a board, step moves, read a note). Every page makes the user relearn
  where things are.

### Principles

1. **One screen layout everywhere** (Play, Openings, Sequences):
   board on the left, a single "coach panel" on the right. Same places,
   same controls.
2. **Feedback lives next to the board, not in a list.** The most recent
   move's verdict is the biggest thing in the coach panel.
3. **Every verdict comes with a reason and an alternative** — "Mistake:
   this lets Black fork your king and rook. Better was Nd2."
4. **Show on the board, not just in text** — arrows and square highlights
   for the best move, the threat, the hanging piece.
5. **Retrying beats reading.** After a mistake, offer "Try again" that
   resets to the position before the move.
6. **Progressive disclosure by skill level** — beginners see words and
   arrows; experts can also see numbers and engine lines.

### The screen (applies to all three modes)

```
┌───────────────────────────┬──────────────────────────────┐
│ [Black 45% ▓▓▓▓░░░░ 55% White]  ← win-probability bar    │
│                           │  COACH PANEL                 │
│                           │  ┌────────────────────────┐  │
│        BOARD              │  │ ● Mistake   Nf6?       │  │
│   (last move highlighted, │  │ Leaves e5 undefended — │  │
│    best-move arrow shown  │  │ White wins a pawn.     │  │
│    after a mistake)       │  │ Better: ...d6 (arrow)  │  │
│                           │  │ [Try again] [Continue] │  │
│                           │  └────────────────────────┘  │
│ Material: White +1        │  Move list (compact)         │
│ [◀ Back] [Next ▶] [Flip]  │  1. e4 ●  e5 ●               │
│                           │  2. Nf3 ● Nf6 ●              │
└───────────────────────────┴──────────────────────────────┘
```

- **Win-probability bar** above (or beside) the board, full width —
  the one-glance "who's better" answer. Animates as it changes so a big
  swing is *felt*, not just read.
- **Board**: highlight the last move's from/to squares; after a
  mistake/blunder draw the engine's better move as a green arrow and, when
  known, the opponent's threat as a red arrow.
- **Coach panel card** (the focus of attention): quality label with icon
  + color, the move played, a one-sentence reason, and the better move.
  Actions: **Try again** (return to the position before this move) and
  **Continue**.
- **Move list**: compact, colored dots (not raw numbers) by default;
  clicking any move jumps the board to that position and shows its coach
  card. Numbers appear on hover / for Advanced+ levels.
- **Material count** under the board, as captured-piece icons plus the
  difference ("+1").
- **Legend** available one click away (what the colors mean, what the bar
  means), shown automatically the first time.

### Per mode

- **Play**: coach card updates after every *player* move (the engine's
  moves get a dot in the list but don't interrupt). At game end, a summary
  card: counts of best/good/inaccuracy/mistake/blunder, and the 3 biggest
  swings as clickable "review this moment" links.
- **Sequences (puzzle mode)**: default is *solve it yourself* — the user
  must find the key move; hints escalate (1: "look for a check", 2:
  highlight the piece to move, 3: show the arrow). Wrong move → bar
  swings, coach says why it fails, **Try again**. "Show solution" steps
  through the book line with explanations, as today.
- **Openings**: the coach card shows the per-move explanation; the board
  arrows show the *idea* (e.g. the bishop's diagonal at f7). A **Quiz me**
  toggle hides the next move and asks the user to play it — the fastest
  way to memorize a line.

### What each skill level sees

| Element                     | Beginner | Intermediate | Advanced/Expert |
|-----------------------------|----------|--------------|-----------------|
| Win-probability bar         | yes      | yes          | yes             |
| Coach card reason sentence  | yes      | yes          | yes (terser)    |
| Best-move arrow on mistake  | yes      | yes          | yes             |
| Move-list colored dots      | yes      | yes          | yes             |
| Raw eval numbers            | no       | on hover     | always          |
| Engine top line (PV)        | no       | no           | on request      |
| Hints in puzzles            | 3 levels | 2 levels     | 1 level         |

### Data this requires from the engine

The engine's `/api/analyze` already returns `bestMove`; to support the
coach card it should also return the principal variation (a few moves) so
the reason sentence and the threat arrow can be generated. Reason
sentences can be template-based from simple detectors (piece left
hanging, missed capture, allowed a check/fork, missed mate) — no LLM
needed, consistent with the static-content decision.

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
- **Evaluation display**: two complementary pieces, not one. (1) A colored
  marker per move in Play's move list / the sequence step view — color
  mapped to the move-quality verdict; the raw number (White's-perspective
  pawn units) is shown by skill level per the "Learning UX" table. (2) A single **win-probability indicator** next to the board
  ("White NN% — Black NN%"), reflecting the *current* position only (not
  per move), using the standard sigmoid conversion from centipawns to a
  win-percentage estimate (the same approach Lichess/chess.com use):
  `whiteWinPct = 50 + 50 * (2 / (1 + exp(-0.00368 * centipawns)) - 1)`,
  clamped near 0%/100% once a forced mate is found. Material count is
  shown alongside both, in both Play and Sequences.

## Open questions / decisions needed before implementation

- **Scope of opening library for v1**: how many openings/variations are
  "enough" to ship, versus an ever-growing library — now a bigger question
  since each one needs a full, per-move-annotated line rather than a short
  preview.
- **"Try a different move" in sequences**: once the user deviates from the
  recorded line, do they need an explicit "back to book line" action, or
  does simply continuing play organically diverge (with no more scripted
  explanations, just evaluations) until they reset the sequence?
