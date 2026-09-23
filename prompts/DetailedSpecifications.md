# Chess Trainer — Detailed Implementation Specification (Learning UX)

This document is a complete, self-contained brief for implementing the
"Learning UX" redesign of the Chess Trainer app. It describes the current
code, the target behavior, the exact data contracts, the order of work, and
how to verify each step. Product-level intent lives in
`prompts/_specs.md` (section "Learning UX — what the user should see");
this file turns it into implementable tasks.

---

## 0. Ground rules for the implementer

- Read `AGENTS.md` first and follow it: strict TypeScript (fix, never
  suppress type errors), prefer Server Components and add `"use client"`
  only where state/browser APIs are needed, reuse `components/ui`
  (`Button`, `Card`, `Badge`) and CSS tokens in `app/globals.css`, shared
  logic in `lib/`, reusable React in `components/`, LF line endings.
- **Do not add an LLM.** All explanations are static or template-generated.
- **Do not add new UI libraries** beyond what is installed (`chess.js`
  1.4.x, `react-chessboard` 5.x, `lucide-react`). `react-chessboard` v5
  uses a single `options` prop — see
  `node_modules/react-chessboard/dist/ChessboardProvider.d.ts` for the
  exact `ChessboardOptions` type (supports `arrows`, `squareStyles`,
  `boardOrientation`, `allowDragging`, `onPieceDrop`, `onSquareClick`).
- **Verify every chess fact with `chess.js`** (FENs, SAN move lists, legal
  moves) using a quick `node -e` script — do not trust hand-computed chess.
  Previous work found several hand-built positions that were illegal
  (king already in check, blocked files, accidental double check).
- Checks before finishing each phase:
  - `npm run typecheck` — must pass.
  - `npm run build` — must pass.
  - `npm run lint` is **currently broken repo-wide** by a pre-existing
    ESLint config issue (circular structure error in `@eslint/eslintrc`).
    Don't spend time on it unless asked; mention it in your summary.
  - Engine service: `cd engine && npm run build` must pass.
- Docker: the user's shell is not in the `docker` group by default; wrap
  docker commands as `sg docker -c "docker compose ..."`. Redeploy with
  `sg docker -c "docker compose up -d --build"` from the repo root.
- Git: commit locally only, **never push** (the user has no push rights to
  the current remote). Configure nothing globally. End commit messages with
  the co-author trailer the harness gives you.

---

## 1. Current state of the code (as of this document)

### Architecture
Two containers via `docker-compose.yml`:
- `web` — Next.js 16 App Router app, port 3000 published.
- `engine` — Node/Express + Stockfish (Debian package, binary at
  `/usr/games/stockfish`, set via `STOCKFISH_BIN`), port 4000, **internal
  only** (never add a `ports:` mapping for it).

`web` reaches `engine` through server-side proxy routes using
`ENGINE_URL=http://engine:4000`.

### Engine (`engine/src/`)
- `stockfish-process.ts` — `StockfishProcess` class wrapping one UCI
  process. `bestMove(fen, elo, movetimeMs=1000)` uses
  `UCI_LimitStrength`/`UCI_Elo` (clamped 1320–3190). `analyze(fen,
  movetimeMs=800)` runs full strength and returns
  `{ fen, bestMove, evalCp, mate }`, with `evalCp`/`mate` normalized to
  **White's perspective**. It parses only `score cp`/`score mate` from
  `info` lines — **it does not yet parse `pv`**.
- `server.ts` — `POST /api/move {fen, elo} → {move}` (UCI string, e.g.
  `e2e4`), `POST /api/analyze {fens: string[]} → {positions: [...]}` (one
  process for the whole request, positions analyzed sequentially),
  `GET /health`.

### Web app
- `app/page.tsx` — Play page (`SiteShell` + `PlayView`).
- `app/openings/page.tsx` (client, list + skill filter),
  `app/openings/[slug]/page.tsx` (server, uses `OpeningViewer`).
- `app/sequences/page.tsx` (client, list + theme filter),
  `app/sequences/[slug]/page.tsx` (server, uses `SequenceStepper`).
- `app/api/engine/move/route.ts`, `app/api/engine/analyze/route.ts` —
  thin proxies to the engine.
