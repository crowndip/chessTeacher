# "Exercise" Feature — Implementation Plan

## 0. The ask

On a sequence detail page (`/sequences/[slug]`), add an **"Exercise"**
button. Clicking it makes the app call Lichess's live Puzzle API, right
then, to fetch one random puzzle tagged with the same tactical theme as
the sequence being viewed, and lets the user try to solve it in the
existing puzzle ("solve") mode. **If the call fails for any reason, no
exercise is shown — the rest of the page (the static sequence, its
Watch/Solve modes, everything else in the app) works exactly as before.**
This is a real-time integration, not a bundled/ingested dataset — that
was the direction of the previous draft of this document; this version
replaces it per direct instruction.

This document reflects **empirically verified facts** about the Lichess
API (endpoints called live, responses inspected, a corrected FEN-recovery
algorithm proven against real puzzle data with `chess.js`), not
assumptions — see §1–§3. This is a design/planning document only; nothing
here is implemented yet.

## 1. What was verified, and how

All of the following was checked directly against `lichess.org` (not
guessed), on 2026-09-23:

```bash
curl "https://lichess.org/api/puzzle/next?angle=fork"
curl "https://lichess.org/api/puzzle/batch/pin?nb=1"
curl "https://lichess.org/api/puzzle/next?angle=zwischenzug"        # invalid theme, on purpose
curl "https://lichess.org/api/puzzle/next?angle=intermezzo&difficulty=hardest"
curl "https://raw.githubusercontent.com/ornicar/lila/master/translation/source/puzzleTheme.xml"
curl "https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/puzzles/api-puzzle-next.yaml"
```

Findings:

1. **`GET /api/puzzle/next?angle=<theme>` requires no authentication in
   practice**, despite the OpenAPI spec listing `security: [OAuth2:
   ["puzzle:read"]]` for it. A plain unauthenticated request returns
   `200` with a real puzzle. (Authentication, if added later, only
   changes one thing: Lichess would then avoid repeating puzzles the
   logged-in user has already seen. Not needed for this feature.)
2. **An invalid/unknown `angle` value does not error.** Requesting
   `angle=zwischenzug` (not a real Lichess theme key — see §2) returned
   `200` with a puzzle themed `["short","advantage","endgame"]` — i.e.
   Lichess silently ignored the bad filter and returned an unrelated
   puzzle. **The app must not trust the `angle` request parameter alone —
   it must check the returned puzzle's own `themes` array actually
   contains the theme it asked for, and treat a mismatch as a failure.**
