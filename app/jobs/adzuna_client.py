from datetime import datetime
from typing import Any

import httpx

from app.config import settings
from app.exceptions import AppError


class AdzunaClientError(AppError):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message=message, status_code=status_code)


def _parse_posted_at(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _normalize_job(job: dict[str, Any]) -> dict[str, Any]:
    return {
        "title": job.get("title") or "Untitled Job",
        "company": (job.get("company") or {}).get("display_name") or "Unknown Company",
        "description": job.get("description") or "",
        "required_skills": [],
        "location": (job.get("location") or {}).get("display_name"),
        "remote": False,
        "source": "adzuna",
        "source_id": str(job.get("id")) if job.get("id") is not None else None,
        "source_url": job.get("redirect_url"),
        "salary_min": job.get("salary_min"),
        "salary_max": job.get("salary_max"),
        "contract_type": job.get("contract_type") or job.get("contract_time"),
        "category": (job.get("category") or {}).get("tag"),
        "posted_at": _parse_posted_at(job.get("created")),
    }


def fetch_jobs(
    keyword: str,
    location: str,
    country: str,
    max_results: int,
) -> list[dict[str, Any]]:
    if not settings.ADZUNA_APP_ID or not settings.ADZUNA_APP_KEY:
        raise AdzunaClientError("Adzuna credentials are not configured.", status_code=400)

    url = f"{settings.ADZUNA_BASE_URL}/{country}/search/1"

    params = {
        "app_id": settings.ADZUNA_APP_ID,
        "app_key": settings.ADZUNA_APP_KEY,
        "results_per_page": max_results,
        "what": keyword,
    }

    if location.strip():
        params["where"] = location.strip()

    try:
        response = httpx.get(url, params=params, timeout=20.0)
        response.raise_for_status()
    except httpx.TimeoutException as exc:
        raise AdzunaClientError("Adzuna request timed out.") from exc
    except httpx.HTTPStatusError as exc:
        raise AdzunaClientError(
            f"Adzuna API returned HTTP {exc.response.status_code}."
        ) from exc
    except httpx.HTTPError as exc:
        raise AdzunaClientError("Failed to connect to Adzuna API.") from exc

    data = response.json()
    results = data.get("results", [])

    if not isinstance(results, list):
        raise AdzunaClientError("Unexpected Adzuna response format.")

    return [_normalize_job(job) for job in results]