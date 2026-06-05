import asyncio
import logging
import re
from datetime import datetime
from typing import Any
from urllib.parse import urlparse

import httpx

from app.config import settings
from app.exceptions import AppError
from app.jobs.base_client import BaseJobProvider
from app.jobs.schemas import ExternalJobSearchRequest
from app.jobs.service import resolve_provider_search_keyword
from app.jobs.skill_extractor import (
    extract_experience_requirement_from_text,
    extract_languages_from_text,
    extract_salary_text_from_text,
    extract_skills_from_text,
)

logger = logging.getLogger(__name__)

# ── Known external job board domains ─────────────────────────────────────────
EXTERNAL_JOB_BOARDS: frozenset[str] = frozenset({
    "stepstone.de", "stepstone.at", "stepstone.com",
    "linkedin.com", "indeed.com", "indeed.co.uk",
    "monster.com", "monster.de", "monster.at",
    "xing.com", "glassdoor.com", "glassdoor.co.uk",
    "jobs.ch", "jobs.de", "karriere.at",
    "jobrapido.com", "jooble.org",
    "reed.co.uk", "totaljobs.com", "cwjobs.co.uk",
    "jobsite.co.uk", "fish4.co.uk",
    "experteer.com", "experteer.de",
    "workday.com", "greenhouse.io", "lever.co",
    "icims.com", "taleo.net", "successfactors.com",
})

ADZUNA_DOMAINS: frozenset[str] = frozenset({
    "www.adzuna.at", "adzuna.at", "www.adzuna.de", "adzuna.de",
    "www.adzuna.co.uk", "adzuna.co.uk", "www.adzuna.com", "adzuna.com",
    "www.adzuna.com.au", "adzuna.com.au", "www.adzuna.ca", "adzuna.ca",
    "www.adzuna.fr", "adzuna.fr", "www.adzuna.it", "adzuna.it",
    "www.adzuna.nl", "adzuna.nl", "www.adzuna.pl", "adzuna.pl",
    "www.adzuna.ru", "adzuna.ru", "www.adzuna.sg", "adzuna.sg",
    "www.adzuna.nz", "adzuna.nz", "www.adzuna.in", "adzuna.in",
    "www.adzuna.br", "adzuna.br", "www.adzuna.mx", "adzuna.mx",
    "www.adzuna.za", "adzuna.za",
})

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
}

class AdzunaClientError(AppError):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message=message, status_code=status_code)


def _get_domain(url: str) -> str:
    try:
        return urlparse(url).netloc.lower()
    except Exception:
        return ""


def _is_adzuna_domain(domain: str) -> bool:
    return domain in ADZUNA_DOMAINS or domain.endswith(".adzuna.com")


def is_blocked_by_blocklist(redirect_url: str) -> bool:
    url_lower = redirect_url.lower()
    for blocked in EXTERNAL_JOB_BOARDS:
        if blocked in url_lower:
            return True
    return False


# ── Async Filtering Logic ──────────────────────────────────────────────────

async def _probe_native_async(
    client: httpx.AsyncClient, 
    job: dict[str, Any], 
    timeout: float
) -> tuple[dict[str, Any], bool]:
    """Returns (job, is_native) tuple."""
    redirect_url = job.get("redirect_url", "")
    job_id = str(job.get("id", ""))
    
    if not redirect_url or not job_id:
        return job, False

    # Layer 1: Blocklist
    if is_blocked_by_blocklist(redirect_url):
        return job, False

    # Layer 2: Async HEAD probe
    try:
        response = await client.head(redirect_url, follow_redirects=True)
        final_domain = _get_domain(str(response.url))
        return job, _is_adzuna_domain(final_domain)
    except Exception:
        # Fallback: check /details/ endpoint
        try:
            parsed = urlparse(redirect_url)
            details_url = f"{parsed.scheme}://{parsed.netloc}/details/{job_id}"
            r = await client.head(details_url, follow_redirects=False)
            return job, r.status_code == 200
        except Exception:
            return job, False


async def filter_native_async(raw_jobs: list[dict[str, Any]], timeout: float = 4.0) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=timeout) as client:
        tasks = [_probe_native_async(client, job, timeout) for job in raw_jobs]
        results = await asyncio.gather(*tasks)
        
    native_jobs = [job for job, is_native in results if is_native]
    logger.info("Adzuna async filter: %d native / %d total", len(native_jobs), len(raw_jobs))
    return native_jobs


