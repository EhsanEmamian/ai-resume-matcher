const HERO_STATE_STORAGE_KEY = "ai-resume-matcher:hero-state";
const HERO_STATE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type HeroState =
  | { type: "none" }
  | {
      type: "parsed_resume";
      resumeId: string;
      topRole: string;
      topSkills: string[];
      matchCount: number;
    }
  | {
      type: "quick_try";
      topRole: string;
      topSkills: string[];
      matchCount: number;
    };

type PersistedHeroState = Exclude<HeroState, { type: "none" }> & {
  savedAt: number;
};

function isPersistedHeroState(value: unknown): value is PersistedHeroState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.savedAt !== "number") {
    return false;
  }

  if (record.type === "parsed_resume") {
    return (
      typeof record.resumeId === "string" &&
      typeof record.topRole === "string" &&
      Array.isArray(record.topSkills) &&
      record.topSkills.every((skill) => typeof skill === "string") &&
      typeof record.matchCount === "number"
    );
  }

  if (record.type === "quick_try") {
    return (
      typeof record.topRole === "string" &&
      Array.isArray(record.topSkills) &&
      record.topSkills.every((skill) => typeof skill === "string") &&
      typeof record.matchCount === "number"
    );
  }

  return false;
}

function toPersistedState(
  state: Exclude<HeroState, { type: "none" }>
): PersistedHeroState {
  return {
    ...state,
    savedAt: Date.now(),
  };
}

function fromPersistedState(state: PersistedHeroState): HeroState {
  const { savedAt: _savedAt, ...rest } = state;
  return rest;
}

export function saveHeroState(state: Exclude<HeroState, { type: "none" }>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      HERO_STATE_STORAGE_KEY,
      JSON.stringify(toPersistedState(state))
    );
  } catch {
    // Ignore quota / privacy errors
  }
}

export function loadHeroState(): HeroState {
  if (typeof window === "undefined") {
    return { type: "none" };
  }

  try {
    const raw = window.localStorage.getItem(HERO_STATE_STORAGE_KEY);
    if (!raw) {
      return { type: "none" };
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isPersistedHeroState(parsed)) {
      clearHeroState();
      return { type: "none" };
    }

    if (Date.now() - parsed.savedAt > HERO_STATE_TTL_MS) {
      clearHeroState();
      return { type: "none" };
    }

    return fromPersistedState(parsed);
  } catch {
    clearHeroState();
    return { type: "none" };
  }
}

export function clearHeroState(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(HERO_STATE_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function updateParsedResumeMatchCount(
  resumeId: string,
  matchCount: number
): void {
  const current = loadHeroState();
  if (current.type !== "parsed_resume" || current.resumeId !== resumeId) {
    return;
  }

  saveHeroState({
    ...current,
    matchCount,
  });
}
