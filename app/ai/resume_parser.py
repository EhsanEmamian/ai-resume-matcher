import json

from app.ai.client import get_anthropic_client


class ResumeParsingError(Exception):
    pass


class ResumeAIUnavailableError(Exception):
    pass


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
    try:
        client = get_anthropic_client()
        prompt = build_resume_parsing_prompt(raw_text)

        response = client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=1000,
            temperature=0,
            messages=[
                {"role": "user", "content": prompt}
            ],
        )

        text_parts: list[str] = []

        for block in response.content:
            if getattr(block, "type", None) == "text":
                text_parts.append(block.text)

        raw_output = "\n".join(text_parts).strip()

        if not raw_output:
            raise ResumeParsingError("AI returned an empty response.")

        try:
            parsed = json.loads(raw_output)
        except json.JSONDecodeError as exc:
            raise ResumeParsingError(
                f"AI did not return valid JSON. Raw output: {raw_output}"
            ) from exc

        required_keys = {
            "skills",
            "technologies",
            "languages",
            "years_of_experience",
            "seniority_level",
            "suggested_roles",
        }

        missing = required_keys - set(parsed.keys())
        if missing:
            raise ResumeParsingError(f"AI response is missing keys: {sorted(missing)}")

        return parsed

    except ResumeParsingError:
        raise
    except Exception as exc:
        message = str(exc).lower()

        if "credit balance is too low" in message:
            raise ResumeAIUnavailableError(
                "AI resume parsing is temporarily unavailable. Please try again later or check API billing configuration."
            ) from exc

        if "api key" in message or "authentication" in message:
            raise ResumeAIUnavailableError(
                "AI resume parsing is temporarily unavailable due to AI provider configuration."
            ) from exc

        raise ResumeParsingError("Resume parsing failed. Please try again later.") from exc