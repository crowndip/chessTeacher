"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { SKILL_LEVELS, SKILL_LEVEL_ORDER, type SkillLevel } from "@/lib/chess/skill-level";

const STORAGE_KEY = "chess-trainer:skill-level";

type SkillLevelContextValue = {
  skillLevel: SkillLevel;
  setSkillLevel: (level: SkillLevel) => void;
};

const SkillLevelContext = createContext<SkillLevelContextValue | null>(null);

// Module-level store so the picked level survives across component instances and can be
// read synchronously on the client (via useSyncExternalStore) without an SSR hydration mismatch.
let cachedSkillLevel: SkillLevel | null = null;
const listeners = new Set<() => void>();

function readStoredSkillLevel(): SkillLevel {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && stored in SKILL_LEVELS) return stored as SkillLevel;
  } catch {
    // localStorage unavailable (private mode, etc.) - fall back to default.
  }
  return "beginner";
}

function getSnapshot(): SkillLevel {
  cachedSkillLevel ??= readStoredSkillLevel();
  return cachedSkillLevel;
}

function getServerSnapshot(): SkillLevel {
  return "beginner";
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function writeSkillLevel(level: SkillLevel) {
  cachedSkillLevel = level;
  try {
    window.localStorage.setItem(STORAGE_KEY, level);
  } catch {
    // Ignore write failures - the in-memory state still updates.
  }
  listeners.forEach((listener) => listener());
}

export function SkillLevelProvider({ children }: { children: ReactNode }) {
  const skillLevel = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <SkillLevelContext.Provider value={{ skillLevel, setSkillLevel: writeSkillLevel }}>
      {children}
    </SkillLevelContext.Provider>
  );
}

export function useSkillLevel(): SkillLevelContextValue {
  const context = useContext(SkillLevelContext);
  if (!context) throw new Error("useSkillLevel must be used within a SkillLevelProvider");
  return context;
}

export function SkillLevelPicker() {
  const { skillLevel, setSkillLevel } = useSkillLevel();
  return (
    <div className="skill-level-header-picker" role="group" aria-label="Skill level">
      {SKILL_LEVEL_ORDER.map((level) => (
        <button
          key={level}
          type="button"
          className="skill-level-header-option"
          aria-pressed={skillLevel === level}
          onClick={() => setSkillLevel(level)}
          title={SKILL_LEVELS[level].description}
        >
          {SKILL_LEVELS[level].label}
        </button>
      ))}
    </div>
  );
}
