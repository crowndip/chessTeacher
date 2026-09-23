import type { SkillLevel } from "@/lib/chess/skill-level";

export type Opening = {
  slug: string;
  name: string;
  eco: string;
  /** SAN moves for a realistic full main line, from the starting position. */
  moves: string[];
  /** Explanation for each move in `moves`, same length and order. */
  moveExplanations: string[];
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
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3", "d6", "O-O", "O-O"],
    moveExplanations: [
      "Grabs the center and opens lines for the queen and light-squared bishop.",
      "Black mirrors, claiming an equal share of the center.",
      "Develops a piece and attacks the e5 pawn.",
      "Defends e5 and develops naturally.",
      "Aims the bishop at f7, Black's weakest point.",
      "Black develops symmetrically, eyeing f2 in return.",
      "Prepares d4 to build a full center, and gives the bishop a retreat square on c2 if needed.",
      "Develops the last minor piece and attacks e4.",
      "Solidly defends e4 without yet committing to d4.",
      "Black secures e5 and opens the c8-bishop's diagonal.",
      "White tucks the king away and connects the rooks.",
      "Black does the same — both sides are fully developed and ready for the middlegame.",
    ],
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
    moves: [
      "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6",
      "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O",
    ],
    moveExplanations: [
      "Grabs the center and opens development.",
      "Black claims equal space.",
      "Develops and attacks e5.",
      "Defends e5.",
      "Pins the knight to the king, pressuring e5 indirectly since a trade would leave it undefended.",
      "Questions the bishop immediately, gaining a tempo and keeping options open.",
      "Retreats but keeps the pin along the a4-e8 diagonal.",
      "Develops and counterattacks e4.",
      "King safety, and sidesteps any tricks on the e-file.",
      "Solid development, prepares to castle.",
      "Supports e4 preemptively and prepares to meet ...b5 with Bb3.",
      "Gains space and hits the bishop, breaking the pin's connection to a4.",
      "Retreats to a safe square on the long diagonal, still eyeing f7.",
      "Solidifies e5 and frees the c8-bishop's diagonal.",
      "Prepares d4 to challenge the center — the standard Ruy Lopez plan.",
      "Black completes development and castles to safety.",
    ],
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
    moves: [
      "e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6",
      "Nc3", "a6", "Be3", "e5", "Nb3", "Be6", "f3", "Be7",
    ],
    moveExplanations: [
      "Grabs the center and invites the Sicilian.",
      "Black fights for the center asymmetrically, aiming for imbalanced, winning-try chess.",
      "Develops toward d4.",
      "Prepares ...Nf6 safely and supports a future ...e5.",
      "Strikes the center, offering a trade.",
      "Black accepts, opening the c-file for later pressure.",
      "Recaptures, centralizing the knight.",
      "Develops and attacks e4.",
      "Defends e4 and develops.",
      "The Najdorf's signature move — rules out Nb5/Bb5 ideas and keeps Black's setup flexible.",
      "Prepares the aggressive English Attack setup with Qd2/O-O-O.",
      "Grabs central space, kicking the d4-knight.",
      "Retreats to a safe, flexible square rather than trading it off.",
      "Develops and covers the a2-g8 diagonal.",
      "Shores up e4 and prepares g4 — the standard English Attack plan.",
      "Completes development, ready to castle.",
    ],
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
    moves: [
      "d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7",
      "e3", "O-O", "Nf3", "h6", "Bh4", "b6",
    ],
    moveExplanations: [
      "Grabs the center.",
      "Black claims equal space.",
      "The Queen's Gambit — challenges d5 indirectly rather than defending c4.",
      "Black keeps the strong pawn on d5 rather than grabbing c4, prioritizing solidity over material.",
      "Develops and adds pressure on d5.",
      "Develops and defends d5 again.",
      "Pins the knight, increasing the pressure on d5.",
      "Breaks the pin safely and prepares to castle.",
      "Opens the dark-squared bishop's diagonal and prepares Bd3/Nf3.",
      "King safety.",
      "Completes minor piece development.",
      "Asks the bishop to clarify its intentions.",
      "Keeps the pin rather than trading, maintaining the tension.",
      "Prepares to develop the light-squared bishop via b7 — the classic plan for freeing Black's game.",
    ],
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
    moves: [
      "d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6",
      "Nf3", "O-O", "Be2", "e5", "O-O", "Nc6",
    ],
    moveExplanations: [
      "Grabs the center.",
      "Develops and controls e4, without committing the center pawns yet.",
      "Expands — the classic setup that invites a hypermodern reply.",
      "Prepares the King's Indian fianchetto.",
      "Develops and supports e4.",
      "Fianchettoes, eyeing the long diagonal and the center from a distance.",
      "White builds a broad classical pawn center — the point of allowing the fianchetto.",
      "Prepares ...e5, the thematic central break.",
      "Defends e4 and develops.",
      "King safety, before committing further in the center.",
      "Solid development that keeps White's plans flexible.",
      "The key King's Indian break — striking at the center from the side rather than head-on.",
      "White castles, keeping options open depending on how Black follows up.",
      "Adds pressure to d4, completing development.",
    ],
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
    moves: [
      "d4", "d5", "Nf3", "Nf6", "Bf4", "e6", "e3", "Bd6",
      "Bg3", "O-O", "Bd3", "c5", "c3", "Nc6",
    ],
    moveExplanations: [
      "Grabs the center.",
      "Black mirrors.",
      "Develops, keeping options open.",
      "Mirrors development.",
      "The London's key idea — develop this bishop before e3 traps it behind the pawn chain.",
      "Solid, prepares ...Bd6 or ...Be7 and frees development.",
      "Supports d4 and opens the f1-bishop's diagonal.",
      "Challenges White's bishop directly, offering a trade.",
      "Avoids the trade, keeping the bishop active on the b8-h2 diagonal.",
      "King safety.",
      "Completes development, eyeing the kingside.",
      "Black strikes at the center — the typical freeing break against the London.",
      "Supports d4 solidly.",
      "Develops and adds pressure on d4.",
    ],
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
    moves: [
      "e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5",
      "Ng3", "Bg6", "h4", "h6", "Nf3", "Nd7",
    ],
    moveExplanations: [
      "Grabs the center.",
      "Prepares ...d5 without blocking the light-squared bishop in.",
      "Builds a full center.",
      "Challenges it directly.",
      "Defends e4 and develops.",
      "Black resolves the tension, trading off the central pawn.",
      "Recaptures, centralizing the knight.",
      "Develops the light-squared bishop actively before playing ...e6 — the whole point of the Caro-Kann move order.",
      "Kicks the bishop while developing.",
      "Retreats but stays active, eyeing e4 and d3.",
      "Gains space and threatens h5 — a sharp try against the bishop.",
      "Stops h5 from gaining any more space.",
      "Develops toward the center.",
      "Prepares ...Ngf6 without blocking the other knight, and readies ...e6.",
    ],
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
    moves: [
      "c4", "e5", "Nc3", "Nf6", "Nf3", "Nc6", "g3", "d5",
      "cxd5", "Nxd5", "Bg2", "Nb6", "O-O", "Be7",
    ],
    moveExplanations: [
      "A flank opening — claims queenside space while staying flexible.",
      "Black grabs the center directly, effectively a reversed Sicilian.",
      "Develops and supports the center.",
      "Develops and pressures central squares.",
      "Develops and adds central control.",
      "Develops and defends e5.",
      "Prepares the standard English fianchetto.",
      "Black strikes in the center while it's available.",
      "Trades favorably into a more open position.",
      "Recaptures, centralizing the knight.",
      "Completes the fianchetto, eyeing the long diagonal and the centralized knight.",
      "Retreats the knight to a safer, still-active square.",
      "King safety.",
      "Solid development, preparing to castle.",
    ],
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
