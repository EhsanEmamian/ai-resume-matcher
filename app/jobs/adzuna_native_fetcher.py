from __future__ import annotations

import logging
import re
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup, Tag

from app.jobs.enums import EnrichmentStatus

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
BOILERPLATE_TEXT_BUDGET = 50  # if element has more words than this, don't decompose it

# Adzuna description selectors — ordered by reliability
_DESCRIPTION_SELECTORS = [
    {"itemprop": "description"},
    {"class": re.compile(r"\bjob-desc\b", re.I)},
    {"class": re.compile(r"\badvert\b", re.I)},
    {"class": re.compile(r"\blisting\b", re.I)},
    {"class": re.compile(r"\bjob-detail\b", re.I)},
    {"id": re.compile(r"description", re.I)},
]

# Tags that are NEVER part of a job description
_SAFE_TO_REMOVE_TAGS = [
    "header", "footer", "nav", "aside",
    "script", "style", "noscript", "iframe",
]

# Class substrings — only decompose if word count is below BOILERPLATE_TEXT_BUDGET
_BOILERPLATE_CLASS_FRAGMENTS = [
    "navbar", "nav-bar", "site-header", "site-footer",
    "breadcrumb", "pagination", "cookie",
    "search-bar", "searchbar", "search-widget",
    "sidebar", "side-bar",
    # ↓ These are the dangerous ones — must check word count before decomposing
    "job-alert", "email-alert", "email-notification",
    "apply-btn", "apply-button", "cta-button",
    "similar-jobs", "related-jobs",
    "social-share", "share-buttons",
]

# Exact-text triggers for small UI elements
_BOILERPLATE_EXACT_TEXTS = frozenset({
    "Was?", "Wo?", "Suche", "Erweiterte Suche",
    "zurück zur letzten Suche", "Auf diesen Job bewerben",
    "Jetzt ähnliche Jobs", "Job-E-Mail", "Ähnliche Jobs",
    "E-Mail-Benachrichtigung erstellen",
})


def _word_count(element: Tag) -> int:
    return len(element.get_text(strip=True).split())


def _strip_ui_boilerplate(soup: BeautifulSoup) -> None:
    """
    Remove UI noise from the soup tree in-place.
    Critical safety rule: never decompose an element that contains
    more than BOILERPLATE_TEXT_BUDGET words — it might be wrapping
    real job description content.
    """
    # ── Pass 1: unconditionally safe tag removal ───────────────────────
    for tag_name in _SAFE_TO_REMOVE_TAGS:
        for el in soup.find_all(tag_name):
            el.decompose()

    # ── Pass 2: role-based removal (small UI regions) ──────────────────
    for role in ("search", "banner", "navigation", "complementary"):
        for el in soup.find_all(attrs={"role": role}):
            if _word_count(el) <= BOILERPLATE_TEXT_BUDGET:
                el.decompose()

    # ── Pass 3: class-based removal WITH word count guard ─────────────
    for el in soup.find_all(True):
        if not el.name:
            continue
        
        # Ensure class attribute is properly converted to a list of strings
        class_attr = el.get("class", [])
        if not isinstance(class_attr, list):
            class_attr = [class_attr]
            
        classes = " ".join(str(c) for c in class_attr).lower()
        el_id = str(el.get("id") or "").lower()
        combined = f"{classes} {el_id}"

        for fragment in _BOILERPLATE_CLASS_FRAGMENTS:
            if fragment in combined:
                words = _word_count(el)
                if words <= BOILERPLATE_TEXT_BUDGET:
                    # Safe — small UI element, decompose it
                    el.decompose()
                else:
                    # Dangerous — contains real content
                    # Only remove the element's own text nodes,
                    # not its children (preserve list items etc.)
                    for child in list(el.children):
                        if hasattr(child, "name") and child.name == "form":
                            child.decompose()
                        elif hasattr(child, "name") and child.name in ("button", "input"):
                            child.decompose()
                break  # matched one fragment — move to next element

    # ── Pass 4: exact-text button/link removal ────────────────────────
    for el in soup.find_all(["a", "button", "span", "p"]):
        text = el.get_text(strip=True)
        if text in _BOILERPLATE_EXACT_TEXTS:
            el.decompose()


def _build_native_url(redirect_url: str, job_id: str) -> str:
    """
    Derive the Adzuna-native canonical URL from the redirect_url and job ID.
    """
    parsed = urlparse(redirect_url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    return f"{base}/details/{job_id}"


def _extract_description_from_soup(soup: BeautifulSoup) -> str | None:
    """
    Extract job description text after boilerplate has been stripped.
    Stitches sibling containers to handle split descriptions.
    """
    # Strip boilerplate BEFORE looking for description containers
    _strip_ui_boilerplate(soup)

    # ── Primary: find the main description container ───────────────────
    main_container: Tag | None = None
    for selector in _DESCRIPTION_SELECTORS:
        el = soup.find(attrs=selector)
        if el and _word_count(el) >= MIN_DESCRIPTION_WORDS:
            main_container = el
            break

    if main_container is None:
        # Fallback: largest content block
        candidates = soup.find_all(["div", "section", "article"])
        if candidates:
            best = max(candidates, key=_word_count)
            if _word_count(best) >= MIN_DESCRIPTION_WORDS:
                main_container = best

    if main_container is None:
        return None

    # ── Sibling stitching: collect adjacent content blocks ─────────────
    text_parts = [main_container.get_text(separator="\n", strip=True)]
    for sibling in main_container.find_next_siblings(["div", "section"]):
        sibling_text = sibling.get_text(separator="\n", strip=True)
        words = len(sibling_text.split())
        
        # Stop at navigation or very long structural blocks
        if words < 20 or words > 800:
            break
            
        # Ensure class attribute is a list for checking
        sibling_classes_attr = sibling.get("class", [])
        if not isinstance(sibling_classes_attr, list):
            sibling_classes_attr = [sibling_classes_attr]
        sibling_classes = " ".join(str(c) for c in sibling_classes_attr).lower()

        # Don't include obvious UI siblings
        if any(f in sibling_classes for f in ("similar", "related", "alert", "modal")):
            break
            
        text_parts.append(sibling_text)

    full_text = "\n\n".join(text_parts).strip()
    
    if len(full_text.split()) < MIN_DESCRIPTION_WORDS:
        return None
        
    return full_text


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
            EnrichmentStatus.SUCCESS       — extracted full description from Adzuna page
            EnrichmentStatus.FAILED         — both URLs failed to load
            EnrichmentStatus.PARTIAL        — fetched OK but not enough text
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
            return description, EnrichmentStatus.SUCCESS

        logger.debug("Page fetched but description too short: %s", url)

    word_count = 0
    if last_response is not None:
        word_count = len(
            BeautifulSoup(last_response.text, "html.parser").get_text().split()
        )

    status = EnrichmentStatus.PARTIAL if word_count > 0 else EnrichmentStatus.FAILED
    return None, status