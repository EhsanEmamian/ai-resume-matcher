from app.jobs.adzuna_native_fetcher import (
    _build_native_url,
    _extract_description_from_soup,
    fetch_adzuna_native_description,
)
from bs4 import BeautifulSoup


def test_build_native_url_from_redirect_url() -> None:
    redirect_url = "https://www.adzuna.at/land/ad/5022594430?v=1&adref=abc"
    assert _build_native_url(redirect_url, "5022594430") == (
        "https://www.adzuna.at/details/5022594430"
    )


def test_extract_description_from_itemprop() -> None:
    html = """
    <html><body>
      <div itemprop="description">
        """ + ("Senior Python engineer with FastAPI experience. " * 20) + """
      </div>
    </body></html>
    """
    soup = BeautifulSoup(html, "html.parser")
    text = _extract_description_from_soup(soup)

    assert text is not None
    assert "Senior Python engineer" in text


def test_fetch_adzuna_native_description_success(monkeypatch) -> None:
    description_text = "Senior Python engineer. " * 40

    class FakeResponse:
        status_code = 200
        text = f'<html><body><div itemprop="description">{description_text}</div></body></html>'

    monkeypatch.setattr(
        "app.jobs.adzuna_native_fetcher._fetch_without_js_redirect",
        lambda url, timeout: FakeResponse(),
    )

    text, status = fetch_adzuna_native_description(
        "5022594430",
        "https://www.adzuna.at/land/ad/5022594430?v=1",
    )

    assert status == "success"
    assert text is not None
    assert "Senior Python engineer" in text


def test_fetch_adzuna_native_description_fetch_failed(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.jobs.adzuna_native_fetcher._fetch_without_js_redirect",
        lambda url, timeout: None,
    )

    text, status = fetch_adzuna_native_description(
        "5022594430",
        "https://www.adzuna.at/land/ad/5022594430?v=1",
    )

    assert text is None
    assert status == "fetch_failed"