3. **The response has no `fen` field for `/api/puzzle/next` or
   `/api/puzzle/batch/*`.** It returns `game.pgn` (the full source game,
   as space-separated SAN, no move numbers) and `puzzle.initialPly`. The
   puzzle's actual starting position has to be derived by replaying the
   PGN. (Oddly, `/api/puzzle/daily` *does* include an explicit `fen` field
   alongside the same `pgn`/`initialPly` — the two endpoints aren't
   consistent. Don't rely on `fen` being present; always derive it.)
4. **The correct derivation, proven against two real puzzles with
   `chess.js` (one of them a mate-in-2, confirmed to actually reach
   `chess.isCheckmate() === true`):**
   ```
   replay game.pgn move-by-move, through and including index `initialPly`
   (i.e. play initialPly + 1 SAN moves from the start)
   → that resulting position's FEN is where the puzzle begins.
   puzzle.solution (UCI moves) is then played from there, alternating:
   solution[0] = the solver's move, solution[1] = the opponent's automatic
   reply, solution[2] = the solver's next move, and so on. The whole
   array belongs to the puzzle - nothing in `solution` is a "setup" move
   to skip.
   ```
   (My first pass at this got it wrong — I initially assumed the first
   `solution` move was the opponent's setup move, based on general
   recollection rather than verification. Testing against real data
   showed the setup move is actually the *last move of the PGN itself*,
   included when deriving the FEN, and `solution[0]` is 100% the solver's
   own move. Recorded here so the same mistake doesn't get repeated.)
5. **`difficulty` is a relative enum, not a numeric target**: one of
   `easiest | easier | normal | harder | hardest`, "relative to the
   authenticated user's puzzle rating, or 1500 if anonymous." This maps
   cleanly onto the app's existing skill levels (§5) with no need to
   maintain our own rating-band table.
6. **Rate limiting**: no puzzle-specific limit is documented, but the
   general API policy applies — "only make one request at a time," back
   off on HTTP `429` (Lichess's own guidance: waiting a minute is usually
   enough). The docs separately warn that *unauthenticated* endpoints in
   general can be "heavily rate-limited" under load (that specific warning
   is written under the Broadcasts section, not Puzzles, but the
   unauthenticated-traffic caution is a general Lichess policy worth
   designing for regardless). This app's use case — a single on-click
   request, not enumeration or bulk download — is exactly the kind of
   usage the Lichess docs ask for ("**DO NOT** use this endpoint to
   enumerate puzzles for mass download" is a warning aimed at bulk
   scraping, not at this feature).
7. **CORS is wide open** (`Access-Control-Allow-Origin: '*'`) — the
   endpoint could technically be called straight from the browser. This
   plan still recommends calling it from a Next.js server route instead
   (§6), to keep the FEN-derivation, theme-verification, and
   explanation-generation logic server-side and consistent with how
   `/api/engine/*` already works.

## 2. Verified theme mapping

Pulled the real theme key list from
[`puzzleTheme.xml`](https://github.com/ornicar/lila/blob/master/translation/source/puzzleTheme.xml)
(the same file the OpenAPI spec points to) and matched it against this
app's 15 sequences:

| This app's sequence | Lichess `angle` | Note |
|---|---|---|
| knight-fork | `fork` | exact |
| absolute-pin | `pin` | exact |
| skewer | `skewer` | exact |
| back-rank-mate | `backRankMate` | exact |
| smothered-mate | `smotheredMate` | exact |
| discovered-check | `discoveredCheck` | exact — note Lichess also has a separate, broader `discoveredAttack` tag; `discoveredCheck` is the precise match |
| deflection | `deflection` | exact |
| overload | `deflection` | **Lichess has no separate "overloading" tag** — its own theme description literally says: *"A move that distracts an opposing piece from another duty it performs... Sometimes also called 'overloading'."* Overload and deflection share one Lichess theme. |
| zwischenzug | `intermezzo` | Lichess uses the Italian/English term "intermezzo," not "zwischenzug" — confirmed via a live request (§1.2's control test used the wrong guess on purpose to prove this) |
| removing-the-defender | `capturingDefender` | exact |
| decoy | `attraction` | Lichess's term is "attraction," not "decoy" |
| anastasias-mate | `anastasiaMate` | exact |
| bodens-mate | `bodenMate` | exact (singular, not "bodensMate") |
| kings-in-opposition | *(none)* | no matching theme exists — king opposition is endgame theory, not a tactical puzzle motif; confirmed absent from the full theme list |
| greek-gift | *(none)* | no exact tag; closest would be combining `sacrifice` + `kingsideAttack`, which isn't a single reliable `angle` value — not attempted in v1 |

**13 of 15 motifs have a real, verified match.** The other 2
(`kings-in-opposition`, `greek-gift`) simply don't render an "Exercise"
button — that's a client-side decision based on whether `motif` maps to
a known `angle`, not a failure state.

Add the mapping to `lib/chess-data/sequences.ts`:

```ts
export type SequenceMotif =
  | "fork" | "pin" | "skewer" | "backRankMate" | "smotheredMate"
  | "discoveredCheck" | "deflection" | "intermezzo" | "capturingDefender"
  | "attraction" | "anastasiaMate" | "bodenMate";
// Lichess "angle" values, used directly - no separate translation table needed.

export type Sequence = {
  // ...existing fields...
  /** Lichess puzzle theme ("angle") to pull exercises from. Absent = no Exercise button for this sequence. */
  motif?: SequenceMotif;
};
```

Using Lichess's own tag strings as the type, rather than inventing
separate internal names and a translation layer, avoids a whole class of
the "did I spell the tag right" bugs this plan's earlier draft was
worried about.

## 3. Difficulty mapping

```ts
const DIFFICULTY_BY_SKILL_LEVEL: Record<SkillLevel, "easiest" | "easier" | "normal" | "harder" | "hardest"> = {
  beginner: "easiest",
  intermediate: "easier",
  advanced: "harder",
  expert: "hardest",
};
```

No dataset, no rating-band table to maintain — Lichess's own relative
difficulty enum does this directly.

## 4. What this removes from the previous draft

The whole ingestion pipeline (a maintainer-run script downloading and
filtering the multi-gigabyte puzzle CSV dump, a bundled JSON data file
committed to the repo, periodic manual re-runs to refresh it) is gone.
There is no local puzzle dataset at all. Every "Exercise" click is a live
call. Trade-off, explicitly: this is simpler to build and always fresh,
but depends on Lichess being reachable at the moment of the click — which
is exactly why graceful failure (§7) is a hard requirement, not a nice
extra.

## 5. Explanations — unchanged from the previous draft's plan

Lichess doesn't provide prose explanations either way. Reuse
`lib/chess/reasons.ts`'s `explainMove()` — the same engine-backed,
template-based explanation logic already used for live Play and for wrong
moves in the static Sequences puzzle mode — to generate each step's coach
card text from the engine's own before/after analysis. No authored text
per puzzle, no LLM.

## 6. Request flow

New route: `app/api/exercise/route.ts` — `POST { motif, skillLevel } →`
either `{ startFen, moves, explanations }` (200) or an explicit failure
shape (see §7), never a thrown/opaque 500 the client has to guess about.

Server-side steps, any one of which failing aborts to the failure path:

1. Look up `angle` and `difficulty` for the request's `motif`/`skillLevel`
   (§2, §3). If `motif` isn't in the known list, this is a client bug
   (the button shouldn't have been rendered) — fail immediately.
2. `GET https://lichess.org/api/puzzle/next?angle=<angle>&difficulty=<difficulty>`
   with a short timeout (e.g. 5s) and no retry loop — one attempt, per
   Lichess's "only make one request at a time" guidance and this
   feature's own "just don't show it if it fails" requirement.
3. Non-`200` response (including `429`) → fail.
4. **Verify `puzzle.themes.includes(angle)`** (§1.2) → fail if absent.
5. Derive the start FEN via the algorithm in §1.4, using `chess.js`:
   replay `game.pgn` through `initialPly` inclusive. If any PGN move
   fails to parse/play → fail (defense in depth — this also protects
   against Lichess ever changing the PGN format under us).
6. Replay `puzzle.solution` (UCI) from that FEN, converting to SAN via
   `chess.js` as it goes (reusing `parseUciMove`, already in
   `lib/chess/uci.ts`). If any move is illegal → fail.
7. Call the engine (`analyzePositions`, already in
   `lib/chess/engine-client.ts`) on each position along the derived line,
   and generate each step's explanation with `explainMove()` (§5). If the
   engine is unreachable, this is **not** a hard failure — fall back to a
   generic per-step message (`reasons.ts` already has a generic fallback
   sentence for exactly this situation) rather than discarding a
   perfectly good puzzle just because the "why" text couldn't be
   generated.
8. Return the shaped result, in exactly the shape `SequenceTrainer`
   already consumes — **no changes needed to `SequenceTrainer` itself.**

## 7. Failure handling (this is the point of the feature, per the ask)

- **The "Exercise" button itself only renders when `sequence.motif` is
  set** — for `kings-in-opposition` and `greek-gift`, there's no button
  at all, not a button that then fails.
- Any failure in steps 1–6 of §6 → the API route returns `{ ok: false }`
  (or a `4xx`/`5xx` the client treats uniformly as "unavailable"). The
  client shows a small, calm message in place of the exercise ("Couldn't
  fetch an exercise right now — try again") and otherwise changes
  **nothing else on the page**. The static sequence, its Watch/Solve
  mode, the rest of the site — all keep working, exactly as the ask
  states.
- No retries against Lichess from the server automatically. "New
  exercise" / "Try again" is a user-initiated new request, not an
  automatic loop — avoids hammering Lichess on a bad connection.
- Client-side timeout on the fetch to the app's own `/api/exercise` route
  too, so a hung request doesn't leave the "loading" coach-card state
  spinning forever.

## 8. UI changes

- `app/sequences/[slug]/page.tsx` still needs the small client-wrapper
  split noted in the prior draft: a component can't call `useSkillLevel()`
  in its own body while also being the one that renders `<SiteShell>`
  above it — that hook call has to live in a genuine child component.
- Sidebar: "Exercise" button (only when `sequence.motif` is set).
  - Click → `CoachCard loading` state (already built) → `POST
    /api/exercise`.
  - Success → swap the board over to `SequenceTrainer`, fed with the
    returned `startFen`/`moves`/`explanations`, same as the static
    sequence's own data shape.
  - Failure → calm inline message, no state change to the rest of the
    page (§7).
  - "New exercise" button next to it once one is showing, to pull another.
  - "Back to the example" returns to the original static sequence.

## 9. Explicitly out of scope for v1

- Any local puzzle dataset, ingestion script, or offline curation step —
  this version is 100% live, per §4.
- Authenticating to Lichess (OAuth) — not needed; anonymous access works
  for this use case (§1.1). Would only matter if avoiding repeat puzzles
  across a user's whole history became a requirement.
- `greek-gift` and `kings-in-opposition` exercises — no matching Lichess
  theme exists (§2).
- Any server-side retry/backoff loop against Lichess — one attempt per
  user click, per §7.
- Caching/prefetching puzzles ahead of the click (would reduce perceived
  latency on "New exercise," at the cost of needing some kind of
  short-lived server-side cache — worth revisiting only if the plain
  live-call latency turns out to be a real problem in practice).

## 10. Verification plan (for whoever implements this)

- Re-run the exact `curl` commands in §1 before writing any code, to
  confirm nothing about the API has changed since this document was
  written (2026-09-23).
- Write a throwaway `npx tsx` script (same pattern used throughout this
  app's content work) that: calls `/api/puzzle/next` for each of the 13
  mapped `angle` values in §2, derives the FEN per §1.4, replays the full
  solution, and asserts every one is legal — and that puzzles tagged with
  a `Mate`-style theme actually end in `chess.isCheckmate()`. Run it
  several times per theme (puzzles are random) to build confidence the
  derivation algorithm holds generally, not just for the 2 samples
  checked by hand in §1.
- Deliberately test the failure path: point the app at an unreachable
  host (or unplug the network) and confirm the "Exercise" button degrades
  to the calm failure message in §7 without affecting anything else on
  the page.
- `npm run typecheck` / `npm run build` must pass.
- No automated browser testing exists in this repo; manually click
  "Exercise" → solve it → "New exercise" → confirms a different position
  → "Back to the example," and manually trigger a failure (e.g. via
  browser devtools network throttling/blocking) to see the graceful
  degradation, in a real browser before calling this done.
