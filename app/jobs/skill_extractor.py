from __future__ import annotations

import re


KNOWN_SKILLS = [
    "python",
    "java",
    "javascript",
    "typescript",
    "react",
    "vue",
    "angular",
    "fastapi",
    "django",
    "flask",
    "sql",
    "postgresql",
    "mysql",
    "docker",
    "kubernetes",
    "git",
    "rest",
    "rest api",
    "rest apis",
    "api",
    "aws",
    "azure",
    "gcp",
    "linux",
    "ci/cd",
    "github",
    "html",
    "css",
    "node.js",
    "nodejs",
    "mongodb",
    "redis",
    "machine learning",
    "ai",
    "spring",
    "spring boot",
    "java ee",
    "microservices",
    "quarkus",
    "kafka",
    "rabbitmq",
    "jenkins",
    "next.js",
    "nextjs",
    "tailwind",
    "tailwind css",
    "graphql",
    "llm",
    "claude",
    "chatgpt",
    "openai",
    "prompt engineering",
    "langchain"
]


DISPLAY_NAMES = {
    "python": "Python",
    "java": "Java",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "react": "React",
    "vue": "Vue",
    "angular": "Angular",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "sql": "SQL",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "git": "Git",
    "rest": "REST",
    "rest api": "REST API",
    "rest apis": "REST APIs",
    "api": "API",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "GCP",
    "linux": "Linux",
    "ci/cd": "CI/CD",
    "github": "GitHub",
    "html": "HTML",
    "css": "CSS",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "machine learning": "Machine Learning",
    "ai": "AI",
    "spring": "Spring",
    "spring boot": "Spring Boot",
    "java ee": "Java EE",
    "microservices": "Microservices",
    "quarkus": "Quarkus",
    "kafka": "Kafka",
    "rabbitmq": "RabbitMQ",
    "jenkins": "Jenkins",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "tailwind": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    "graphql": "GraphQL",
    "llm": "LLMs",
    "claude": "Claude AI",
    "chatgpt": "ChatGPT",
    "openai": "OpenAI",
    "prompt engineering": "Prompt Engineering",
    "langchain": "LangChain"
}


KNOWN_LANGUAGES = [
    ("deutsch", "German"),
    ("german", "German"),
    ("englisch", "English"),
    ("english", "English"),
    ("persisch", "Persian"),
    ("persian", "Persian"),
    ("französisch", "French"),
    ("french", "French"),
    ("spanisch", "Spanish"),
    ("spanish", "Spanish"),
    ("italienisch", "Italian"),
    ("italian", "Italian"),
    ("türkisch", "Turkish"),
    ("turkish", "Turkish"),
    ("niederländisch", "Dutch"),
    ("dutch", "Dutch"),
    ("arabisch", "Arabic"),
    ("arabic", "Arabic"),
]


def _normalize_text(title: str, description: str) -> str:
    return f"{title}\n{description}"


def _contains_term(text: str, term: str) -> bool:
    escaped = re.escape(term)
    pattern = rf"(?<!\w){escaped}(?!\w)"
    return re.search(pattern, text, flags=re.IGNORECASE) is not None


def _contains_any_term(text: str, terms: list[str]) -> bool:
    return any(_contains_term(text, term) for term in terms)


def extract_languages_from_text(title: str, description: str) -> list[str]:
    text = _normalize_text(title, description)
    found: list[str] = []

    for keyword, value in KNOWN_LANGUAGES:
        if _contains_term(text, keyword) and value not in found:
            found.append(value)

    return found