- `components/site-shell.tsx` — header/nav/footer.
- `components/chess/`:
  - `board.tsx` — `ChessBoard` wrapper around `react-chessboard`
    (`fen`, `onMoveAttempt(from,to) → boolean`, `boardOrientation`,
    `allowDragging`).
  - `play-view.tsx` — Play: `chess.js` game in a ref, per-move
    `MoveRecord {san, evalCp, mate, quality}` computed live via
    `/api/engine/analyze` after every move; `runningEvalRef` holds the
    current position's eval; skill picker, ELO slider, move list with
    `EvalBadge`, `MaterialCount`, Undo/Resign/New game.
  - `sequence-stepper.tsx` — batch-analyzes all book positions, draggable
    board, "branch" state when the user tries a different move,
    `EvalBadge` + `MaterialCount`.
  - `opening-viewer.tsx` — wraps `move-stepper.tsx` with per-move
    explanations (no engine, no dragging).
  - `move-stepper.tsx` — non-interactive step-through (Start/Back/Next).
  - `eval-badge.tsx`, `material-count.tsx`, `elo-slider.tsx`.
- `lib/chess/`:
  - `review.ts` — `classifyMove(before, after, moverSide)` →
    `best|good|inaccuracy|mistake|blunder` using cp-drop thresholds
    (≤10 / ≤50 / ≤100 / ≤300 / >300) with mate handling;
    `MOVE_QUALITY_LABEL`.
  - `eval-format.ts` — `formatEval(evalCp, mate)` → `"+0.4"`, `"#3"`.
  - `material.ts` — `computeMaterial(fen)` → `{white, black, diff}`.
  - `elo.ts`, `skill-level.ts` (`SKILL_LEVELS`, `SKILL_LEVEL_ORDER`,
    `explanationDepth`), `fen.ts` (`STANDARD_START_FEN`, `sideToMoveOf`),
    `uci.ts` (`parseUciMove`).
- `lib/chess-data/openings.ts` — 8 openings, each with `moves` (12–16
  ply) and aligned `moveExplanations`, plus `summary`, `explanation`,
  `plans`, `level`.
- `lib/chess-data/sequences.ts` — 11 sequences with `startFen`, `moves`,
  aligned `explanations`, `theme`, `level`.
- CSS: everything in `app/globals.css`; quality colors exist as
  `.quality-best|good|inaccuracy|mistake|blunder|neutral`.

### Known issues to fix along the way
- `PlayView.handleUndo` always undoes 2 plies (player + engine). If the
  game ended on the player's move (engine never replied), this removes the
  wrong move. Replace with "Try again" semantics (see §5.3).
- `fetchEval` is duplicated in `play-view.tsx` and `sequence-stepper.tsx`
  — move it to a shared client helper (§3.3).
- Skill level is local state per page; it doesn't carry across pages.

---

## 2. Target experience (summary)

Every mode (Play, Openings, Sequences) uses **one layout**:

```
┌──────────────────────────────────────────────────────────┐
│ WIN BAR:  White 55% ▓▓▓▓▓▓░░░░░ 45% Black               │
├───────────────────────────┬──────────────────────────────┤
│                           │ COACH CARD                   │
│         BOARD             │  ● Mistake  12. Nf6?         │
│  - last move highlighted  │  Leaves the knight on e5     │
│  - green arrow: better    │  undefended.                 │
│    move (after mistake)   │  Better: d6  (green arrow)   │
│  - red arrow: threat      │  [Try again]  [Continue]     │
│                           ├──────────────────────────────┤
│ Material: ♟♟♞  White +3   │ MOVE LIST (colored dots)     │
│ [⏮][◀][▶][⏭] [⇅ Flip]     │ 1. e4 ●   e5 ●               │
│                           │ 2. Nf3 ●  Nf6 ●  ← clickable │
│                           │ [? Legend]                   │
└───────────────────────────┴──────────────────────────────┘
```

On narrow screens (<900px) the right column stacks under the board, coach
card first.

---

## 3. Shared building blocks (Phase 1)

### 3.1 Win-probability conversion — `lib/chess/win-probability.ts`
```ts
export function whiteWinPercent(evalCp: number | null, mate: number | null): number
```
- If `mate !== null`: return `mate > 0 ? 100 : 0` (display clamps to
  99/1, see below).
