from __future__ import annotations

import re
from dataclasses import dataclass

import httpx


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


def _strip_html(html: str) -> str:
    html = re.sub(r"(?is)<script.*?>.*?</script>", " ", html)
    html = re.sub(r"(?is)<style.*?>.*?</style>", " ", html)
    html = re.sub(r"(?is)<noscript.*?>.*?</noscript>", " ", html)

    # Add line breaks around common block tags before removing HTML.
    html = re.sub(
        r"(?i)</?(p|div|br|li|ul|ol|h1|h2|h3|h4|section|article|tr|td|th)[^>]*>",
        "\n",
        html,
    )

    html = re.sub(r"(?s)<[^>]+>", " ", html)

    html = re.sub(r"&nbsp;", " ", html, flags=re.IGNORECASE)
    html = re.sub(r"&amp;", "&", html, flags=re.IGNORECASE)
    html = re.sub(r"&quot;", '"', html, flags=re.IGNORECASE)
    html = re.sub(r"&#39;", "'", html, flags=re.IGNORECASE)
    html = re.sub(r"&apos;", "'", html, flags=re.IGNORECASE)
    html = re.sub(r"&lt;", "<", html, flags=re.IGNORECASE)
    html = re.sub(r"&gt;", ">", html, flags=re.IGNORECASE)

    # Clean spaces but keep useful line breaks.
    html = re.sub(r"[ \t\r\f\v]+", " ", html)
    html = re.sub(r"\n\s*\n\s*\n+", "\n\n", html)
    html = re.sub(r" *\n *", "\n", html)

    return html.strip()


def fetch_source_text_result(url: str) -> SourceEnrichmentResult:
    if not url:
        return SourceEnrichmentResult(
            status="not_attempted",
            text=None,
            failure_reason="no_url",
            error=None,
        )

    try:
        response = httpx.get(
            url,
            timeout=15.0,
            follow_redirects=True,
            headers={
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
            },
        )
    except httpx.TimeoutException as exc:
        return SourceEnrichmentResult(
            status="failed",
            text=None,
            failure_reason="timeout",
            error=str(exc),
        )
    except Exception as exc:
        return SourceEnrichmentResult(
            status="failed",
            text=None,
            failure_reason="fetch_failed",
            error=str(exc),
        )

    if response.status_code in {401, 403}:
        return SourceEnrichmentResult(
            status="failed",
            text=None,
            failure_reason="blocked",
            error=f"HTTP {response.status_code}",
        )

    if response.status_code >= 400:
        return SourceEnrichmentResult(
            status="failed",
            text=None,
            failure_reason="fetch_failed",
            error=f"HTTP {response.status_code}",
        )

    raw_html = response.text or ""
    stripped = _strip_html(raw_html)

    raw_html_length = len(raw_html)
    text_word_count = len(stripped.split())
    text_preview = stripped[:300] if stripped else None

    lowered_preview = (text_preview or "").lower()
    redirect_indicators = [
        "weitergeleitet",
        "redirected",
        "redirect",
        "see the ad here",
        "see the listing here",
        "you will now be redirected",
        "adzuna-jobsuche",
        "myability",
    ]

    if raw_html_length < 500:
        return SourceEnrichmentResult(
            status="failed",
            text=None,
            failure_reason="too_short_response",
            error=f"HTML too short: {raw_html_length} chars",
            raw_html_length=raw_html_length,
            text_word_count=text_word_count,
            text_preview=text_preview,
        )

    if any(indicator in lowered_preview for indicator in redirect_indicators):
        return SourceEnrichmentResult(
            status="failed",
            text=None,
            failure_reason="redirect_interstitial",
            error="Source URL resolved to an intermediate redirect/interstitial page",
            raw_html_length=raw_html_length,
            text_word_count=text_word_count,
            text_preview=text_preview,
        )

    if text_word_count < 80:
        return SourceEnrichmentResult(
            status="partial",
            text=None,
            failure_reason="too_short_text",
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
            status="failed",
            text=None,
            failure_reason="js_rendered",
            error="Likely JavaScript-rendered page shell",
            raw_html_length=raw_html_length,
            text_word_count=text_word_count,
            text_preview=text_preview,
        )

    return SourceEnrichmentResult(
        status="success",
        text=stripped,
        failure_reason=None,
        error=None,
        raw_html_length=raw_html_length,
        text_word_count=text_word_count,
        text_preview=text_preview,
    )