def run_async_filter_sync(raw_jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Helper to run the async filter safely inside a synchronous function."""
    try:
        # Check if an event loop is already running (e.g., inside an async FastAPI route)
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # If running inside an existing loop, we must create a task or use nest_asyncio.
        # But standard FastAPI sync routes run in a separate thread, so asyncio.run() works fine.
        import nest_asyncio
        nest_asyncio.apply()
        return asyncio.run(filter_native_async(raw_jobs))
    
    return asyncio.run(filter_native_async(raw_jobs))


# ── Normalization & Client ─────────────────────────────────────────────────

def _parse_posted_at(value: str | None) -> datetime | None:
    if not value: return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None

def _detect_remote(title: str, location: str | None, description: str) -> bool:
    text = f"{title} {location or ''} {description}".lower()
    return any(term in text for term in ["remote", "home office", "homeoffice", "work from home", "fully remote", "hybrid"])


def _normalize_job(job: dict[str, Any]) -> dict[str, Any]:
    title = job.get("title") or "Untitled Job"
    description = job.get("description") or ""

    return {
        "title": title,
        "company": (job.get("company") or {}).get("display_name") or "Unknown Company",
        "description": description,
        "required_skills": extract_skills_from_text(title=title, description=description),
        "required_languages": extract_languages_from_text(title=title, description=description),
        "experience_requirement": extract_experience_requirement_from_text(title=title, description=description),
        "salary_text": extract_salary_text_from_text(title=title, description=description),
        "location": (job.get("location") or {}).get("display_name"),
        "remote": _detect_remote(title, (job.get("location") or {}).get("display_name"), description),
        "source": "adzuna",
        "source_id": str(job.get("id")) if job.get("id") is not None else None,
        "source_url": job.get("redirect_url"),
        "salary_min": job.get("salary_min"),
        "salary_max": job.get("salary_max"),
        "contract_type": job.get("contract_type") or job.get("contract_time"),
        "category": (job.get("category") or {}).get("tag"),
        "posted_at": _parse_posted_at(job.get("created")),
    }


class AdzunaClient(BaseJobProvider):
    def search(self, request: ExternalJobSearchRequest, native_only: bool = True) -> list[dict[str, Any]]:
        if not settings.ADZUNA_APP_ID or not settings.ADZUNA_APP_KEY:
            raise AdzunaClientError("Adzuna credentials are not configured.", status_code=400)

        url = f"{settings.ADZUNA_BASE_URL}/{request.country}/search/{request.page}"

        # Fetch more jobs (e.g., 3x max_results) to ensure we have enough after filtering
        fetch_limit = request.max_results * 3 if native_only else request.max_results

        params = {
            "app_id": settings.ADZUNA_APP_ID,
            "app_key": settings.ADZUNA_APP_KEY,
            "results_per_page": fetch_limit,
            "what": resolve_provider_search_keyword(request.keyword, source="adzuna"),
        }

        if request.location.strip():
            params["where"] = request.location.strip()

        try:
            response = httpx.get(url, params=params, timeout=20.0)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.error("Adzuna API fetch failed: %s", exc)
            raise AdzunaClientError("Failed to fetch data from Adzuna.") from exc

        raw_jobs = response.json().get("results", [])

        if native_only:
            logger.info("Adzuna returned %d raw jobs. Filtering concurrently...", len(raw_jobs))
            raw_jobs = run_async_filter_sync(raw_jobs)
        
        # Slice back to the requested max_results and normalize
        return [_normalize_job(job) for job in raw_jobs[:request.max_results]]


def search_jobs(keyword: str, location: str, country: str, max_results: int, page: int = 1) -> list[dict[str, Any]]:
    return AdzunaClient().search(
        ExternalJobSearchRequest(
            keyword=keyword, location=location, country=country,
            max_results=max_results, page=page, source="adzuna",
        ),
        native_only=True
    )


def fetch_jobs(keyword: str, location: str, country: str, max_results: int) -> list[dict[str, Any]]:
    return search_jobs(keyword=keyword, location=location, country=country, max_results=max_results, page=1)