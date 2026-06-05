from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger(__name__)


def fetch_via_zenrows(target_url: str) -> str | None:
    """
    Fetch a URL through ZenRows API to bypass anti-bot protection.

    Args:
        target_url: The URL to fetch

    Returns:
        The HTML response text on success, None on failure
    """
    api_key = os.getenv("ZENROWS_API_KEY")
    if not api_key:
        logger.warning("ZENROWS_API_KEY not set in environment variables")
        return None

    try:
        response = httpx.get(
            "https://api.zenrows.com/v1/",
            params={
                "url": target_url,
                "apikey": api_key,
                "mode": "auto",
            },
            timeout=30,
        )
        response.raise_for_status()
        return response.text
    except httpx.HTTPStatusError as exc:
        logger.warning(f"ZenRows request failed with HTTP status {exc.response.status_code}: {exc}")
        return None
    except httpx.TimeoutException as exc:
        logger.warning(f"ZenRows request timed out: {exc}")
        return None
    except Exception as exc:
        logger.warning(f"ZenRows request failed: {exc}")
        return None
