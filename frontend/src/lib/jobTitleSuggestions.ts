export const JOB_TITLE_SUGGESTIONS = [
  "Backend Engineer",
  "Backend Developer",
  "Frontend Engineer",
  "Frontend Developer",
  "Full Stack Engineer",
  "Full Stack Developer",
  "Python Developer",
  "Python Backend Developer",
  "Python Engineer",
  "Java Developer",
  "Java Backend Developer",
  "Software Engineer",
  "Software Developer",
  "Junior Software Developer",
  "Junior Backend Developer",
  "Junior Backend Engineer",
  "Junior Python Developer",
  "AI Engineer",
  "AI Integration Engineer",
  "Data Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "API Developer",
  "FastAPI Developer",
  "Django Developer",
  "Business Analyst",
  "BI Developer",
  "Data Analyst",
];

export function filterJobTitleSuggestions(input: string): string[] {
  const value = input.trim().toLowerCase();
  if (!value) return [];

  const startsWith = JOB_TITLE_SUGGESTIONS.filter((item) =>
    item.toLowerCase().startsWith(value)
  );

  const contains = JOB_TITLE_SUGGESTIONS.filter(
    (item) =>
      !item.toLowerCase().startsWith(value) &&
      item.toLowerCase().includes(value)
  );

  return [...startsWith, ...contains].slice(0, 6);
}