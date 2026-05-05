import json
from dataclasses import dataclass

from app.ai.client import get_anthropic_client
from app.ai.resume_parser import ResumeAIUnavailableError
from app.config import settings


RESUME_POSITIVE_HINTS = [
    "experience",
    "work experience",
    "employment",
    "education",
    "skills",
    "projects",
    "resume",
    "cv",
    "linkedin",
    "github",
    "portfolio",
    "berufserfahrung",
    "ausbildung",
    "kenntnisse",
    "fähigkeiten",
    "lebenslauf",
    "projekte",
]

NON_RESUME_STRONG_SIGNALS = [
    "invoice",
    "rechnung",
    "miete",
    "sozialbau",
    "kündigung",
    "lease",
    "tenant",
    "rental",
    "wohnung",
    "housing",
    "payment",
    "iban",
    "bic",
    "uid-nr",
    "angebot",
    "vertragsnummer",
    "kundennummer",
]


class ResumeValidationError(Exception):
    pass


@dataclass
class DocumentValidationResult:
    is_resume: bool
    document_type: str
    confidence: float
    rejection_reason: str | None


def build_resume_validation_prompt(raw_text: str) -> str:
    return f"""
You are a document classifier.

Your only task is to decide whether the provided document text is clearly a professional resume or CV.

A professional resume/CV typically contains:
- a person's name and contact details
- work experience, employment history, or projects
- education history
- skills, technologies, languages, or qualifications
- a clear intent to present a person's professional background

Return valid JSON only.
Do not wrap it in markdown.
Do not include explanations.
Do not include extra text before or after the JSON.

When uncertain, set is_resume to false.

JSON format:
{{
  "is_resume": true,
  "document_type": "resume",
  "confidence": 0.95,
  "rejection_reason": null
}}

Allowed values for document_type:
- "resume"
- "cover_letter"
- "invoice"
- "housing_notice"
- "letter"
- "legal_document"
- "form"
- "academic_paper"
- "unknown"

Rules:
- Only set is_resume=true if the document is clearly and primarily a resume or CV
- If the document is not clearly a resume/CV, set is_resume=false
- If the document is not a resume, provide a short rejection_reason
- confidence must reflect genuine certainty, not optimism

Document text:
\"\"\"
{raw_text}
\"\"\"
""".strip()


def _count_keyword_hits(text: str, keywords: list[str]) -> int:
    lowered = text.lower()
    return sum(1 for keyword in keywords if keyword in lowered)


def _extract_json_object(raw_output: str) -> str:
    text = raw_output.strip()

    if text.startswith("```"):
        lines = text.splitlines()

        if lines and lines[0].strip().startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        text = "\n".join(lines).strip()

    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1 or end <= start:
        return text

    return text[start : end + 1]


def _rule_based_resume_rejection(raw_text: str) -> DocumentValidationResult | None:
    lowered = raw_text.lower()
    word_count = len(lowered.split())

    if word_count < 150:
        return DocumentValidationResult(
            is_resume=False,
            document_type="unknown",
            confidence=0.99,
            rejection_reason=(
                "We could not extract enough readable text from this PDF. "
                "If your file is a scanned image, please export it as a text-based PDF."
            ),
        )

    negative_hits = _count_keyword_hits(lowered, NON_RESUME_STRONG_SIGNALS)
    positive_hits = _count_keyword_hits(lowered, RESUME_POSITIVE_HINTS)

    if negative_hits >= 3 and positive_hits == 0:
        return DocumentValidationResult(
            is_resume=False,
            document_type="unknown",
            confidence=0.95,
            rejection_reason=(
                "This document does not look like a resume or CV. "
                "Please upload a valid resume PDF."
            ),
        )

    if negative_hits >= 4 and positive_hits <= 1:
        return DocumentValidationResult(
            is_resume=False,
            document_type="unknown",
            confidence=0.9,
            rejection_reason=(
                "This document appears to be something other than a resume or CV. "
                "Please upload a valid resume PDF."
            ),
        )

    return None


def validate_resume_document(raw_text: str) -> DocumentValidationResult:
    rule_based_result = _rule_based_resume_rejection(raw_text)
    if rule_based_result is not None:
        return rule_based_result

    client = get_anthropic_client()
    prompt = build_resume_validation_prompt(raw_text)

    try:
        response = client.messages.create(
            model=settings.RESUME_VALIDATION_MODEL,
            max_tokens=400,
            temperature=0,
            messages=[
                {"role": "user", "content": prompt}
            ],
        )
    except Exception as exc:
        message = str(exc).lower()

        if "credit balance is too low" in message:
            raise ResumeAIUnavailableError(
                "AI resume validation is temporarily unavailable. Please try again later or check API billing configuration."
            ) from exc

        if "api key" in message or "authentication" in message:
            raise ResumeAIUnavailableError(
                "AI resume validation is temporarily unavailable due to AI provider configuration."
            ) from exc

        raise ResumeValidationError("Resume validation failed. Please try again later.") from exc

    text_parts: list[str] = []

    for block in response.content:
        if getattr(block, "type", None) == "text":
            text_parts.append(block.text)

    raw_output = "\n".join(text_parts).strip()

    if not raw_output:
        raise ResumeValidationError("Resume validation returned an empty response.")

    json_text = _extract_json_object(raw_output)

    try:
        parsed = json.loads(json_text)
    except json.JSONDecodeError as exc:
        raise ResumeValidationError(
            f"Resume validation did not return valid JSON. Raw output: {raw_output}"
        ) from exc

    required_keys = {"is_resume", "document_type", "confidence", "rejection_reason"}
    missing = required_keys - set(parsed.keys())
    if missing:
        raise ResumeValidationError(
            f"Resume validation response is missing keys: {sorted(missing)}"
        )

    result = DocumentValidationResult(
        is_resume=bool(parsed["is_resume"]),
        document_type=str(parsed["document_type"]),
        confidence=float(parsed["confidence"]),
        rejection_reason=parsed["rejection_reason"],
    )

    if result.confidence < 0.6:
        return DocumentValidationResult(
            is_resume=False,
            document_type=result.document_type or "unknown",
            confidence=result.confidence,
            rejection_reason=(
                "This document does not clearly look like a resume or CV. "
                "Please upload a valid resume PDF."
            ),
        )

    return result