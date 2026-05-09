from __future__ import annotations

import html
import re
from datetime import datetime
from typing import Any

import httpx

from app.config import settings
from app.exceptions import AppError
from app.jobs.skill_extractor import (
    extract_experience_requirement_from_text,
    extract_languages_from_text,
    extract_salary_text_from_text,
    extract_skills_from_text,
)


class JoobleClientError(AppError):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message=message, status_code=status_code)


COUNTRY_NAMES = {
    "at": "Austria",
    "de": "Germany",
    "ch": "Switzerland",
    "gb": "United Kingdom",
    "uk": "United Kingdom",
    "us": "United States",
}


def _strip_html(text: str | None) -> str:
    if not text:
        return ""

    text = html.unescape(text)
    text = re.sub(r"(?is)<script.*?>.*?</script>", " ", text)
    text = re.sub(r"(?is)<style.*?>.*?</style>", " ", text)
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def _parse_posted_at(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _build_location(location: str, country: str) -> str:
    cleaned_location = location.strip()
    if cleaned_location:
        return cleaned_location

    return COUNTRY_NAMES.get(country.lower(), "")


def _detect_remote(title: str, location: str | None, description: str) -> bool:
    text = f"{title} {location or ''} {description}".lower()
    return any(
        term in text
        for term in [
            "remote",
            "home office",
            "homeoffice",
            "work from home",
            "fully remote",
            "hybrid",
        ]
    )


def _normalize_jooble_job(job: dict[str, Any]) -> dict[str, Any]:
    title = job.get("title") or "Untitled Job"
    company = job.get("company") or "Unknown Company"

    raw_description = (
        job.get("snippet")
        or job.get("description")
        or job.get("summary")
        or ""
    )
    description = _strip_html(raw_description)

    location = job.get("location") or None
    source_url = job.get("link") or job.get("url")

    extracted_skills = extract_skills_from_text(
        title=title,
        description=description,
    )
    extracted_languages = extract_languages_from_text(
        title=title,
        description=description,
    )
    extracted_experience = extract_experience_requirement_from_text(
        title=title,
        description=description,
    )
    extracted_salary_text = extract_salary_text_from_text(
        title=title,
        description=description,
    )

    salary_text = job.get("salary") or extracted_salary_text

    return {
        "title": title,
        "company": company,
        "description": description or "No description provided.",
        "required_skills": extracted_skills,
        "required_languages": extracted_languages,
        "experience_requirement": extracted_experience,
        "salary_text": salary_text,
        "location": location,
        "remote": _detect_remote(title, location, description),
        "source": "jooble",
        "source_id": str(source_url or f"{title}-{company}-{location}"),
        "source_url": source_url,
        "salary_min": None,
        "salary_max": None,
        "contract_type": job.get("type"),
        "category": "job-search",
        "posted_at": _parse_posted_at(job.get("updated")),
        "source_text": None,
        "enrichment_status": None,
        "enrichment_error": None,
        "enrichment_failure_reason": None,
        "enrichment_raw_html_length": None,
        "enrichment_text_word_count": None,
        "enrichment_text_preview": None,
    }


def search_jooble_jobs(
    keyword: str,
    location: str,
    country: str,
    max_results: int,
    page: int = 1,
) -> list[dict[str, Any]]:
    if not settings.JOOBLE_API_KEY:
        raise JoobleClientError("Jooble API key is not configured.", status_code=400)

    base_url = settings.JOOBLE_BASE_URL.rstrip("/")
    url = f"{base_url}/{settings.JOOBLE_API_KEY}"

    payload = {
        "keywords": keyword,
        "location": _build_location(location, country),
        "page": page,
    }

    try:
        response = httpx.post(
            url,
            json=payload,
            timeout=20.0,
            headers={"Content-Type": "application/json"},
        )
        response.raise_for_status()
    except httpx.TimeoutException as exc:
        raise JoobleClientError("Jooble request timed out.") from exc
    except httpx.HTTPStatusError as exc:
        raise JoobleClientError(
            f"Jooble API returned HTTP {exc.response.status_code}."
        ) from exc
    except httpx.HTTPError as exc:
        raise JoobleClientError("Failed to connect to Jooble API.") from exc

    data = response.json()
    jobs = data.get("jobs", [])

    if not isinstance(jobs, list):
        raise JoobleClientError("Unexpected Jooble response format.")

    return [_normalize_jooble_job(job) for job in jobs[:max_results]]