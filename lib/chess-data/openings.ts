import type { SkillLevel } from "@/lib/chess/skill-level";

export type Opening = {
  slug: string;
  name: string;
  eco: string;
  /** SAN moves from the starting position. */
  moves: string[];
  summary: string;
  explanation: string;
  plans: { white: string; black: string };
  /** Lowest skill level this opening is surfaced to by default. */
  level: SkillLevel;
};

export const OPENINGS: Opening[] = [
  {
    slug: "italian-game",
    name: "Italian Game",
    eco: "C50",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
    summary: "One of the oldest openings — fast, natural development aimed at f7.",
    explanation:
      "White develops the bishop straight at Black's weakest point, f7, and prepares to castle quickly. It's a great first opening because every move has an obvious purpose.",
    plans: {
      white: "Castle short, build a strong center with c3/d4, look for tactics against f7.",
      black: "Mirror development with ...Bc5 or play solidly with ...Be7/...Nf6, contest the center.",
    },
    level: "beginner",
  },
  {
    slug: "ruy-lopez",
    name: "Ruy Lopez (Spanish)",
    eco: "C60",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
    summary: "Pressures the knight defending e5, one of the most respected e4 openings.",
    explanation:
      "The bishop pins the c6-knight to indirectly attack the e5-pawn. White plays for long-term pressure rather than immediate tactics.",
    plans: {
      white: "Castle, reroute pieces (Re1, Bxc6 ideas or Ba4-b3), fight for the center with c3/d4.",
      black: "Play ...a6 to question the bishop, then develop naturally with ...Nf6, ...Be7, ...b5 lines.",
    },
    level: "intermediate",
  },
  {
    slug: "sicilian-najdorf",
    name: "Sicilian Defense — Najdorf",
    eco: "B90",
    moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
    summary: "The most respected reply to 1.e4 for players who want to play for a win as Black.",
    explanation:
      "Black delays kingside development to play ...a6 first, preventing Nb5/Bb5 ideas and preparing flexible expansion with ...e5 or ...b5.",
    plans: {
      white: "Attack quickly on the kingside (Be3/f3/Qd2/O-O-O) before Black consolidates.",
      black: "Expand with ...e5 and ...b5, aim for active piece play and counterattack.",
    },
    level: "advanced",
  },
  {
    slug: "queens-gambit-declined",
    name: "Queen's Gambit Declined",
    eco: "D30",
    moves: ["d4", "d5", "c4", "e6"],
    summary: "Solid, classical response to the Queen's Gambit that leads to rich strategic play.",
    explanation:
      "Black keeps the center pawn on d5 instead of grabbing the c4-pawn, prioritizing a solid structure over material.",
    plans: {
      white: "Develop naturally, consider the Exchange Variation to attack the c-file/minority attack.",
      black: "Free the light-squared bishop (...b6 or ...dxc4/...c5 breaks), aim for equality then outplay.",
    },
    level: "beginner",
  },
  {
    slug: "kings-indian-defense",
    name: "King's Indian Defense",
    eco: "E60",
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6"],
    summary: "Hypermodern setup — Black lets White build a big center, then strikes back at it.",
    explanation:
      "Black fianchettoes the bishop and castles quickly, planning a thematic ...e5 or ...c5 break to challenge White's center later with pieces fully developed.",
    plans: {
      white: "Build a broad pawn center, expand on the queenside once Black commits to ...e5.",
      black: "Play ...e5 or ...c5 at the right moment, launch a kingside pawn storm with ...f5 in many lines.",
    },
    level: "advanced",
  },
  {
    slug: "london-system",
    name: "London System",
    eco: "D02",
    moves: ["d4", "d5", "Nf3", "Nf6", "Bf4"],
    summary: "A simple, reliable setup for White that can be played almost regardless of Black's reply.",
    explanation:
      "White develops the dark-squared bishop before playing e3, avoiding the common problem of it getting stuck behind the pawn chain. Easy to learn, hard to punish.",
    plans: {
      white: "Set up Bf4, e3, Bd3/Be2, Nbd2, O-O, then expand with c3/Ne5 or a kingside plan.",
      black: "Contest the center with ...c5, or fianchetto with ...g6 to challenge the bishop's diagonal.",
    },
    level: "beginner",
  },
  {
    slug: "caro-kann",
    name: "Caro-Kann Defense",
    eco: "B10",
    moves: ["e4", "c6"],
    summary: "A solid, low-risk reply to 1.e4 that avoids many sharp tactical lines.",
    explanation:
      "Black prepares ...d5 without blocking in the light-squared bishop (unlike the French Defense), aiming for a sound structure.",
    plans: {
      white: "Play for a small, lasting space advantage; the Advance Variation (e5) is popular.",
      black: "Trade central tension favorably, develop the light-squared bishop before ...e6.",
    },
    level: "intermediate",
  },
  {
    slug: "english-opening",
    name: "English Opening",
    eco: "A10",
    moves: ["c4"],
    summary: "A flexible flank opening that can transpose into many other structures.",
    explanation:
      "White claims space on the queenside first and keeps options open for a later d4 or a full fianchetto setup.",
    plans: {
      white: "Choose between a Reversed Sicilian setup, symmetrical structures, or transposing to d4 openings.",
      black: "Mirror with ...c5, or strike the center directly with ...e5 or ...d5.",
    },
    level: "advanced",
  },
];

export function getOpening(slug: string): Opening | undefined {
  return OPENINGS.find((opening) => opening.slug === slug);
}
