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
    text = _normalize_text(title, description)

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

    if _contains_term(text, "erste programmiererfahrung"):
        return "First programming experience"
    if _contains_term(text, "berufserfahrung"):
        return "Professional experience required"
    if _contains_term(text, "entry level"):
        return "Entry level"
    if _contains_term(text, "junior"):
        return "Junior level"
    if _contains_term(text, "mehrjährige erfahrung"):
        return "Several years of experience"

    return None


def extract_salary_text_from_text(title: str, description: str) -> str | None:
    text = _normalize_text(title, description)
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    salary_patterns = [
        r"€\s?\d[\d\.\,]*",
        r"\d[\d\.\,]*\s?€",
        r"\$\s?\d[\d\.\,]*",     # دلار (آمریکا/کانادا)
        r"£\s?\d[\d\.\,]*",     # پوند (انگلیس)
        r"\b\d{2,3}k\b",        # فرمت‌های رایج مثل 80k یا 120k
        r"\beur\b",
        r"\busd\b",
        r"\bgbp\b",
        r"\bbrutto\b",
        r"\bmonatlich\b",
        r"\bjährlich\b",
        r"\bp\.a\.\b",
        r"\bgehalt\b",
        r"\bbruttogehalt\b",
        r"\bbruttomonatsgehalt\b",
        r"\bjahresbrutto\b",
        r"\bkollektivvertrag\b",
        r"\bkv-minimum\b",
        r"\bverhandlungsbasis\b",
        r"\b(?:annual\s+)?salary\b",  # حقوق سالانه انگلیسی
        r"\bper\s+year\b",            # سالانه انگلیسی
    ]

    for line in lines:
        lowered = line.lower()
        if any(
            re.search(pattern, lowered, flags=re.IGNORECASE)
            for pattern in salary_patterns
        ):
            return line

    return None


def extract_skills_from_text(title: str, description: str) -> list[str]:
    text = _normalize_text(title, description)

    found: list[str] = []

    for skill in KNOWN_SKILLS:
        if _contains_term(text, skill):
            display_name = DISPLAY_NAMES.get(skill, skill.title())
            if display_name not in found:
                found.append(display_name)

    return found