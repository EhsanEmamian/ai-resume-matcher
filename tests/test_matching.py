from pathlib import Path

from fastapi.testclient import TestClient


FIXTURE_PDF_PATH = Path(__file__).resolve().parent / "fixtures" / "test_resume.pdf"


def _create_job(client: TestClient, title: str, skills: list[str], remote: bool = True) -> dict:
    payload = {
        "title": title,
        "company": "Test Company",
        "description": f"{title} role",
        "required_skills": skills,
        "location": "Vienna, Austria",
        "remote": remote,
        "posted_at": "2026-04-20T10:00:00Z",
    }
    response = client.post("/jobs", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def _upload_and_parse_resume(client: TestClient) -> str:
    with FIXTURE_PDF_PATH.open("rb") as f:
        files = {
            "file": ("matching_resume.pdf", f, "application/pdf")
        }
        upload_response = client.post("/resumes/upload", files=files)

    assert upload_response.status_code == 201, upload_response.text
    resume_id = upload_response.json()["id"]

    parse_response = client.post(f"/resumes/{resume_id}/parse")
    assert parse_response.status_code == 200, parse_response.text

    return resume_id


def test_generate_matches_for_resume(client: TestClient) -> None:
    _create_job(client, "Backend Engineer", ["Python", "FastAPI", "PostgreSQL"], remote=True)
    _create_job(client, "Frontend Developer", ["React", "TypeScript", "CSS"], remote=False)

    resume_id = _upload_and_parse_resume(client)

    response = client.post(f"/matches/{resume_id}")
    assert response.status_code == 200, response.text

    data = response.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 1
    assert isinstance(data["items"], list)

    first_match = data["items"][0]
    assert "score" in first_match
    assert "reason" in first_match
    assert "job" in first_match
    assert "title" in first_match["job"]
    assert "company" in first_match["job"]
    breakdown = first_match.get("score_breakdown") or {}
    assert "skill_overlap" in breakdown
    assert "final_score" in breakdown
    assert "narrative" in breakdown


def test_list_matches_with_min_score_filter(client: TestClient) -> None:
    _create_job(client, "Python Backend Developer", ["Python", "SQL"], remote=True)

    resume_id = _upload_and_parse_resume(client)

    generate_response = client.post(f"/matches/{resume_id}")
    assert generate_response.status_code == 200, generate_response.text

    list_response = client.get(f"/matches/{resume_id}?min_score=0&sort_by=score")
    assert list_response.status_code == 200, list_response.text

    list_data = list_response.json()
    assert "total" in list_data
    assert "items" in list_data
    assert isinstance(list_data["items"], list)

    filtered_response = client.get(f"/matches/{resume_id}?min_score=0.9&sort_by=score")
    assert filtered_response.status_code == 200, filtered_response.text

    filtered_data = filtered_response.json()
    assert "total" in filtered_data
    assert "items" in filtered_data
    assert isinstance(filtered_data["items"], list)


def test_preview_matches_without_resume(client: TestClient) -> None:
    _create_job(client, "Backend Engineer", ["Python", "FastAPI"], remote=True)

    response = client.post(
        "/matches/preview",
        json={
            "skills": ["Python", "FastAPI"],
            "suggested_roles": ["backend", "backend developer"],
            "seniority_level": "Mid",
        },
    )
    assert response.status_code == 200, response.text

    data = response.json()
    assert data["total"] >= 1
    assert isinstance(data["items"], list)

    first_match = data["items"][0]
    assert first_match["resume_id"] == "00000000-0000-0000-0000-000000000000"
    assert "score" in first_match
    assert "job" in first_match