- If `evalCp === null`: return 50.
- Else: `50 + 50 * (2 / (1 + Math.exp(-0.00368208 * evalCp)) - 1)`.
- Export a `formatWinSplit(pct)` that returns `{ white: number, black:
  number }` rounded to integers and clamped to [1, 99] so the bar never
  looks "over" unless it's mate (for mate show 100/0 with a "Mate in N"
  label).

### 3.2 `components/chess/win-bar.tsx` (client)
Props: `{ evalCp: number | null; mate: number | null; loading?: boolean }`.
- Horizontal bar, full width of the layout, ~28px tall. Left segment
  white (`#f5f5f5` with dark text), right segment dark (`--pb-ink` with
  white text). Width transitions over 400ms (`transition: width`).
- Labels: `White 55%` inside/left, `45% Black` inside/right. If mate:
  `White mates in 3` (or Black).
- `loading` → show the previous value dimmed (opacity 0.5), don't jump to
  50%.
- `aria-label="White 55 percent, Black 45 percent"`, `role="meter"`
  with `aria-valuenow`.

### 3.3 Engine client helper — `lib/chess/engine-client.ts`
Client-safe (no `"use client"` needed; it's plain functions using
`fetch`). Replace both local `fetchEval` copies.
```ts
export type PositionAnalysis = {
  fen: string;
  evalCp: number | null;
  mate: number | null;
  bestMove: string | null;   // UCI
  pv: string[];              // UCI moves, principal variation, may be []
};
export async function analyzePositions(fens: string[]): Promise<PositionAnalysis[]>;
export async function analyzePosition(fen: string): Promise<PositionAnalysis>;
export async function requestEngineMove(fen: string, elo: number): Promise<string | null>;
```
- Throw on non-OK responses; callers show a small error state in the coach
  card ("Engine unavailable — try again").

### 3.4 Engine: return the principal variation
In `engine/src/stockfish-process.ts` `analyze()`:
- Parse `pv <moves...>` from each `info` line alongside the score; keep
  the latest one before `bestmove`. Take at most the first 6 moves.
- Return `pv: string[]` in `AnalyzedPosition`.
- Keep White-perspective normalization for `evalCp`/`mate`.
- Update the `web` side types (`PositionAnalysis`) accordingly.
- Rebuild the engine image.

### 3.5 Move annotation model — `lib/chess/annotate.ts`
A pure function (no React, no fetch) that turns two analyses plus the
played move into everything the UI needs:
```ts
export type MoveAnnotation = {
  ply: number;                 // 1-based
  san: string;
  uci: string;                 // from + to (+ promotion)
  mover: "w" | "b";
  fenBefore: string;
  fenAfter: string;
  before: PositionAnalysis;    // analysis of fenBefore
  after: PositionAnalysis;     // analysis of fenAfter
  quality: MoveQuality;
  bestMoveSan: string | null;  // before.bestMove converted to SAN on fenBefore; null if played move == best
  reason: string;              // one sentence, see 3.6
  threatUci: string | null;    // after.pv[0] if quality is mistake/blunder, else null
};
export function annotateMove(input: {
  ply: number; san: string; uci: string; fenBefore: string; fenAfter: string;
  before: PositionAnalysis; after: PositionAnalysis;
}): MoveAnnotation;
```
- `quality` comes from existing `classifyMove`. Additionally, if the
  played UCI equals `before.bestMove`, force `quality = "best"`.
- Convert UCI → SAN with `chess.js` on `fenBefore` (use `parseUciMove`).

### 3.6 Reason sentences — `lib/chess/reasons.ts`
Template-based, deterministic, using `chess.js` only. Implement detectors
in priority order and return the first match; each returns a short
sentence (≤ 20 words). Use the mover's perspective ("you" is NOT used —
write neutrally: "This move…", "White…").

