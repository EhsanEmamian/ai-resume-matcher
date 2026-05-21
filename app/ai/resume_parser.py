import json
import re
from typing import Literal

from pydantic import BaseModel, Field, ValidationError

from app.ai.client import get_anthropic_client
from app.config import settings


class ResumeParsingError(Exception):
    pass


class ResumeAIUnavailableError(Exception):
    pass


# با استفاده از سینتکس مدرن پایتون و مقادیر پیش‌فرض، جلوی کرش‌های Validation گرفته شد
class ParsedResumeProfile(BaseModel):
    skills: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    years_of_experience: int | None = None
    seniority_level: Literal["junior", "mid", "senior"] | None = None
    suggested_roles: list[str] = Field(default_factory=list)


def _extract_json_object(text: str) -> str:
    """Helper to extract JSON block if AI wraps it in markdown"""
    text = text.strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0)
    return text


def build_resume_parsing_prompt(raw_text: str) -> str:
    return f"""
You are an expert resume analysis assistant.

Analyze the following resume text and extract structured information.

Return valid JSON only.
Do not wrap it in markdown.
Do not include explanations.
Do not include extra text before or after the JSON.

JSON format:
{{
  "skills": ["string"],
  "technologies": ["string"],
  "languages": ["string"],
  "years_of_experience": 0,
  "seniority_level": "junior",
  "suggested_roles": ["string"]
}}

Rules:
- skills: core professional skills
- technologies: programming languages, frameworks, tools, databases, platforms
- languages: human languages only
- years_of_experience: integer or null if unclear
- seniority_level: one of "junior", "mid", "senior", or null if unclear
- suggested_roles: realistic job roles based on the resume
- Do not guess or infer technologies, skills, languages, roles, seniority, or experience unless they are explicitly supported by the resume text.
- If a field is unclear, return an empty array or null.

Resume text:
\"\"\"
{raw_text}
\"\"\"
""".strip()


def parse_resume_with_ai(raw_text: str) -> dict:
    client = get_anthropic_client()
    prompt = build_resume_parsing_prompt(raw_text)

    # بخش اول: فقط خطاهای شبکه و API در اینجا مدیریت می‌شوند (پیشنهاد کلاد)
    try:
        response = client.messages.create(
            model=settings.RESUME_PARSING_MODEL,
            max_tokens=1000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as exc:
        message = str(exc).lower()
        if "credit balance is too low" in message:
            raise ResumeAIUnavailableError(
                "AI resume parsing is temporarily unavailable. Please check API billing."
            ) from exc
        if "api key" in message or "authentication" in message:
            raise ResumeAIUnavailableError(
                "AI resume parsing unavailable due to provider configuration."
            ) from exc
        raise ResumeAIUnavailableError(
            f"AI provider returned an unexpected error: {exc}"
        ) from exc

    # بخش دوم: استخراج متن و پارسینگ
    text_parts = [
        block.text
        for block in response.content
        if getattr(block, "type", None) == "text"
    ]
    raw_output = "\n".join(text_parts).strip()

    if not raw_output:
        raise ResumeParsingError("AI returned an empty response.")

    cleaned_json_str = _extract_json_object(raw_output)

    try:
        parsed = json.loads(cleaned_json_str)
    except json.JSONDecodeError as exc:
        raise ResumeParsingError(
            f"AI did not return valid JSON. Raw output: {raw_output}"
        ) from exc

    try:
        validated = ParsedResumeProfile(
            skills=parsed.get("skills", []),
            technologies=parsed.get("technologies", []),
            languages=parsed.get("languages", []),
            years_of_experience=parsed.get("years_of_experience"),
            seniority_level=parsed.get("seniority_level"),
            suggested_roles=parsed.get("suggested_roles", []),
        )
    except ValidationError as exc:
        raise ResumeParsingError(f"Failed to validate resume fields: {exc}") from exc

    return validated.model_dump()