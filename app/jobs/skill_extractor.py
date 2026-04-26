from __future__ import annotations


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
    "rest api",
    "rest APIs",
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
    "rest api": "REST API",
    "rest APIs": "REST APIs",
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
}


def extract_skills_from_text(title: str, description: str) -> list[str]:
    text = f"{title} {description}".lower()

    found: list[str] = []

    for skill in KNOWN_SKILLS:
        if skill.lower() in text:
            display_name = DISPLAY_NAMES.get(skill, skill.title())
            if display_name not in found:
                found.append(display_name)

    return found