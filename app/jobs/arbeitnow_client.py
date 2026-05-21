from __future__ import annotations

import html
import re
from datetime import datetime, timezone

import httpx

from app.jobs.base_client import BaseJobProvider
from app.jobs.schemas import ExternalJobSearchRequest
from app.jobs.skill_extractor import (
    extract_experience_requirement_from_text,
    extract_languages_from_text,
    extract_salary_text_from_text,
    extract_skills_from_text,
)

ARBEITNOW_API_URL = "https://www.arbeitnow.com/api/job-board-api"


def _parse_posted_at(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def _strip_html(text: str | None) -> str:
    if not text:
        return ""

    text = html.unescape(text)
    text = re.sub(r"(?is)<script.*?>.*?</script>", " ", text)
    text = re.sub(r"(?is)<style.*?>.*?</style>", " ", text)
    
    # تبدیل تگ‌های بلوکی به خط جدید برای حفظ خوانایی متن و ساختار بولت‌پوینت‌ها
    text = re.sub(r"(?i)</?(p|div|br|li|ul|ol|h1|h2|h3|h4|section|article|tr|td|th)[^>]*>", "\n", text)
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    text = re.sub(r" *\n *", "\n", text)
    
    return text.strip()


def _normalize_arbeitnow_job(item: dict) -> dict:
    title = item.get("title") or "Untitled job"
    company = item.get("company_name") or "Unknown company"
    
    raw_description = item.get("description") or ""
    description = _strip_html(raw_description)
    
    slug = item.get("slug") or ""

    url = item.get("url") or (
        f"https://www.arbeitnow.com/jobs/{slug}" if slug else ""
    )

    location = item.get("location") or None
    tags = item.get("tags") or []

    # بهبود تشخیص ریموت با بررسی کلمات کلیدی (مثل Adzuna)
    text_for_remote = f"{title} {location or ''} {description}".lower()
    remote = any("remote" in str(tag).lower() for tag in tags) or bool(item.get("remote")) or any(
        term in text_for_remote for term in ["remote", "home office", "homeoffice", "work from home", "hybrid"]
    )

    # استخراج هوشمند اطلاعات از متن
    extracted_skills = extract_skills_from_text(title, description)
    extracted_languages = extract_languages_from_text(title, description)
    extracted_experience = extract_experience_requirement_from_text(title, description)
    extracted_salary_text = extract_salary_text_from_text(title, description)

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
        "salary_text": extracted_salary_text,
        "required_skills": extracted_skills,
        "required_languages": extracted_languages,
        "experience_requirement": extracted_experience,
        "source_text": description or None,
        "enrichment_status": "success" if description else "not_attempted",
        "enrichment_error": None,
        "enrichment_failure_reason": None,
        "enrichment_raw_html_length": None,
        "enrichment_text_word_count": len(description.split()) if description else None,
        "enrichment_text_preview": description[:300] if description else None,
    }


class ArbeitnowClient(BaseJobProvider):
    def search(self, request: ExternalJobSearchRequest) -> list[dict]:
        response = httpx.get(
            ARBEITNOW_API_URL,
            timeout=20.0,
            params={"page": request.page},
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

        keyword_lower = (request.keyword or "").strip().lower()
        location_lower = (request.location or "").strip().lower()

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

        return filtered[: request.max_results]


def search_arbeitnow_jobs(
    keyword: str,
    location: str | None = None,
    page: int = 1,
    max_results: int = 20,
) -> list[dict]:
    return ArbeitnowClient().search(
        ExternalJobSearchRequest(
            keyword=keyword,
            location=location or "",
            page=page,
            max_results=max_results,
            source="arbeitnow",
        )
    )