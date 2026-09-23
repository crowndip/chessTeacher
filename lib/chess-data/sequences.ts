import type { SkillLevel } from "@/lib/chess/skill-level";

export type SequenceTheme = "tactics" | "checkmate-patterns" | "endgame" | "positional";

export type Sequence = {
  slug: string;
  title: string;
  theme: SequenceTheme;
  level: SkillLevel;
  summary: string;
  /** FEN of the position the sequence starts from. */
  startFen: string;
  /** SAN moves to step through, one at a time. */
  moves: string[];
  /** Explanation shown after each move in `moves`, same length as `moves`. */
  explanations: string[];
  /** Two escalating verbal hints for puzzle (solve) mode. A 3rd, automatic hint shows the move as an arrow. */
  hints: [string, string];
};

export const SEQUENCES: Sequence[] = [
  {
    slug: "knight-fork",
    title: "Knight Fork",
    theme: "tactics",
    level: "beginner",
    summary: "A knight jumps to a square where it attacks the king and a rook at the same time.",
    startFen: "r3k3/8/8/1N6/8/8/8/6K1 w - - 0 1",
    moves: ["Nc7+", "Kd8", "Nxa8"],
    explanations: [
      "The knight jumps to c7, forking the king and the rook. A fork is when one piece attacks two valuable targets at once — the opponent can only save one.",
      "Black has no way to save both pieces and must move the king out of check.",
      "White simply captures the rook, coming out a full rook ahead.",
    ],
    hints: ["Look for a knight move that gives check.", "The knight can jump to c7 — what does that attack?"],
  },
  {
    slug: "absolute-pin",
    title: "Absolute Pin",
    theme: "tactics",
    level: "beginner",
    summary: "A pinned piece can't move without exposing its own king to check — so it can be won for free.",
    startFen: "4k3/8/2n5/1B6/8/8/8/4K3 w - - 0 1",
    moves: ["Bxc6+", "Kd8"],
    explanations: [
      "The knight on c6 was pinned to the king along the b5–e8 diagonal, so it could never move to block or capture the bishop. White simply takes it, with check.",
      "Black has to step the king out of check. White is now a full piece ahead — this is why pinned pieces are often not really 'defending' anything.",
    ],
    hints: [
      "The black knight is pinned and can't move — is it defended by anything else?",
      "Capture on c6 with check.",
    ],
  },
  {
    slug: "back-rank-mate",
    title: "Back-Rank Mate",
    theme: "checkmate-patterns",
    level: "beginner",
    summary: "A king trapped behind its own pawns can be mated by a rook or queen along the back rank.",
    startFen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
    moves: ["Ra8#"],
    explanations: [
      "Black's own pawns on f7, g7 and h7 block every escape square. With the a-file completely open and nothing able to block or capture on a8, the rook delivers checkmate along the back rank — watch out for this pattern in almost every endgame.",
    ],
    hints: ["Black's king has no escape squares — look at the back rank.", "Move your rook all the way to a8."],
  },
  {
    slug: "smothered-mate",
    title: "Smothered Mate",
    theme: "checkmate-patterns",
    level: "advanced",
    summary: "A knight delivers mate to a king that is completely boxed in by its own pieces.",
    startFen: "6rk/6pp/3N4/8/8/8/8/6K1 w - - 0 1",
    moves: ["Nf7#"],
    explanations: [
      "Black's own rook and pawns occupy every square around the king, so it has no flight squares — and nothing on the board can capture a knight on f7. This 'smothered mate' pattern, often set up with a queen sacrifice, is one of the most famous in chess.",
    ],
    hints: ["The black king is completely boxed in by its own pieces.", "Jump the knight to f7."],
  },
  {
    slug: "kings-in-opposition",
    title: "The Opposition",
    theme: "endgame",
    level: "intermediate",
    summary: "Kings can never stand next to each other — learning to use that rule is the foundation of king-and-pawn endgames.",
    startFen: "8/4k3/8/4K3/8/8/8/8 w - - 0 1",
    moves: ["Kd5"],
    explanations: [
      "White can't play Ke6 — kings are never allowed to stand adjacent to each other. Instead White sidesteps to d5, waiting for a moment to advance. Whoever is forced to give way first when the kings face off is said to have 'lost the opposition' — a key idea in almost every king-and-pawn endgame.",
    ],
    hints: [
      "You can't move directly toward the enemy king — think about keeping a safe distance while gaining ground.",
      "Step the king sideways to d5.",
    ],
  },
  {
    slug: "discovered-check",
    title: "Discovered Check",
    theme: "tactics",
    level: "intermediate",
    summary: "Moving one piece out of the way can reveal a check from a piece behind it.",
    startFen: "8/8/7k/8/8/8/3N4/2B3K1 w - - 0 1",
    moves: ["Nb3+", "Kg6"],
    explanations: [
      "The knight was blocking the bishop's own diagonal toward h6. Moving it away uncovers a check from the bishop — a discovered check, where the piece that moves isn't the one giving check, so it's often free to do something else useful (here, attacking) at the same time.",
      "Black must move the king out of the bishop's line of attack.",
    ],
    hints: ["Something is blocking your own bishop's diagonal.", "Move the knight away from d2 — try b3."],
  },
  {
    slug: "skewer",
    title: "Skewer",
    theme: "tactics",
    level: "intermediate",
    summary: "Like a pin in reverse: attack a valuable piece that must move, exposing a weaker piece behind it.",
    startFen: "6r1/5k2/8/8/8/8/8/5B1K w - - 0 1",
    moves: ["Bc4+", "Ke7", "Bxg8"],
    explanations: [
      "The bishop checks the king along the same diagonal that the rook on g8 sits on. The king — the more valuable target — has to move first.",
      "Black steps out of check, but the rook behind was left completely undefended.",
      "With the king out of the way, the bishop simply captures the rook it was 'seeing through' all along.",
    ],
    hints: ["The enemy king and rook are lined up on the same diagonal.", "Give check with the bishop from c4."],
  },
  {
    slug: "deflection",
    title: "Deflection",
    theme: "tactics",
    level: "advanced",
    summary: "Force a defending piece away from the square or piece it's protecting, then exploit the gap.",
    startFen: "6k1/8/r2q4/1B6/8/8/8/4R1K1 w - - 0 1",
    moves: ["Re8+", "Qf8", "Bxa6"],
    explanations: [
      "The rook check forces Black to respond immediately — and the queen is the only piece that can block on f8.",
      "Blocking the check is natural, but it deflects the queen away from the 6th rank, where it was the only thing defending the rook on a6.",
      "With the defender deflected, White simply picks up the now-undefended rook.",
    ],
    hints: [
      "The black queen is the only defender of the rook on a6 — how can you force it away?",
      "Check the king with your rook on e8.",
    ],
  },
  {
    slug: "zwischenzug",
    title: "Zwischenzug (In-Between Move)",
    theme: "tactics",
    level: "advanced",
    summary: "Before making the 'obvious' recapture, insert a forcing move first.",
    startFen: "4k3/8/8/4b3/8/5N2/4B3/6K1 w - - 0 1",
    moves: ["Bb5+", "Kd8", "Nxe5"],
    explanations: [
      "Instead of immediately recapturing on e5, White throws in a check first — the 'in-between move' (zwischenzug). It costs Black a tempo before anything else can happen.",
      "Black has to deal with the check right away, unable to contest e5.",
      "Only now does White recapture the bishop, having gained a free check along the way that a direct recapture wouldn't have earned.",
    ],
    hints: ["Don't recapture right away — is there a stronger move first?", "Give check with the bishop on b5."],
  },
  {
    slug: "removing-the-defender",
    title: "Removing the Defender",
    theme: "tactics",
    level: "advanced",
    summary: "Trade off the piece that's guarding something, then take what it was guarding.",
    startFen: "6k1/6p1/5n2/6B1/4n3/2N5/8/6K1 w - - 0 1",
    moves: ["Bxf6", "gxf6", "Nxe4"],
    explanations: [
      "The knight on f6 was the only piece defending the knight on e4. White trades it off first.",
      "Black recaptures with the pawn — a reasonable choice, but it doesn't restore the defense of e4.",
      "With the defender gone, White wins the second knight for free.",
    ],
    hints: [
      "One black knight is defending the other — deal with the defender first.",
      "Capture the knight on f6.",
    ],
  },
  {
    slug: "greek-gift",
    title: "Greek Gift Sacrifice (Bxh7+)",
    theme: "tactics",
    level: "advanced",
    summary: "A classic bishop sacrifice on h7 (or h2) that rips open the enemy king's shelter.",
    startFen: "6k1/5ppp/8/8/8/3B1N2/8/3Q2K1 w - - 0 1",
    moves: ["Bxh7+", "Kxh7", "Ng5+", "Kg8", "Qh5"],
    explanations: [
      "White sacrifices the bishop for a pawn, dragging the king out of its shelter — the classic 'Greek gift'.",
      "Taking is close to forced; declining leaves White simply up a pawn with the attack still coming.",
      "The knight joins with check, gaining another tempo and eyeing further inroads near the king.",
      "The king has to retreat, further boxed in by its own pawns.",
      "The queen swings over to h5, aiming straight at h7 and g6 — Black's position is falling apart with no good defense left.",
    ],
    hints: [
      "A well-known sacrifice on h7 rips open the king's cover.",
      "Capture the pawn on h7 with your bishop, giving check.",
    ],
  },
];

export function getSequence(slug: string): Sequence | undefined {
  return SEQUENCES.find((sequence) => sequence.slug === slug);
}
