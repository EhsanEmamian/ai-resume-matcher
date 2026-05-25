from app.jobs.service import (
    _build_remotive_search_query,
    _normalize_remotive_job,
    _remotive_job_matches_location_filters,
)


def test_build_remotive_search_query_injects_city_and_country() -> None:
    query = _build_remotive_search_query(
        "python developer",
        location="Berlin",
        country="de",
    )
    assert query == "python developer Berlin Germany"


def test_build_remotive_search_query_country_only() -> None:
    query = _build_remotive_search_query("", location="", country="at")
    assert query == "Austria"


def test_remotive_location_filter_accepts_global_keywords() -> None:
    item = {"candidate_required_location": "Worldwide"}
    assert _remotive_job_matches_location_filters(
        item,
        location="Berlin",
        country="de",
    )


def test_remotive_location_filter_matches_country_alias() -> None:
    item = {"candidate_required_location": "Germany / Europe"}
    assert _remotive_job_matches_location_filters(item, country="de")
    assert not _remotive_job_matches_location_filters(item, country="us")


def test_remotive_location_filter_matches_city() -> None:
    item = {"candidate_required_location": "Berlin, Germany"}
    assert _remotive_job_matches_location_filters(item, location="Berlin", country="de")
    assert not _remotive_job_matches_location_filters(
        item,
        location="Munich",
        country="de",
    )


def test_remotive_location_filter_skipped_when_no_filters() -> None:
    item = {"candidate_required_location": "USA Only"}
    assert _remotive_job_matches_location_filters(item)


def test_normalize_remotive_job_preserves_location_field() -> None:
    normalized = _normalize_remotive_job(
        {
            "id": 1,
            "title": "Engineer",
            "company_name": "Acme",
            "description": "Build APIs",
            "candidate_required_location": "Germany",
            "url": "https://example.com/jobs/1",
        }
    )
    assert normalized["location"] == "Germany"
    assert normalized["source"] == "remotive"
    assert normalized["title"] == "Engineer"
