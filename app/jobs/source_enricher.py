from __future__ import annotations

import logging
import re
from dataclasses import dataclass

import httpx
from bs4 import BeautifulSoup, Tag

from app.jobs.adzuna_native_fetcher import fetch_adzuna_native_description
from app.jobs.enums import EnrichmentFailureReason, EnrichmentStatus
from app.jobs.url_extractor import DEFAULT_HEADERS, DEFAULT_TIMEOUT, resolve_redirect_url
from app.jobs.zenrows_client import fetch_via_zenrows

logger = logging.getLogger(__name__)


class SourceEnrichmentError(Exception):
    pass


@dataclass
class SourceEnrichmentResult:
    status: str
    text: str | None
    failure_reason: str | None = None
    error: str | None = None
    raw_html_length: int | None = None
    text_word_count: int | None = None
    text_preview: str | None = None


NOISY_TAG_NAMES = frozenset(
    {"nav", "header", "footer", "aside", "script", "style", "noscript"}
)
NOISY_CLASS_ID_PATTERN = re.compile(r"(menu|nav|footer)", re.IGNORECASE)

REDIRECT_INTERSTITIAL_INDICATORS = (
    "weitergeleitet",
    "redirected",
    "redirect",
    "see the ad here",
    "see the listing here",
    "you will now be redirected",
    "adzuna-jobsuche",
    "myability",
)

BOT_WALL_MARKERS = (
    "cloudflare",
    "access denied",
    "just a moment...",
)


def _element_has_noisy_class_or_id(tag: Tag) -> bool:
    element_id = tag.get("id") or ""
    class_attr = tag.get("class") or []
    if isinstance(class_attr, list):
        class_value = " ".join(str(item) for item in class_attr)
    else:
        class_value = str(class_attr)

    haystack = f"{element_id} {class_value}"
    return bool(NOISY_CLASS_ID_PATTERN.search(haystack))


def _remove_noisy_elements(soup: BeautifulSoup) -> None:
    for tag_name in NOISY_TAG_NAMES:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    for tag in soup.find_all(True):
        if isinstance(tag, Tag) and _element_has_noisy_class_or_id(tag):
            tag.decompose()


def _normalize_extracted_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _strip_html(html: str) -> str:
    if not html.strip():
        return ""

    soup = BeautifulSoup(html, "html.parser")
    _remove_noisy_elements(soup)
    text = soup.get_text(separator=" ", strip=True)
    return _normalize_extracted_text(text)


def _redirect_interstitial_result(
    *,
    error: str,
    raw_html_length: int | None = None,
    text_word_count: int | None = None,
    text_preview: str | None = None,
) -> SourceEnrichmentResult:
    return SourceEnrichmentResult(
        status=EnrichmentStatus.FAILED,
        text=None,
        failure_reason=EnrichmentFailureReason.REDIRECT_INTERSTITIAL,
        error=error,
        raw_html_length=raw_html_length,
        text_word_count=text_word_count,
        text_preview=text_preview,
    )


def _fetch_html(url: str) -> tuple[str | None, str | None]:
    try:
        response = httpx.get(
            url,
            timeout=DEFAULT_TIMEOUT,
            follow_redirects=True,
            headers=DEFAULT_HEADERS,
        )
    except httpx.TimeoutException as exc:
        return None, f"timeout:{exc}"
    except Exception as exc:
        return None, f"fetch_failed:{exc}"

    if response.status_code in {401, 403}:
        return None, f"blocked:HTTP {response.status_code}"

    if response.status_code >= 400:
        return None, f"fetch_failed:HTTP {response.status_code}"

    return response.text or "", None


def _evaluate_html(raw_html: str) -> SourceEnrichmentResult:
    stripped = _strip_html(raw_html)
    raw_html_length = len(raw_html)
    text_word_count = len(stripped.split())
    text_preview = stripped[:300] if stripped else None
    lowered_preview = (text_preview or "").lower()

    if raw_html_length < 500:
        return SourceEnrichmentResult(
            status=EnrichmentStatus.FAILED,
            text=None,
            failure_reason=EnrichmentFailureReason.TOO_SHORT_RESPONSE,
            error=f"HTML too short: {raw_html_length} chars",
            raw_html_length=raw_html_length,
            text_word_count=text_word_count,
            text_preview=text_preview,
        )

    if any(indicator in lowered_preview for indicator in REDIRECT_INTERSTITIAL_INDICATORS):
        return _redirect_interstitial_result(
            error="Source URL resolved to an intermediate redirect/interstitial page",
            raw_html_length=raw_html_length,
            text_word_count=text_word_count,
            text_preview=text_preview,
        )

    if text_word_count < 80:
        return SourceEnrichmentResult(
            status=EnrichmentStatus.PARTIAL,
            text=None,
            failure_reason=EnrichmentFailureReason.TOO_SHORT_TEXT,
            error=f"Extracted text too short: {text_word_count} words",
            raw_html_length=raw_html_length,
            text_word_count=text_word_count,
            text_preview=text_preview,
        )

    lower_html = raw_html.lower()
    js_indicators = [
        "__next",
        "javascript is required",
        "enable javascript",
        "window.__",
        "app shell",
    ]

    if any(indicator in lower_html for indicator in js_indicators) and text_word_count < 200:
        return SourceEnrichmentResult(
            status=EnrichmentStatus.FAILED,
            text=None,
            failure_reason=EnrichmentFailureReason.JS_RENDERED,
            error="Likely JavaScript-rendered page shell",
            raw_html_length=raw_html_length,
            text_word_count=text_word_count,
            text_preview=text_preview,
        )

    return SourceEnrichmentResult(
        status=EnrichmentStatus.SUCCESS,
        text=stripped,
        failure_reason=None,
        error=None,
        raw_html_length=raw_html_length,
        text_word_count=text_word_count,
        text_preview=text_preview,
    )