def extract_experience_requirement_from_text(
    title: str,
    description: str,
) -> str | None:
    title_lower = title.lower()
    text = _normalize_text(title, description)

    # اولویت اول: بررسی مستقیم عنوان شغل (Title) که دقیق‌ترین سیگنال است
    if "senior" in title_lower or "lead" in title_lower or "principal" in title_lower:
        return "Senior level"
    if "junior" in title_lower or "entry" in title_lower or "trainee" in title_lower:
        return "Junior level"
    if "intern" in title_lower or "praktik" in title_lower:
        return "Internship"

    # اولویت دوم: الگوهای منظم برای استخراج سال سابقه از متن آگهی
    patterns = [
        (
            r"\b(\d+)\+\s+years?\b",
            lambda match: f"{match.group(1)}+ years of experience",
        ),
        (
            r"\b(\d+)\s+years?\s+(?:of\s+)?experience\b",
            lambda match: f"{match.group(1)} years of experience",
        ),
        (
            r"\b(?:minimum|at\s+least)\s+(?:of\s+)?(\d+)\s+years?\b",
            lambda match: f"Minimum {match.group(1)} years of experience",
        ),
        (
            r"\bmindestens\s+(\d+)\s+jahre\b",
            lambda match: f"At least {match.group(1)} years of experience",
        ),
        (
            r"\b(\d+)\s+jahre\s+(?:einschlägige\s+)?berufserfahrung\b",
            lambda match: f"{match.group(1)} years of professional experience",
        ),
    ]

    for pattern, formatter in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return formatter(match)

    # اولویت سوم: عبارات متنی در توضیحات (با دقت بیشتر)
    if _contains_term(text, "mehrjährige erfahrung"):
        return "Several years of experience"
    if _contains_term(text, "erste programmiererfahrung"):
        return "First programming experience"
    if _contains_term(text, "berufserfahrung"):
        return "Professional experience required"

    return None


MAX_SALARY_LENGTH = 120

_SALARY_KEYWORDS = (
    r"(?:mindest)?gehalt|lohn|vergütung|entlohnung|entgelt|"
    r"salary|compensation|remuneration|pay"
)

_CURRENCY = r"(?:EUR|€|CHF|GBP|£|\$|USD|SEK|NOK)"

_MONEY_NUMBER = r"\d{1,3}(?:[.,]\d{3})*(?:[.,][\d\-]{2})?"

_PER_UNIT = r"(?:/|\s+(?:per|pro)\s+)?(?:Monat|Jahr|Stunde|month|year|hour|p\.a\.|pa)"

_SALARY_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        rf"""
        {_CURRENCY}
        \s*
        {_MONEY_NUMBER}
        (?:\s*[-–]+\s*{_MONEY_NUMBER})?
        [^\n]{{0,40}}
        """,
        re.VERBOSE | re.IGNORECASE,
    ),
    re.compile(
        rf"""
        {_MONEY_NUMBER}
        \s*
        {_CURRENCY}
        [^\n]{{0,40}}
        """,
        re.VERBOSE | re.IGNORECASE,
    ),
    re.compile(
        rf"""
        (?:{_SALARY_KEYWORDS})
        [^\n]{{0,80}}
        {_CURRENCY}
        \s*
        {_MONEY_NUMBER}
        [^\n]{{0,40}}
        """,
        re.VERBOSE | re.IGNORECASE,
    ),
    re.compile(
        rf"""
        (?:{_SALARY_KEYWORDS})
        \s*[:\-–]?\s*
        {_CURRENCY}?\s*
        {_MONEY_NUMBER}
        (?:\s*[-–]+\s*{_CURRENCY}?\s*{_MONEY_NUMBER})?
        (?:\s*{_PER_UNIT})?
        """,
        re.VERBOSE | re.IGNORECASE,
    ),
]


def extract_salary_text_from_text(title: str, description: str) -> str | None:
    """
    Extract a salary snippet from a job description.
    Returns a short, clean string or None — never more than MAX_SALARY_LENGTH chars.
    """
    text = _normalize_text(title, description)
    if not text.strip():
        return None

    for pattern in _SALARY_PATTERNS:
        match = pattern.search(text)
        if match:
            raw = match.group(0).strip()

            if len(raw) > MAX_SALARY_LENGTH:
                raw = raw[:MAX_SALARY_LENGTH].rstrip()

            if not re.search(r"\d", raw):
                continue

            return raw

    return None


def normalize_salary_text_for_storage(salary: str | None) -> str | None:
    """Hard-cap salary text before persisting to the database."""
    if not salary:
        return None

    capped = salary.strip()
    if len(capped) > MAX_SALARY_LENGTH:
        capped = capped[:MAX_SALARY_LENGTH].rstrip()

    if not capped or not re.search(r"\d", capped):
        return None

    return capped


def extract_skills_from_text(title: str, description: str) -> list[str]:
    text = _normalize_text(title, description)

    found: list[str] = []

    for skill in KNOWN_SKILLS:
        if _contains_term(text, skill):
            display_name = DISPLAY_NAMES.get(skill, skill.title())
            if display_name not in found:
                found.append(display_name)

    return found