| # | Detector (checked on `fenAfter` unless stated)                                  | Sentence template |
|---|----------------------------------------------------------------------------------|-------------------|
| 1 | Played move gives checkmate                                                      | "Checkmate!" |
| 2 | `before.mate` favored mover but `after` has no mate for mover                    | "This misses a forced mate — {bestMoveSan} mates in {n}." |
| 3 | `after.mate` favors opponent                                                     | "This allows a forced mate in {n}." |
| 4 | Opponent's best reply (`after.pv[0]`) captures a piece worth ≥3                  | "This leaves the {piece} on {square} to be captured." |
| 5 | Opponent's best reply gives check and then wins material (pv[0] check + pv[2] capture) | "This allows a check that wins material." |
| 6 | Played move captured a piece and quality is best/good                            | "Good capture — it wins material cleanly." |
| 7 | `bestMoveSan` is a capture and played move is not                                | "This misses {bestMoveSan}, which wins material." |
| 8 | quality best/good, move is castling                                              | "Castling gets the king safe and connects the rooks." |
| 9 | quality best/good, fallback                                                      | "A solid move that keeps the position balanced." / "The strongest move here." (for best) |
| 10| quality inaccuracy/mistake/blunder, fallback                                     | "{Label}: {bestMoveSan} was stronger here." |

Piece names: pawn, knight, bishop, rook, queen. Use
`chess.get(square)` to read pieces and `new Chess(fen).move(...)` to play
pv moves; wrap in try/catch and fall through to the next detector on any
error. Unit-test the detectors with a few verified FENs via a `node -e`
script or a small `lib/chess/reasons.check.ts` run with `npx tsx` (don't
add a test framework).

Skill level affects wording only through `explanationDepth` in
`SKILL_LEVELS`: for `"terse"`, drop the leading clause and keep the core
("Misses Qxf7#.", "Hangs the rook on a8.").

### 3.7 Board overlays — extend `components/chess/board.tsx`
Add optional props:
```ts
lastMove?: { from: string; to: string } | null;          // yellow highlight
arrows?: Array<{ from: string; to: string; kind: "best" | "threat" | "idea" }>;
highlightSquares?: Record<string, "hint" | "hanging">;
onSquareClick?: (square: string) => void;                // for click-to-move
```
Map to `react-chessboard` `options.arrows` (`{startSquare, endSquare,
color}`) and `options.squareStyles`. Colors:
- last move: `rgba(255, 213, 79, 0.45)` background on both squares
- best arrow: `rgba(34, 160, 90, 0.85)`
- threat arrow: `rgba(210, 50, 50, 0.85)`
- idea arrow: `rgba(48, 168, 189, 0.85)` (Promptbook blue-dark)
- hint square: `rgba(48, 168, 189, 0.35)`; hanging: `rgba(210, 50, 50, 0.35)`

Also implement **click-to-move** (select a piece, then click a target) in
`ChessBoard` itself so touch users don't have to drag; highlight legal
target squares of the selected piece using `chess.moves({square,
verbose: true})`. `ChessBoard` needs the `fen` to compute this — it
already has it.

### 3.8 Layout — `components/chess/trainer-layout.tsx` (server-compatible)
```tsx
<TrainerLayout
  winBar={<WinBar .../>}
  board={<ChessBoard .../>}
  belowBoard={<>material + nav controls</>}
  coach={<CoachCard .../>}
  sidebar={<MoveList .../>}
/>
```
Pure layout (CSS grid), no state. Replace `.play-view`, `.detail-layout`,
`.move-stepper` usages. CSS class names: `.trainer`, `.trainer-winbar`,
`.trainer-board`, `.trainer-below-board`, `.trainer-coach`,
`.trainer-sidebar`. Board column max width ~560px.

### 3.9 `components/chess/coach-card.tsx` (client)
Props:
```ts
{
  annotation: MoveAnnotation | null;
  loading?: boolean;
  error?: string | null;
  title?: string;                // e.g. "Starting position", opening move title
  body?: string;                 // free text (opening/sequence explanation)
  actions?: Array<{ label: string; onClick: () => void; variant?: ButtonVariant }>;
  showRawEval?: boolean;         // from skill level
}
```
- Header row: quality icon + label (colored pill using existing
  `.quality-*` classes) + move in bold (`12. Nf6?`). Append `!!`/`!`/`?!`/
  `?`/`??` conventionally: best→`!` only if it was the only good move
  (skip for v1: best→none, good→none, inaccuracy→`?!`, mistake→`?`,
  blunder→`??`).
- Reason sentence.
- "Better: **{bestMoveSan}**" line when `bestMoveSan` is set and quality
  is inaccuracy or worse.
