from fastapi.testclient import TestClient


def test_health_check(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "AI Resume Job Matcher"
    assert data["version"] == "0.1.0"

def test_get_nonexistent_job_returns_structured_error(client: TestClient) -> None:
    response = client.get("/jobs/00000000-0000-0000-0000-000000000000")

    assert response.status_code == 404

    data = response.json()
    assert data["error"] == "NotFoundError"
    assert "not found" in data["detail"].lower()