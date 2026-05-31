from __future__ import annotations

import re
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

DEFAULT_TIMEOUT = 15.0
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;"
        "q=0.9,image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
}

INTERSTITIAL_BODY_TEXT_MAX = 800
INTERSTITIAL_TEXT_PATTERNS = (
    "redirect",
    "redirected",
    "weitergeleitet",
    "you will now be redirected",
    "see the ad here",
    "see the listing here",
    "adzuna-jobsuche",
    "myability",
    "please wait",
    "window.location",
)

META_REFRESH_URL_PATTERN = re.compile(
    r"\d+\s*;\s*url\s*=\s*([^\"'>\s;]+)",
    re.IGNORECASE,
)

WINDOW_LOCATION_PATTERNS = (
    re.compile(
        r'window\.location(?:\.href)?\s*=\s*["\']([^"\']+)["\']',
        re.IGNORECASE,
    ),
    re.compile(
        r'window\.location\.replace\s*\(\s*["\']([^"\']+)["\']',
        re.IGNORECASE,
    ),
    re.compile(
        r'location\.href\s*=\s*["\']([^"\']+)["\']',
        re.IGNORECASE,
    ),
    re.compile(
        r'window\.location\.assign\s*\(\s*["\']([^"\']+)["\']',
        re.IGNORECASE,
    ),
)


def _visible_body_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    return soup.get_text(separator=" ", strip=True)


def _is_interstitial(html: str) -> bool:
    body_text = _visible_body_text(html)
    if len(body_text) >= INTERSTITIAL_BODY_TEXT_MAX:
        return False

    lowered_html = html.lower()
    lowered_text = body_text.lower()
    has_redirect_pattern = any(
        pattern in lowered_html or pattern in lowered_text
        for pattern in INTERSTITIAL_TEXT_PATTERNS
    )
    return has_redirect_pattern


def _normalize_target_url(raw_url: str, base_url: str) -> str | None:
    candidate = raw_url.strip().strip('"').strip("'")
    if not candidate or candidate.startswith("javascript:"):
        return None
    return urljoin(base_url, candidate)


def _extract_meta_refresh_url(html: str, base_url: str) -> str | None:
    soup = BeautifulSoup(html, "html.parser")
    for meta in soup.find_all("meta"):
        http_equiv = (meta.get("http-equiv") or meta.get("http_equiv") or "").lower()
        if http_equiv != "refresh":
            continue

        content = meta.get("content") or ""
        match = META_REFRESH_URL_PATTERN.search(content)
        if match:
            return _normalize_target_url(match.group(1), base_url)

    return None


def _extract_js_redirect_url(html: str, base_url: str) -> str | None:
    for pattern in WINDOW_LOCATION_PATTERNS:
        match = pattern.search(html)
        if match:
            target = _normalize_target_url(match.group(1), base_url)
            if target:
                return target
    return None


def extract_redirect_target(html: str, base_url: str) -> str | None:
    """Extract a destination URL from meta refresh or JS redirect markup."""
    return _extract_meta_refresh_url(html, base_url) or _extract_js_redirect_url(
        html, base_url
    )


def resolve_redirect_url(url: str) -> tuple[str, str]:
    """
    Fetch a source URL and resolve interstitial redirect targets when possible.

    Returns:
        (final_url, status)

    Status values:
        - direct: response looks like a real page; fetch final_url for content
        - resolved: interstitial target extracted; fetch final_url for content
        - interstitial_unresolved: redirect wall detected but no target URL found
        - timeout / blocked / fetch_failed: first HTTP request failed
    """
    if not url.strip():
        return url, "fetch_failed"

    try:
        response = httpx.get(
            url,
            timeout=DEFAULT_TIMEOUT,
            follow_redirects=True,
            headers=DEFAULT_HEADERS,
        )
    except httpx.TimeoutException:
        return url, "timeout"
    except Exception:
        return url, "fetch_failed"

    if response.status_code in {401, 403}:
        return str(response.url), "blocked"

    if response.status_code >= 400:
        return str(response.url), "fetch_failed"

    current_url = str(response.url)
    html = response.text or ""

    if not _is_interstitial(html):
        return current_url, "direct"

    target_url = extract_redirect_target(html, current_url)
    if not target_url or target_url == current_url:
        return current_url, "interstitial_unresolved"

    return target_url, "resolved"