- Optional raw eval line when `showRawEval` ("Eval: +0.4 → −1.2").
- Actions row (Buttons from `components/ui`).
- `loading`: skeleton lines; `error`: message + Retry action.
- Icons from `lucide-react`: best `Star`, good `Check`, inaccuracy
  `AlertCircle`, mistake `AlertTriangle`, blunder `XOctagon`.

### 3.10 `components/chess/move-list.tsx` (client)
Props: `{ annotations: Array<MoveAnnotation | { san: string; pending: true }>;
selectedPly: number | null; onSelect(ply: number): void; showRawEval: boolean }`.
- Two columns per move number. Each entry: SAN + a 10px colored dot
  (`.quality-dot.quality-*`), or a pulsing grey dot while pending.
- Raw eval number next to the dot only if `showRawEval`; otherwise in the
  `title` attribute (hover).
- Selected entry highlighted. Keyboard: entries are `<button>`s;
  Left/Right arrow keys on the list move selection.
- Auto-scroll to the latest move.

### 3.11 Legend — `components/chess/legend.tsx`
A `?` button next to the move list that toggles a small popover
explaining: the five dot colors, the win bar, and that numbers are in
pawns from White's view. Show it automatically the first time the user
visits (store a flag in `localStorage` key `chess-trainer:legend-seen`,
wrapped in try/catch).

### 3.12 Shared skill level
`components/chess/skill-level-context.tsx` — React context +
provider storing `SkillLevel`, persisted in `localStorage`
(`chess-trainer:skill-level`, try/catch). Mount the provider in
`components/site-shell.tsx`… but `SiteShell` is a server component, so
create a client `Providers` component and render it inside `SiteShell`
around `children`. Move the skill picker into the header (compact
segmented control) and remove the per-page pickers. Add to
`lib/chess/skill-level.ts`:
```ts
showRawEval: "never" | "hover" | "always";
hintLevels: 1 | 2 | 3;
```
per the table in `_specs.md` (Beginner: never/3, Intermediate: hover/2,
Advanced & Expert: always/1).

**Phase 1 done when:** all building blocks exist, engine returns `pv`,
Play page uses `TrainerLayout` + `WinBar` + `MoveList` + a basic
`CoachCard` for the last move, typecheck/build pass.

---

## 4. Play mode (Phase 2)

File: `components/chess/play-view.tsx` (rewrite).

### 4.1 State
```ts
type PlyRecord =
  | { status: "pending"; ply: number; san: string; uci: string; fenBefore: string; fenAfter: string; mover: "w"|"b" }
  | { status: "done"; annotation: MoveAnnotation };
game: Chess (ref)
plies: PlyRecord[]
analyses: Map<string /*fen*/, PositionAnalysis>   // cache, keyed by FEN
selectedPly: number | null   // null = live position
playerColor: "w" | "b"
status: "playing" | "thinking" | "ended" | "reviewing-mistake"
```
Cache analyses by FEN so `fenBefore` of ply N+1 reuses `fenAfter` of ply
N (one engine call per move, not two).

### 4.2 Flow per player move
1. Apply move to `game` immediately (board updates).
2. Push a pending `PlyRecord`.
3. `analyzePosition(fenAfter)` (fenBefore is already cached; if not,
   analyze both in one `analyzePositions` call).
4. `annotateMove` → replace the pending record.
5. If quality is `mistake` or `blunder`: set status
   `"reviewing-mistake"`, **do not request the engine reply yet**. Coach
   card shows the annotation with actions **Try again** and **Continue**;
   board shows best arrow (green) and threat arrow (red, `threatUci`).
   - Try again → `game.undo()` once, drop the last record, status
     `"playing"`, clear arrows.
   - Continue → status `"thinking"`, request engine move.
6. Otherwise request the engine move right away.
7. Engine moves are annotated the same way but **never** pause play and
   don't take over the coach card (the coach card keeps showing the
   player's last move; engine moves get a dot in the list).

### 4.3 Player color
Add a "Play as: White / Black / Random" control next to the ELO slider
(only enabled before the first move or via New game). If Black, set
`boardOrientation="black"` and request the engine's first move
immediately.

