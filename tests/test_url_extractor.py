from app.jobs.url_extractor import (
    _is_interstitial,
    extract_redirect_target,
    resolve_redirect_url,
)


def test_is_interstitial_detects_short_redirect_page() -> None:
    html = """
    <html>
      <head>
        <meta http-equiv="refresh" content="5;url=https://employer.example/jobs/123">
      </head>
      <body>
        <p>You will now be redirected to the employer site.</p>
      </body>
    </html>
    """

    assert _is_interstitial(html) is True


def test_is_interstitial_ignores_long_real_page() -> None:
    html = "<html><body><p>" + ("Backend engineer role with Python. " * 60) + "</p></body></html>"

    assert _is_interstitial(html) is False


def test_extract_redirect_target_from_meta_refresh() -> None:
    html = """
    <html><head>
      <meta http-equiv="refresh" content="5;url=https://company.example/job/42">
    </head></html>
    """

    assert (
        extract_redirect_target(html, "https://adzuna.example/redirect")
        == "https://company.example/job/42"
    )


def test_extract_redirect_target_from_window_location() -> None:
    html = """
    <html><body>
      <script>window.location.href = "https://company.example/job/99";</script>
    </body></html>
    """

    assert (
        extract_redirect_target(html, "https://adzuna.example/redirect")
        == "https://company.example/job/99"
    )


def test_resolve_redirect_url_direct(monkeypatch) -> None:
    class FakeResponse:
        url = "https://employer.example/jobs/1"
        status_code = 200
        text = "<html><body>" + ("Real job description text. " * 80) + "</body></html>"

    monkeypatch.setattr(
        "app.jobs.url_extractor.httpx.get",
        lambda *args, **kwargs: FakeResponse(),
    )

    final_url, status = resolve_redirect_url("https://employer.example/jobs/1")

    assert final_url == "https://employer.example/jobs/1"
    assert status == "direct"


def test_resolve_redirect_url_resolves_interstitial(monkeypatch) -> None:
    class FakeResponse:
        url = "https://adzuna.example/interstitial"
        status_code = 200
        text = """
        <html><head>
          <meta http-equiv="refresh" content="5;url=https://employer.example/jobs/2">
        </head><body><p>Redirecting...</p></body></html>
        """

    monkeypatch.setattr(
        "app.jobs.url_extractor.httpx.get",
        lambda *args, **kwargs: FakeResponse(),
    )

    final_url, status = resolve_redirect_url("https://adzuna.example/interstitial")

    assert final_url == "https://employer.example/jobs/2"
    assert status == "resolved"


def test_resolve_redirect_url_unresolved_interstitial(monkeypatch) -> None:
    class FakeResponse:
        url = "https://adzuna.example/interstitial"
        status_code = 200
        text = "<html><body><p>Redirecting you now...</p></body></html>"

    monkeypatch.setattr(
        "app.jobs.url_extractor.httpx.get",
        lambda *args, **kwargs: FakeResponse(),
    )

    final_url, status = resolve_redirect_url("https://adzuna.example/interstitial")

    assert final_url == "https://adzuna.example/interstitial"
    assert status == "interstitial_unresolved"
