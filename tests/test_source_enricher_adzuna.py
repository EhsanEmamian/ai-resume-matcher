from app.jobs.source_enricher import fetch_source_text_result


def test_fetch_source_text_result_uses_adzuna_native_fast_path(monkeypatch) -> None:
    generic_called = {"value": False}

    def fake_native(job_id: str, redirect_url: str, *, timeout: float = 10.0):
        assert job_id == "5022594430"
        assert redirect_url == "https://www.adzuna.at/land/ad/5022594430"
        return ("Full Adzuna native job description. " * 30, "success")

    def fake_generic(source_url: str):
        generic_called["value"] = True
        raise AssertionError("generic path should not run on native success")

    monkeypatch.setattr(
        "app.jobs.source_enricher.fetch_adzuna_native_description",
        fake_native,
    )
    monkeypatch.setattr(
        "app.jobs.source_enricher._generic_fetch_and_extract",
        fake_generic,
    )

    result = fetch_source_text_result(
        "https://www.adzuna.at/land/ad/5022594430",
        source="adzuna",
        source_id="5022594430",
    )

    assert generic_called["value"] is False
    assert result.status == "success"
    assert result.text is not None
    assert "Full Adzuna native job description" in result.text


def test_fetch_source_text_result_falls_back_when_native_fails(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.jobs.source_enricher.fetch_adzuna_native_description",
        lambda job_id, redirect_url, *, timeout=10.0: (None, "fetch_failed"),
    )
    monkeypatch.setattr(
        "app.jobs.source_enricher._generic_fetch_and_extract",
        lambda source_url: type(
            "Result",
            (),
            {
                "status": "failed",
                "text": None,
                "failure_reason": "redirect_interstitial",
                "error": "fallback",
                "raw_html_length": None,
                "text_word_count": None,
                "text_preview": None,
            },
        )(),
    )

    result = fetch_source_text_result(
        "https://www.adzuna.at/land/ad/5022594430",
        source="adzuna",
        source_id="5022594430",
    )

    assert result.failure_reason == "redirect_interstitial"
