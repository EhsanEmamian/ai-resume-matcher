from pathlib import Path

from fastapi.testclient import TestClient


FIXTURE_PDF_PATH = Path(__file__).resolve().parent / "fixtures" / "test_resume.pdf"


def test_upload_resume(client: TestClient) -> None:
    with FIXTURE_PDF_PATH.open("rb") as f:
        files = {
            "file": ("test_resume.pdf", f, "application/pdf")
        }

        response = client.post("/resumes/upload", files=files)

    assert response.status_code == 201, response.text

    data = response.json()
    assert data["filename"] == "test_resume.pdf"
    assert data["content_type"] == "application/pdf"
    assert "id" in data
    assert "uploaded_at" in data


def test_parse_resume_and_get_profile(client: TestClient) -> None:
    with FIXTURE_PDF_PATH.open("rb") as f:
        files = {
            "file": ("test_resume_parse.pdf", f, "application/pdf")
        }

        upload_response = client.post("/resumes/upload", files=files)

    assert upload_response.status_code == 201, upload_response.text

    resume_id = upload_response.json()["id"]

    parse_response = client.post(f"/resumes/{resume_id}/parse")
    assert parse_response.status_code == 200, parse_response.text

    parse_data = parse_response.json()
    assert parse_data["resume_id"] == resume_id
    assert "profile" in parse_data
    assert "skills" in parse_data["profile"]
    assert "technologies" in parse_data["profile"]
    assert "languages" in parse_data["profile"]
    assert "suggested_roles" in parse_data["profile"]

    get_response = client.get(f"/resumes/{resume_id}")
    assert get_response.status_code == 200, get_response.text

    get_data = get_response.json()
    assert get_data["id"] == resume_id
    assert get_data["profile"] is not None
    assert "raw_text" in get_data