from app.jobs.source_enricher import fetch_source_text_result


def test_fetch_source_text_result_uses_resolved_target(monkeypatch) -> None:
    calls: list[str] = []

    def fake_resolve(url: str) -> tuple[str, str]:
        return "https://employer.example/jobs/42", "resolved"

    def fake_get(url: str, **kwargs) -> object:
        calls.append(url)

        class FakeResponse:
            status_code = 200
            text = (
                "<html><body><main><p>"
                + ("Senior Python engineer with FastAPI and PostgreSQL experience. " * 20)
                + "</p></main></body></html>"
            )

        return FakeResponse()

    monkeypatch.setattr(
        "app.jobs.source_enricher.resolve_redirect_url",
        fake_resolve,
    )
    monkeypatch.setattr("app.jobs.source_enricher.httpx.get", fake_get)

    result = fetch_source_text_result("https://adzuna.example/redirect")

    assert calls == ["https://employer.example/jobs/42"]
    assert result.status == "success"
    assert result.text is not None
    assert "Senior Python engineer" in result.text


def test_fetch_source_text_result_redirect_fallback_when_target_fetch_fails(
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        "app.jobs.source_enricher.resolve_redirect_url",
        lambda url: ("https://employer.example/jobs/42", "resolved"),
    )

    def fake_get(url: str, **kwargs) -> object:
        raise TimeoutError("timed out")

    monkeypatch.setattr("app.jobs.source_enricher.httpx.get", fake_get)

    result = fetch_source_text_result("https://adzuna.example/redirect")

    assert result.failure_reason == "redirect_interstitial"
    assert result.text is None


def test_fetch_source_text_result_redirect_fallback_when_unresolved(
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        "app.jobs.source_enricher.resolve_redirect_url",
        lambda url: ("https://adzuna.example/redirect", "interstitial_unresolved"),
    )

    result = fetch_source_text_result("https://adzuna.example/redirect")

    assert result.failure_reason == "redirect_interstitial"
    assert result.text is None
