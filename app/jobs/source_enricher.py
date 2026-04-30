from __future__ import annotations

import re

import httpx


class SourceEnrichmentError(Exception):
    pass


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


def fetch_source_text(url: str) -> str | None:
    if not url:
        print("DEBUG fetch_source_text empty url")
        return None

    print("DEBUG fetch_source_text url:", url)

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

        print("DEBUG fetch_source_text status:", response.status_code)
        print("DEBUG fetch_source_text final_url:", str(response.url))
        print("DEBUG fetch_source_text html length:", len(response.text))

        response.raise_for_status()

    except Exception as exc:
        raise SourceEnrichmentError(f"Failed to fetch source page: {exc}") from exc

    text = _strip_html(response.text)
    word_count = len(text.split())

    print("DEBUG fetch_source_text text length:", len(text))
    print("DEBUG fetch_source_text word count:", word_count)
    print("DEBUG fetch_source_text preview:", text[:500])

    if word_count < 80:
        print("DEBUG fetch_source_text rejected: less than 80 words")
        return None

    return text