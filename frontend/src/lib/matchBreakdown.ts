import type { ScoreBreakdown } from "@/lib/api";

const DEFAULT_WEIGHTS: ScoreBreakdown["weights"] = {
  skill_overlap: 0.45,
  role_alignment: 0.25,
  seniority_fit: 0.1,
  language_fit: 0.1,
  experience_fit: 0.1,
};

/** Normalize API / legacy stored breakdown shapes for UI rendering. */
export function normalizeScoreBreakdown(
  raw: ScoreBreakdown | Record<string, unknown> | null | undefined
): ScoreBreakdown | null {
  if (!raw) return null;

  if ("skill_overlap" in raw && typeof raw.skill_overlap === "number") {
    return raw as ScoreBreakdown;
  }

  const legacy = raw as Record<string, number>;
  if ("skill_overlap_score" in legacy) {
    const skill = legacy.skill_overlap_score ?? 0;
    const role = legacy.role_overlap_score ?? 0;
    const remote = legacy.remote_bonus ?? 0;
    const final =
      legacy.final_score ?? Math.min(skill + role + remote, 1);

    return {
      skill_overlap: skill,
      role_alignment: role,
      seniority_fit: 0,
      language_fit: 0,
      experience_fit: remote,
      final_score: final,
      weights: DEFAULT_WEIGHTS,
      matched_skills: [],
      missing_skills: [],
      seniority_signal: null,
      language_signal: null,
      data_quality: "minimal",
      narrative: "Legacy match record — regenerate matches for the full breakdown.",
    };
  }

  return null;
}

export const SCORE_COMPONENT_LABELS: Record<
  keyof Pick<
    ScoreBreakdown,
    | "skill_overlap"
    | "role_alignment"
    | "seniority_fit"
    | "language_fit"
    | "experience_fit"
  >,
  string
> = {
  skill_overlap: "Skills",
  role_alignment: "Role",
  seniority_fit: "Seniority",
  language_fit: "Languages",
  experience_fit: "Experience",
};
