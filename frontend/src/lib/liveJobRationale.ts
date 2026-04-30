const GENERIC_TERMS = new Set([
  "developer",
  "engineer",
  "software",
  "backend",
  "frontend",
  "full",
  "stack",
  "junior",
  "senior",
  "mid",
  "lead",
  "remote",
  "contract",
]);

function normalize(text: string) {
  return text.toLowerCase();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9+#.\-/]+/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export function deriveLiveJobRationale(params: {
  keyword: string;
  title: string;
  description: string;
}): string[] {
  const { keyword, title, description } = params;

  const keywordTokens = unique(
    tokenize(keyword).filter((token) => token.length >= 2)
  );

  if (keywordTokens.length === 0) return [];

  const jobText = normalize(`${title} ${description}`);
  const matches: string[] = [];

  for (const token of keywordTokens) {
    if (jobText.includes(token)) {
      matches.push(token);
    }
  }

  const prettyMatches = matches.map((item) => {
    if (item === "python") return "Python";
    if (item === "java") return "Java";
    if (item === "javascript") return "JavaScript";
    if (item === "typescript") return "TypeScript";
    if (item === "django") return "Django";
    if (item === "fastapi") return "FastAPI";
    if (item === "backend") return "Backend role";
    if (item === "frontend") return "Frontend role";
    if (item === "full") return "Full-stack context";
    if (item === "engineer") return "Engineer role";
    if (item === "developer") return "Developer role";
    if (item === "software") return "Software role";
    return item.charAt(0).toUpperCase() + item.slice(1);
  });

  const strongMatches = prettyMatches.filter(
    (item) => !GENERIC_TERMS.has(item.toLowerCase())
  );

  const finalItems = strongMatches.length > 0 ? strongMatches : prettyMatches;

  return unique(finalItems).slice(0, 4);
}