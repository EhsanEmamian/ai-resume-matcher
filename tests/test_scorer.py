import uuid

from app.jobs.models import JobPosting
from app.matching.scorer import (
    NEUTRAL_WEIGHTS,
    ProfileSnapshot,
    _infer_seniority_from_title,
    _parse_years_from_text,
    calculate_match,
    generate_match_narrative,
)


def _job(**overrides) -> JobPosting:
    base = {
        "title": "Senior Backend Engineer",
        "company": "Acme",
        "description": "Build APIs with Python. 5+ years experience. English required.",
        "required_skills": ["Python", "FastAPI", "PostgreSQL"],
        "required_languages": ["English"],
        "experience_requirement": "5+ years of experience",
        "remote": True,
        "source": "manual",
    }
    base.update(overrides)
    return JobPosting(id=uuid.uuid4(), location="Remote", **base)


def test_infer_seniority_from_title() -> None:
    assert _infer_seniority_from_title("Junior Python Developer") == "junior"
    assert _infer_seniority_from_title("Senior Backend Engineer") == "senior"


def test_parse_years_from_text() -> None:
    assert _parse_years_from_text("Minimum 3 years of experience") == 3
    assert _parse_years_from_text("5+ years") == 5


def test_calculate_match_full_data_quality() -> None:
    profile = ProfileSnapshot(
        skills=["Python", "FastAPI"],
        technologies=["Python", "FastAPI", "Docker"],
        suggested_roles=["backend", "backend engineer"],
        languages=["English"],
        seniority_level="senior",
        years_of_experience=6,
    )
    job = _job()

    score, narrative, breakdown, matched = calculate_match(profile, job)

    assert 0 <= score <= 1
    assert breakdown.data_quality == "full"
    assert "Python" in matched
    assert breakdown.skill_overlap > 0
    assert breakdown.role_alignment > 0
    assert narrative
    assert generate_match_narrative(breakdown=breakdown, job=job)


def test_calculate_match_minimal_data_uses_neutral_weights() -> None:
    profile = ProfileSnapshot(
        skills=["Python"],
        technologies=["Python"],
        suggested_roles=["backend"],
        languages=[],
        seniority_level="mid",
        years_of_experience=None,
    )
    job = _job(
        title="Software Engineer",
        required_skills=[],
        required_languages=[],
        experience_requirement=None,
        description="General engineering role.",
    )

    _, _, breakdown, _ = calculate_match(profile, job)

    assert breakdown.data_quality == "minimal"
    assert breakdown.weights == NEUTRAL_WEIGHTS
    assert breakdown.skill_overlap > 0
