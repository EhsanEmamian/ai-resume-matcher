from fastapi.testclient import TestClient


def test_create_job(client: TestClient) -> None:
    payload = {
        "title": "Backend Engineer",
        "company": "Test Company",
        "description": "Build APIs with Python and FastAPI.",
        "required_skills": ["Python", "FastAPI", "PostgreSQL"],
        "location": "Vienna, Austria",
        "remote": True,
        "posted_at": "2026-04-20T10:00:00Z",
    }

    response = client.post("/jobs", json=payload)

    assert response.status_code == 201

    data = response.json()
    assert data["title"] == payload["title"]
    assert data["company"] == payload["company"]
    assert data["description"] == payload["description"]
    assert data["required_skills"] == payload["required_skills"]
    assert data["location"] == payload["location"]
    assert data["remote"] is True
    assert "id" in data
    assert "created_at" in data


def test_list_jobs(client: TestClient) -> None:
    response = client.get("/jobs")

    assert response.status_code == 200

    data = response.json()
    assert "total" in data
    assert "items" in data
    assert isinstance(data["items"], list)