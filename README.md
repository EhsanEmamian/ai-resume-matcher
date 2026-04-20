# AI Resume Job Matcher API

A backend-first portfolio project built with FastAPI and PostgreSQL.

This application allows users to upload a PDF resume, extract raw text, parse the resume into a structured profile, store job postings, and generate rule-based job matches. It also includes a fallback parser so the pipeline still works when external AI credits or provider access are unavailable.

## Features

- Upload PDF resumes
- Extract raw text from PDF files
- Store resumes in PostgreSQL
- Parse resumes into structured profiles
- Fallback mock parser when external AI parsing is unavailable
- Create and manage job postings
- Generate job matches for a resume
- Store match results in the database
- Return enriched match responses with job details
- Filter matches by minimum score
- Sort matches by score or match time
- Database migrations with Alembic
- Dockerized local development setup

## Tech Stack

- Python 3.12
- FastAPI
- PostgreSQL
- SQLAlchemy 2.0
- Alembic
- Pydantic v2
- Docker / Docker Compose
- pdfplumber
- Anthropic SDK

## Project Structure

```text
ai-resume-matcher/
├── alembic/
├── app/
│   ├── ai/
│   ├── jobs/
│   ├── matching/
│   ├── resume/
│   ├── config.py
│   ├── database.py
│   └── main.py
├── uploads/
├── .env.example
├── .gitignore
├── alembic.ini
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
Main Workflow
Upload a resume PDF
Extract raw text from the PDF
Store the resume and extracted text
Parse the resume into a structured profile
Create job postings
Generate match results between a resume profile and stored jobs
Retrieve ranked matches with full job information
API Endpoints
Health
GET /health
Jobs
POST /jobs
GET /jobs
GET /jobs/{job_id}
DELETE /jobs/{job_id}
Resumes
POST /resumes/upload
GET /resumes/{resume_id}
POST /resumes/{resume_id}/parse
Matches
POST /matches/{resume_id}
GET /matches/{resume_id}
Environment Variables

Create a .env file based on .env.example.

Example:

DATABASE_URL=postgresql://postgres:postgres@db:5432/resume_matcher
DEBUG=True
ANTHROPIC_API_KEY=
Notes
DATABASE_URL uses db as the hostname because the API runs inside Docker Compose.
ANTHROPIC_API_KEY is optional for local development if you rely on the fallback parser.
Run Locally with Docker
1. Clone the repository
git clone https://github.com/EhsanEmamian/ai-resume-matcher.git
cd ai-resume-matcher
2. Create .env

Copy .env.example to .env and adjust values if needed.

3. Start the application
docker compose up --build
4. Run migrations

In a second terminal:

docker compose run --rm api alembic upgrade head
5. Open the docs
Swagger UI: http://localhost:8000/docs
Health check: http://localhost:8000/health
Example Usage Flow
1. Create job postings

Use POST /jobs to insert one or more jobs.

2. Upload a resume

Use POST /resumes/upload with a PDF file.

3. Parse the resume

Use POST /resumes/{resume_id}/parse.

If Anthropic API access is unavailable, the fallback parser is used so the pipeline remains functional.

4. Generate matches

Use POST /matches/{resume_id}.

5. List matches

Use GET /matches/{resume_id}?min_score=0&sort_by=score.

Matching Logic

The current matching engine is rule-based and explainable.

Scoring factors
Skill and technology overlap
Suggested role vs. job title overlap
Remote-friendly job bonus

This was intentionally chosen for v1 because it is:

easier to debug
easier to explain in interviews
deterministic
cheaper and more reliable than LLM-based job scoring
AI Parsing Strategy

The project supports two parsing modes:

1. Anthropic-based parsing

If a valid ANTHROPIC_API_KEY is available and the API account has usable credits, the resume text is sent to Claude for structured parsing.

2. Fallback parser

If external AI parsing fails because of:

missing API key
invalid API key
insufficient API credits
malformed AI response
provider error

the project falls back to a local mock parser so the end-to-end pipeline still works.

This keeps the project demoable even when third-party API access is limited.

Known Limitations
Only PDF resumes are supported in v1
Scanned/image-based PDFs may fail text extraction
No authentication in v1
Uploaded files are stored locally
Matching is rule-based, not semantic/embedding-based
No frontend in v1
No background jobs or task queue in v1
No production deployment configuration yet
Future Improvements
Add authentication
Add DOCX support
Add job update endpoint
Improve matching algorithm
Add semantic search / embeddings
Add real AI-based job scoring as an optional feature
Add tests for services and endpoints
Add pagination metadata improvements
Add deployment configuration
Add frontend dashboard
Why This Project Matters

This project demonstrates practical backend engineering skills, including:

API design
database modeling
migrations
file handling
PDF processing
external AI integration
graceful fallback design
rule-based scoring
modular service architecture

It is designed as a portfolio project for junior backend / AI integration roles.

Author

Ehsan Emamian

GitHub: https://github.com/EhsanEmamian
LinkedIn: https://linkedin.com/in/ehsan-emamian

