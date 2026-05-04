from __future__ import annotations

from datetime import datetime, timezone

import httpx


ARBEITNOW_API_URL = "https://www.arbeitnow.com/api/job-board-api"


def _parse_posted_at(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def _normalize_arbeitnow_job(item: dict) -> dict:
    title = item.get("title") or "Untitled job"
    company = item.get("company_name") or "Unknown company"
    description = item.get("description") or ""
    slug = item.get("slug") or ""

    url = item.get("url") or (
        f"https://www.arbeitnow.com/jobs/{slug}" if slug else ""
    )

    location = item.get("location") or None
    tags = item.get("tags") or []
    remote = any("remote" in str(tag).lower() for tag in tags) or bool(
        item.get("remote")
    )

    return {
        "source": "arbeitnow",
        "source_id": str(item.get("slug") or item.get("id") or title),
        "source_url": url,
        "title": title,
        "company": company,
        "description": description,
        "location": location,
        "remote": remote,
        "posted_at": _parse_posted_at(item.get("created_at"))
        or datetime.now(timezone.utc),
        "category": item.get("category") or "tech-jobs",
        "contract_type": None,
        "salary_min": None,
        "salary_max": None,
        "salary_text": None,
        "required_skills": [],
        "required_languages": [],
        "experience_requirement": None,
        "source_text": description or None,
        "enrichment_status": "success" if description else "not_attempted",
        "enrichment_error": None,
        "enrichment_failure_reason": None,
        "enrichment_raw_html_length": None,
        "enrichment_text_word_count": len(description.split()) if description else None,
        "enrichment_text_preview": description[:300] if description else None,
    }


def search_arbeitnow_jobs(
    keyword: str,
    location: str | None = None,
    page: int = 1,
    max_results: int = 20,
) -> list[dict]:
    response = httpx.get(
        ARBEITNOW_API_URL,
        timeout=20.0,
        params={"page": page},
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        },
    )
    response.raise_for_status()

    data = response.json()
    items = data.get("data", [])

    keyword_lower = (keyword or "").strip().lower()
    location_lower = (location or "").strip().lower()

    filtered = []

    for item in items:
        haystack = " ".join(
            [
                str(item.get("title") or ""),
                str(item.get("company_name") or ""),
                str(item.get("description") or ""),
                " ".join(item.get("tags") or []),
                str(item.get("location") or ""),
            ]
        ).lower()

        if keyword_lower and keyword_lower not in haystack:
            continue

        if location_lower and location_lower not in str(
            item.get("location") or ""
        ).lower():
            continue

        filtered.append(_normalize_arbeitnow_job(item))

    return filtered[:max_results]