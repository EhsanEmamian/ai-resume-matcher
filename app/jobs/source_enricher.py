from __future__ import annotations

import re

import httpx


class SourceEnrichmentError(Exception):
    pass


def _strip_html(html: str) -> str:
    html = re.sub(r"(?is)<script.*?>.*?</script>", " ", html)
    html = re.sub(r"(?is)<style.*?>.*?</style>", " ", html)
    html = re.sub(r"(?is)<noscript.*?>.*?</noscript>", " ", html)
    html = re.sub(r"(?s)<[^>]+>", " ", html)
    html = re.sub(r"&nbsp;", " ", html, flags=re.IGNORECASE)
    html = re.sub(r"&amp;", "&", html, flags=re.IGNORECASE)
    html = re.sub(r"&quot;", '"', html, flags=re.IGNORECASE)
    html = re.sub(r"&#39;", "'", html, flags=re.IGNORECASE)
    html = re.sub(r"\s+", " ", html).strip()
    return html


def fetch_source_text(url: str) -> str | None:
    if not url:
        return None

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
                )
            },
        )
        response.raise_for_status()
    except Exception as exc:
        raise SourceEnrichmentError(f"Failed to fetch source page: {exc}") from exc

    text = _strip_html(response.text)

    if len(text.split()) < 80:
        return None

    return text