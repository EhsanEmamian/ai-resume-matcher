import type { ManualProfile, ManualProfileRole, ManualProfileSeniority } from "@/lib/api";

const ROLE_KEYWORDS: Record<ManualProfileRole, string[]> = {
  Backend: ["backend", "backend developer", "backend engineer"],
  Frontend: ["frontend", "frontend developer", "frontend engineer"],
  "Full Stack": ["full stack", "fullstack", "full-stack developer"],
  Data: ["data", "data engineer", "data analyst"],
  AI: ["ai", "machine learning", "ml engineer"],
};

export function buildManualProfilePayload(
  role: ManualProfileRole,
  skills: string[],
  seniority: ManualProfileSeniority
): ManualProfile {
  const baseRoles = ROLE_KEYWORDS[role];
  const seniorityLower = seniority.toLowerCase();

  const suggested_roles = [
    ...baseRoles,
    ...baseRoles.map((keyword) => `${seniorityLower} ${keyword}`),
    `${seniorityLower} ${role.toLowerCase()}`,
  ].filter((value, index, array) => array.indexOf(value) === index);

  return {
    skills,
    suggested_roles,
    seniority_level: seniority,
  };
}
