export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type SkillLevelConfig = {
  label: string;
  description: string;
  defaultElo: number;
  /** Verbose explanations spell out ideas in plain language; terse assumes chess vocabulary. */
  explanationDepth: "verbose" | "terse";
  /** Number of openings shown by default before "show all" is used. */
  openingLibraryPreviewSize: number;
  /** When raw centipawn/pawn evaluation numbers are shown next to move-quality dots. */
  showRawEval: "never" | "hover" | "always";
  /** How many escalating hint levels are offered in puzzle mode (1 = arrow only). */
  hintLevels: 1 | 2 | 3;
};

export const SKILL_LEVELS: Record<SkillLevel, SkillLevelConfig> = {
  beginner: {
    label: "Beginner",
    description: "New to chess strategy — explanations spell out the reasoning behind each move.",
    defaultElo: 1320,
    explanationDepth: "verbose",
    openingLibraryPreviewSize: 6,
    showRawEval: "never",
    hintLevels: 3,
  },
  intermediate: {
    label: "Intermediate",
    description: "Comfortable with the rules, building an opening repertoire and tactical vision.",
    defaultElo: 1700,
    explanationDepth: "verbose",
    openingLibraryPreviewSize: 12,
    showRawEval: "hover",
    hintLevels: 2,
  },
  advanced: {
    label: "Advanced",
    description: "Familiar with standard chess vocabulary and common plans.",
    defaultElo: 2100,
    explanationDepth: "terse",
    openingLibraryPreviewSize: 20,
    showRawEval: "always",
    hintLevels: 1,
  },
  expert: {
    label: "Expert",
    description: "Wants a strong sparring partner and concise, high-density notes.",
    defaultElo: 2600,
    explanationDepth: "terse",
    openingLibraryPreviewSize: Infinity,
    showRawEval: "always",
    hintLevels: 1,
  },
};

export const SKILL_LEVEL_ORDER: SkillLevel[] = ["beginner", "intermediate", "advanced", "expert"];
