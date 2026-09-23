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
  },
];

export function getSequence(slug: string): Sequence | undefined {
  return SEQUENCES.find((sequence) => sequence.slug === slug);
}
