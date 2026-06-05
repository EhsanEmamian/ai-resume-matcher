from __future__ import annotations

import logging
import re
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "de-AT,de;q=0.9,en;q=0.5",
}

MIN_DESCRIPTION_WORDS = 80

_DESCRIPTION_SELECTORS = [
    {"itemprop": "description"},
    {"class": re.compile(r"job-desc", re.I)},
    {"class": re.compile(r"advert", re.I)},
    {"class": re.compile(r"listing", re.I)},
    {"class": re.compile(r"job-detail", re.I)},
    {"id": re.compile(r"description", re.I)},
]

_BOILERPLATE_CLASS_SUBSTRINGS = (
    "header", "footer", "navbar", "nav-", "search-bar", "searchbar",
    "cookie", "banner", "sidebar", "breadcrumb", "pagination",
    "similar-jobs", "job-alert", "email-alert", "apply-btn", "apply-button",
)

_BOILERPLATE_TEXT_MATCHES = (
    "Was?", "Wo?", "Suche", "Erweiterte Suche", "zurück zur letzten Suche",
    "Auf diesen Job bewerben", "Jetzt ähnliche Jobs", "Job-E-Mail", "Ähnliche Jobs",
)


def _strip_ui_boilerplate(soup: BeautifulSoup) -> None:
    """
    Remove UI boilerplate elements from the soup before text extraction.
    Modifies the soup in place.
    """
    # Remove specific tags
    for tag_name in ["header", "footer", "nav", "aside", "form", "script", "style", "noscript"]:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    # Remove buttons
    for button in soup.find_all("button"):
        button.decompose()

    # Remove elements with specific roles
    for role in ["search", "banner", "navigation"]:
        for elem in soup.find_all(attrs={"role": role}):
            elem.decompose()

    # Remove elements with boilerplate class substrings
    for elem in soup.find_all(True):
        class_attr = elem.get("class") or []
        if isinstance(class_attr, list):
            class_value = " ".join(str(c) for c in class_attr).lower()
        else:
            class_value = str(class_attr).lower()

        if any(substring in class_value for substring in _BOILERPLATE_CLASS_SUBSTRINGS):
            elem.decompose()

    # Remove <a> and <div> elements with boilerplate text
    for elem in soup.find_all(["a", "div"]):
        text = elem.get_text(strip=True)
        if any(text == match or text.startswith(match) for match in _BOILERPLATE_TEXT_MATCHES):
            elem.decompose()


def _build_native_url(redirect_url: str, job_id: str) -> str:
    """
    Derive the Adzuna-native canonical URL from the redirect_url and job ID.

    redirect_url is typically:
        https://www.adzuna.at/land/ad/5022594430?v=1&adref=...
    We reconstruct:
        https://www.adzuna.at/details/5022594430
    """
    parsed = urlparse(redirect_url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    return f"{base}/details/{job_id}"


def _extract_description_from_soup(soup: BeautifulSoup) -> str | None:
    """Try each selector in order; return the first substantial text block."""
    # Strip UI boilerplate before text extraction
    _strip_ui_boilerplate(soup)

    for selector in _DESCRIPTION_SELECTORS:
        element = soup.find(attrs=selector)
        if element:
            text = element.get_text(separator="\n", strip=True)
            if len(text.split()) >= MIN_DESCRIPTION_WORDS:
                return text

    candidates = soup.find_all(["div", "section", "article"])
    if candidates:
        best = max(
            candidates,
            key=lambda el: len(el.get_text(strip=True)),
        )
        text = best.get_text(separator="\n", strip=True)
        if len(text.split()) >= MIN_DESCRIPTION_WORDS:
            return text

    return None


def _fetch_without_js_redirect(url: str, timeout: float) -> httpx.Response | None:
    """
    Fetch the URL following only HTTP-level redirects (301/302/307/308).
    Deliberately ignores meta-refresh and JS window.location.
    """
    try:
        with httpx.Client(
            headers=HEADERS,
            timeout=timeout,
            follow_redirects=True,
            max_redirects=4,
        ) as client:
            response = client.get(url)
            response.raise_for_status()
            return response
    except httpx.TimeoutException:
        logger.warning("Timeout fetching Adzuna native page: %s", url)
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "HTTP %s for Adzuna native page: %s",
            exc.response.status_code,
            url,
        )
    except httpx.RequestError as exc:
        logger.warning("Request error for Adzuna native page: %s", exc)
    return None


def fetch_adzuna_native_description(
    job_id: str,
    redirect_url: str,
    *,
    timeout: float = 10.0,
) -> tuple[str | None, str]:
    """
    Fetch the full job description from Adzuna's own hosted page.

    Strategy:
      1. Try the canonical /details/{id} URL first
      2. Fall back to the redirect_url itself
      3. In both cases: fetch without following JS redirects

    Returns:
        (description_text, status)

        status values:
            "success"       — extracted full description from Adzuna page
            "too_short"     — fetched OK but not enough text
            "fetch_failed"  — both URLs failed to load
    """
    canonical_url = _build_native_url(redirect_url, job_id)

    urls_to_try = [canonical_url]
    if redirect_url and redirect_url != canonical_url:
        urls_to_try.append(redirect_url)

    last_response: httpx.Response | None = None

    for url in urls_to_try:
        logger.debug("Fetching Adzuna native page: %s", url)
        response = _fetch_without_js_redirect(url, timeout)

        if response is None:
            continue

        last_response = response
        soup = BeautifulSoup(response.text, "html.parser")
        description = _extract_description_from_soup(soup)

        if description:
            logger.info(
                "Adzuna native fetch succeeded (%d words): %s",
                len(description.split()),
                url,
            )
            return description, "success"

        logger.debug("Page fetched but description too short: %s", url)

    word_count = 0
    if last_response is not None:
        word_count = len(
            BeautifulSoup(last_response.text, "html.parser").get_text().split()
        )

    status = "too_short" if word_count > 0 else "fetch_failed"
    return None, status