def _success_from_plain_text(text: str) -> SourceEnrichmentResult:
    normalized = _normalize_extracted_text(text)
    word_count = len(normalized.split())
    return SourceEnrichmentResult(
        status=EnrichmentStatus.SUCCESS,
        text=normalized,
        failure_reason=None,
        error=None,
        raw_html_length=len(text),
        text_word_count=word_count,
        text_preview=normalized[:300] if normalized else None,
    )


def _generic_fetch_and_extract(source_url: str) -> SourceEnrichmentResult:
    final_url, resolve_status = resolve_redirect_url(source_url)

    if resolve_status == "interstitial_unresolved":
        return _redirect_interstitial_result(
            error="Could not extract destination URL from redirect interstitial page",
        )

    if resolve_status == "timeout":
        return SourceEnrichmentResult(
            status=EnrichmentStatus.FAILED,
            text=None,
            failure_reason=EnrichmentFailureReason.TIMEOUT,
            error="Timed out while resolving source URL",
        )

    if resolve_status == "blocked":
        return SourceEnrichmentResult(
            status=EnrichmentStatus.FAILED,
            text=None,
            failure_reason=EnrichmentFailureReason.BLOCKED,
            error="Blocked while resolving source URL",
        )

    if resolve_status == "fetch_failed":
        return SourceEnrichmentResult(
            status=EnrichmentStatus.FAILED,
            text=None,
            failure_reason=EnrichmentFailureReason.FETCH_FAILED,
            error="Failed to resolve source URL",
        )

    raw_html, fetch_error = _fetch_html(final_url)
    
    # Check if we should try ZenRows fallback
    should_try_zenrows = False
    zenrows_reason = None
    
    if fetch_error:
        # Check for 403 or 429 errors
        if "blocked:HTTP 403" in fetch_error or "blocked:HTTP 429" in fetch_error:
            should_try_zenrows = True
            zenrows_reason = f"HTTP error: {fetch_error}"
    elif raw_html:
        # Check for bot-wall markers in successful response
        lowered_html = raw_html.lower()
        if any(marker in lowered_html for marker in BOT_WALL_MARKERS):
            should_try_zenrows = True
            zenrows_reason = "Bot wall detected in response"
    
    if should_try_zenrows:
        logger.info(f"Attempting ZenRows fallback for {final_url}: {zenrows_reason}")
        zenrows_html = fetch_via_zenrows(final_url)
        if zenrows_html:
            logger.info("ZenRows fallback successful, evaluating HTML")
            return _evaluate_html(zenrows_html)
        else:
            logger.warning("ZenRows fallback failed, returning original error")
    
    if fetch_error:
        if resolve_status == "resolved":
            return _redirect_interstitial_result(
                error=(
                    "Extracted redirect target but failed to fetch final page; "
                    f"{fetch_error.split(':', 1)[0]}"
                ),
            )

        failure_reason = fetch_error.split(":", 1)[0]
        return SourceEnrichmentResult(
            status=EnrichmentStatus.FAILED,
            text=None,
            failure_reason=EnrichmentFailureReason(failure_reason),
            error=fetch_error.split(":", 1)[-1],
        )

    return _evaluate_html(raw_html or "")


def fetch_source_text_result(
    url: str,
    *,
    source: str = "unknown",
    source_id: str | None = None,
) -> SourceEnrichmentResult:
    if not url:
        return SourceEnrichmentResult(
            status=EnrichmentStatus.NOT_ATTEMPTED,
            text=None,
            failure_reason=EnrichmentFailureReason.NO_URL,
            error=None,
        )

    if source == "adzuna" and source_id:
        description, native_status = fetch_adzuna_native_description(
            job_id=source_id,
            redirect_url=url,
        )
        if native_status == EnrichmentStatus.SUCCESS and description:
            return _success_from_plain_text(description)

        logger.info(
            "Adzuna native fetch returned '%s' for job %s — falling back",
            native_status,
            source_id,
        )

    return _generic_fetch_and_extract(url)