### 4.4 Selecting past moves
Clicking a move in the list sets `selectedPly`; the board shows that
ply's `fenAfter` (read-only, `allowDragging=false`), the coach card shows
that ply's annotation with best/threat arrows, and the win bar shows that
position's eval. A "Back to game" button (and Right-arrow past the last
move) returns to live.

### 4.5 Remove / replace
- Remove the Undo button (replaced by Try again). Keep Resign and New
  game.
- ELO slider stays; skill picker moves to the header (§3.12).

### 4.6 End-of-game summary
When the game ends (mate/draw/resign), the coach card becomes a summary:
- Result sentence (existing text).
- Counts per quality for the **player's** moves (dots + numbers).
- "Accuracy" = share of player moves that are best/good, as a %.
- "Key moments": the 3 player plies with the largest win-% drop
  (computed from `whiteWinPercent` before/after, from the player's side),
  each a link-button that selects that ply (§4.4).
- Buttons: New game, Play again same settings.

---

## 5. Sequences — puzzle mode (Phase 3)

File: `components/chess/sequence-stepper.tsx` → rename/rewrite as
`components/chess/sequence-trainer.tsx`; update
`app/sequences/[slug]/page.tsx`.

### 5.1 Data
In `lib/chess-data/sequences.ts` add to `Sequence`:
```ts
/** Which side the learner plays (the side to move in startFen). Derive, don't store. */
hints: [string, string];   // hint 1 (verbal), hint 2 (verbal, more specific)
```
Write 2 hints per sequence (verbal only; hint level 3 is automatic — the
arrow). The learner plays the moves of the side to move in `startFen`;
the opponent's book moves are played automatically after ~600ms.

### 5.2 Modes
- **Solve** (default): board draggable for the learner's side only.
  - Correct move (SAN equals book move, or engine rates it `best` and
    it's the same UCI as book) → green flash on the destination square,
    coach card shows the book explanation for that step, opponent reply
    auto-plays, continue.
  - Other legal move → analyze it, annotate against the book position,
    coach card shows verdict + reason + "That's not the key move" +
    actions **Try again** (reset to step position) / **Show hint** /
    **Show solution**. Win bar reflects the tried position.
  - Hints escalate per skill level's `hintLevels`: 1 = hint text 1, 2 =
    hint text 2 + highlight the piece to move (`highlightSquares`
    "hint"), 3 = green arrow for the book move.
  - After the final book move: success card ("Solved in N tries, M
    hints"), buttons Next sequence (link to next slug in `SEQUENCES`
    order) and Replay.
- **Watch** (toggle "Show solution"): current behavior — Start/Back/Next
  step through book moves with explanations; board still allows trying
  alternatives (existing branch behavior), win bar + coach card per step.

### 5.3 Evaluation
Batch-analyze all book positions once on mount (existing approach, via
`analyzePositions`). Tried moves are analyzed on demand and cached by FEN.

---

## 6. Openings — idea arrows + quiz (Phase 4)

Files: `components/chess/opening-viewer.tsx` (rewrite as
`opening-trainer.tsx`), `lib/chess-data/openings.ts`.

### 6.1 Data additions
Per opening add optional, **per-move aligned** arrows:
```ts
moveIdeas?: Array<Array<{ from: string; to: string }> | null>;  // same length as moves
```
Fill at least the first 6 plies of each opening with 1–2 "idea" arrows
(e.g. Italian `Bc4` → arrow c4→f7). Verify every square is sensible with
chess.js (the from-square should hold the piece just moved or a piece it
now supports).

### 6.2 Learn mode (default)
Step-through (Start/Back/Next, keyboard arrows) with:
- coach card: title = move (`5. Bc4`), body = `moveExplanations[i]`;
- board: last-move highlight + idea arrows;
- win bar: batch-analyze all positions of the line once (engine), so the
  learner sees the opening stays roughly balanced;
- overall `explanation` and `plans` in a collapsible "About this opening"
  card in the sidebar.

### 6.3 Quiz mode (toggle "Quiz me")
- Choose side: White / Black (default White).
- The board shows the position; the learner must play the next move of
  their side; opponent moves auto-play.
- Correct → green flash, coach shows explanation, continue.
- Wrong but legal → board snaps back, coach says "Not the book move —
  try again" (no engine verdict needed; optionally show the engine
  verdict at Advanced+), attempts counter increments. After 2 wrong
  attempts, show the move as an arrow.
- End: "Line complete — N/M first-try correct", buttons Retry / Next
  opening.

---

## 7. Styling notes

- Add all new CSS to `app/globals.css`, grouped under a
  `/* Trainer layout */` comment. Reuse tokens (`--pb-ink`, `--pb-muted`,
  `--pb-border`, `--pb-light`, `--pb-blue-dark`, `--pb-green-dark`).
- Quality palette (keep consistent everywhere): best/good green
  `#177d6d`, inaccuracy `#16758a` → change to amber-ish yellow
  `#a07a00` on `rgba(255, 213, 79, 0.25)` so "inaccuracy" no longer looks
  like brand blue, mistake orange `#9a5a12`, blunder red `#9a1f1f`.
  Update `.quality-inaccuracy` accordingly and add `.quality-dot`.
- Motion: win bar width 400ms ease; green success flash 500ms on the
  destination square (via `squareStyles`, cleared by timeout).
- Respect `prefers-reduced-motion`: disable the transitions.
- Mobile: board full width, win bar above, coach card directly under the
  board, move list collapsed behind a "Moves" disclosure.

---

## 8. Accessibility

- Win bar `role="meter"` with a readable `aria-label`.
- Coach card is an `aria-live="polite"` region so screen readers hear the
  verdict after each move.
- All actions are real `<button>`s; move list navigable by keyboard.
- Don't rely on color alone: the quality label text and icon always
  accompany the color.

---

## 9. Out of scope (do not implement)

- Persistence beyond `localStorage` flags/skill level (no DB, no auth).
- LLM explanations.
- Multiplayer.
- ELO below 1320 (spec mentions 200+, but Stockfish's `UCI_Elo` minimum
  is 1320; leave the slider range as is and note it in your summary).
- New opening/sequence content beyond hints and idea arrows.

---

## 10. Phase checklist and acceptance criteria

Work in this order; commit (locally) after each phase with a clear
message.

**Phase 1 — Building blocks**
- [ ] Engine returns `pv` (≤6 UCI moves); `curl` via
      `http://localhost:3000/api/engine/analyze` shows it.
- [ ] `win-probability.ts`, `engine-client.ts`, `annotate.ts`,
      `reasons.ts` exist; detectors checked against verified FENs
      (include at least: a hanging-queen position, a missed mate-in-1,
      a castling move).
- [ ] `ChessBoard` supports last-move highlight, arrows, square
      highlights, click-to-move.
- [ ] `TrainerLayout`, `WinBar`, `CoachCard`, `MoveList`, `Legend`,
      skill-level context in the header.

**Phase 2 — Play**
- [ ] Win bar moves after every ply; move list shows colored dots.
- [ ] A blunder pauses play, shows reason + better move + arrows; Try
      again restores the previous position; Continue lets the engine
      reply.
- [ ] Clicking a past move shows that position and its annotation.
- [ ] Play as Black works (engine opens, board flipped).
- [ ] End-of-game summary with accuracy and 3 key-moment links.

**Phase 3 — Sequences**
- [ ] Solve mode is default; correct moves advance with auto-played
      replies; wrong moves get a verdict and Try again.
- [ ] Hints escalate according to skill level; hint 3 shows the arrow.
- [ ] Watch mode still steps the book line with explanations.
- [ ] Every sequence has 2 hints.

**Phase 4 — Openings**
- [ ] Learn mode shows per-move explanation in the coach card + idea
      arrows + win bar.
- [ ] Quiz mode for White and Black, with first-try score.

**Every phase**
- [ ] `npm run typecheck`, `npm run build`, `cd engine && npm run
      build` pass.
- [ ] `sg docker -c "docker compose up -d --build"`; pages `/`,
      `/openings`, `/openings/italian-game`, `/sequences`,
      `/sequences/knight-fork` return 200; engine port 4000 is **not**
      reachable from the host.
- [ ] Manually exercise the golden path in a browser (or state clearly
      that you couldn't).

---

## 11. Reporting back

At the end, report: what was built per phase, anything skipped and why,
the lint situation, any chess content you changed (with how you verified
it), and anything in this document that turned out to be wrong.
