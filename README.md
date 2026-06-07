# AI Resume Matcher

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)
![Claude AI](https://img.shields.io/badge/Claude-AI-orange?logo=anthropic)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)

A production-style, full-stack portfolio project that parses PDF resumes, validates document authenticity, discovers live jobs from multiple external sources, enriches job data from original postings, and generates transparent, explainable match scores — without a black-box algorithm in sight.

Built with a strong focus on **backend engineering, AI integration, product-oriented system design, and clean architecture.**

---

## Live Demo

- **Frontend:** [ai-resume-matcher.vercel.app](https://ai-resume-matcher-beta.vercel.app/) 
- **Backend API Docs:** [Swagger UI on Render](https://ai-resume-matcher-fh8f.onrender.com/docs) 

---

## Why This Project Exists

Most job-matching platforms are black boxes — candidates have no idea why they matched or didn't match a role. This project was built to solve that:

- **Validate before extracting** — non-resume PDFs are rejected before any AI call is made, preventing hallucinated profiles from housing notices, invoices, or letters
- **Explain every match** — score breakdowns show exactly which skills matched, which are missing, and how seniority and language requirements affected the result
- **Enrich incomplete data** — live job previews are intentionally lightweight; full metadata is extracted from original source pages only when a job is saved

---

## Core Features

### Resume Processing Pipeline

- **Memory-efficient PDF extraction** using `pypdf` — optimised for constrained cloud environments
- **Rule-based pre-validation** rejects obvious non-resume documents cheaply before any AI call
- **AI-powered document validation** classifies uploaded files as resume, invoice, letter, or unknown — with configurable confidence thresholds
- **Structured profile extraction** via Claude API: skills, technologies, languages, seniority level, years of experience, and suggested roles
- **Resilient fallback parser** keeps the pipeline alive when the AI provider is unavailable
- **File hash caching (SHA-256)** — identical uploads bypass the AI call entirely and return the cached profile
- **IP-based rate limiting** — 3 uploads per IP per day to protect API budget
- **File constraint validation** — rejects files over 2 MB or more than 3 pages before any processing begins

### Job Discovery & Ingestion

- **Multi-source live job search**: Adzuna, Arbeitnow, Remotive, and Jooble
- **Two-tier job model**: live jobs are lightweight discovery previews; saved jobs are fully enriched analysis objects
- **Source-page enrichment** — when a job is saved, the backend fetches the original posting page and extracts fuller metadata: technologies, languages, experience requirements, salary
- **Enrichment status tracking** — every job shows whether it was enriched from source, fell back to preview text, or was blocked by a redirect
- **Profile-driven search suggestions** — after parsing a resume, the app suggests targeted job searches based on extracted roles and technologies
- **One-click demo seeding** — instantly populates the database with four realistic tech jobs for immediate testing

### Matching Engine

- **Five-component scoring model**: skill overlap (45%), role alignment (20%), seniority fit (15%), language fit (12%), experience fit (8%)
- **Neutral fallback for missing data** — when job metadata is incomplete, affected components score at 50% of their max weight rather than zero, preventing sparse data from destroying otherwise strong matches
- **Score breakdown per match** — shows raw component scores, matched skills, missing skills, seniority signal, and language signal
- **Match narrative generation** — produces human-readable reasoning ("Strong skill alignment across 4 matched technologies; seniority level is a direct fit") instead of raw floats
- **Data quality badge** — flags matches where limited job metadata reduces scoring confidence

### Frontend & UX

- **Dark navy product-style UI** consistent across all pages
- **Skills constellation visualiser** — canvas-based animated graph of extracted skills on the profile page
- **Staggered card entrance animations** and count-up stat animations via Framer Motion
- **Loading skeletons** on all async data surfaces
- **Profile-based job search** — after parsing, one-click searches launch pre-filled with the candidate's top role
- **Job management** — delete individual jobs or bulk-clear by source
- **Country and city dropdowns** with curated data for Austria, Germany, UK, and US
- **Job title autocomplete** with static suggestions, no external API required
- **Browser metadata titles** on all pages

---

## Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Lucide React |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0 (sync), Alembic, Pydantic v2 |
| **Database** | PostgreSQL 15 |
| **AI & NLP** | Anthropic Claude API, `pypdf` (memory-efficient extraction), rule-based skill/language/salary extractors |
| **Job Sources** | Adzuna API, Arbeitnow API, Remotive API, Jooble API |
| **Infrastructure** | Docker Compose, Vercel (frontend), Render (API + database) |

---

## Architecture Overview

### Two-Tier Job Model

The most important product and engineering decision in the project:

```
Live Jobs  →  lightweight discovery previews
               title, company, location, remote flag, profile rationale
               fast, intentionally partial, no enrichment attempted

Saved Jobs →  fully enriched analysis objects
               source page fetched, skills/languages/salary extracted
               matched against resume profile with score breakdown
```

This separation keeps live search fast while making saved jobs trustworthy. Incomplete metadata is never shown in live previews — it only appears after enrichment succeeds.

### Resume Validation Pipeline

Every upload passes through layers in strict order. The AI call is the last thing that executes:

```
Upload
  └── File type gate         (MIME + extension)
  └── File constraints       (≤ 2 MB, ≤ 3 pages)
  └── Hash cache lookup      (SHA-256 — bypasses AI on duplicate)
  └── IP rate limit check    (3/day via slowapi)
  └── Rule-based pre-check   (text length, obvious non-resume signals)
  └── AI document validation (Claude — classifies document type)
  └── AI profile extraction  (Claude — structured profile)
  └── Store + return
```

### Database Models

```
resumes
  ├── id, filename, raw_text, file_hash
  ├── is_resume, document_type, validation_confidence
  ├── rejection_reason, client_ip, uploaded_at
  └── → resume_profiles (one-to-one)

resume_profiles
  ├── skills[], technologies[], languages[]
  ├── seniority_level, years_of_experience
  ├── suggested_roles[], raw_ai_response (JSONB)
  └── parsed_at

job_postings
  ├── title, company, description, source_text
  ├── required_skills[], required_languages[]
  ├── experience_requirement, salary_text, salary_min, salary_max
  ├── source, source_id, source_url (UNIQUE constraint on source+source_id)
  ├── enrichment_status, enrichment_failure_reason
  └── location, remote, contract_type, category, posted_at

match_results
  ├── resume_id → resumes, job_id → job_postings
  ├── score (float), reason (text)
  ├── score_breakdown (JSONB): skill_overlap, role_alignment,
  │   seniority_fit, language_fit, experience_fit, final_score
  ├── matched_skills (JSONB), missing_skills (JSONB)
  └── UNIQUE constraint on (resume_id, job_id)
```

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check |
| `POST` | `/resumes/upload-and-parse` | Upload PDF, validate, extract profile |
| `GET` | `/resumes/{id}/full` | Resume + profile + matches in one response |
| `GET` | `/resumes/{id}/discovery-status` | Background job discovery polling |
| `POST` | `/jobs` | Manually create a job posting |
| `GET` | `/jobs` | List saved jobs (paginated) |
| `GET` | `/jobs/{id}` | Single job detail |
| `DELETE` | `/jobs/{id}` | Delete a job |
| `DELETE` | `/jobs/clear-by-source` | Bulk delete by source (e.g. `?source=adzuna`) |
| `POST` | `/jobs/search-external` | Live search across external sources |
| `POST` | `/jobs/import-external` | Save a live job + trigger enrichment |
| `POST` | `/jobs/ingest` | Batch ingest jobs from Adzuna |
| `POST` | `/jobs/seed-demo` | Seed database with 4 realistic demo jobs |
| `POST` | `/matches/{resume_id}` | Generate match scores (idempotent) |
| `GET` | `/matches/{resume_id}` | Retrieve matches with filters and sorting |
| `POST` | `/matches/preview` | Score a manual/quick-try profile without persisting |

---

## Key Design Decisions

**1. Validation before extraction**
The system validates whether an uploaded PDF is actually a resume before running the extraction prompt. This prevents hallucinated profiles from unrelated documents. A rule-based pre-check runs first (cheap), then the AI validation runs only if the pre-check passes (less cheap).

**2. Neutral fallback for missing job metadata**
When a job has no `required_languages`, no `experience_requirement`, or no inferable seniority, the affected scoring components return 50% of their maximum weight — neither a bonus nor a penalty. This reflects the real-world reality that missing data is not the same as a mismatch

**3. File hash caching before rate limiting**
The SHA-256 hash check runs before the IP rate limit check. A user re-uploading the same resume they already parsed gets an instant cached response and does not consume their daily quota — they're not using AI budget.

**4. Sync SQLAlchemy over async**
At portfolio scale there is no performance case for async SQLAlchemy. The sync setup is simpler, easier to reason about, and produces code that is straightforward to explain in a technical interview. This was a deliberate choice, not an oversight.

**5. Rule-based matching in v1**
The matching engine is intentionally rule-based and explainable rather than embedding-based. A score that can be traced to specific component weights is easier to debug, demonstrate, and improve incrementally. Vector/semantic search is documented as the planned v2 upgrade.

---

## Getting Started

### Prerequisites

- Docker and Docker Compose
- An [Anthropic API key](https://console.anthropic.com/)
- An [Adzuna API key](https://developer.adzuna.com/) (free tier)

### 1. Clone the repository

```bash
git clone https://github.com/EhsanEmamian/ai-resume-matcher.git
cd ai-resume-matcher
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/resume_matcher
DEBUG=True

ANTHROPIC_API_KEY=your_anthropic_key_here
RESUME_VALIDATION_MODEL=claude-haiku-4-5-20251001
RESUME_PARSING_MODEL=claude-haiku-4-5-20251001

ADZUNA_APP_ID=your_adzuna_id
ADZUNA_APP_KEY=your_adzuna_key
ADZUNA_BASE_URL=https://api.adzuna.com/v1/api/jobs
```

> **Note:** The Anthropic API key is required for AI parsing. If omitted, resume upload returns a clear error. The Adzuna key is required for live job search. All other features (saved jobs, matching, demo seed) work without external keys. Set ADMIN_API_KEY to any strong random string in production to protect job management endpoints.

### 3. Start the application

```bash
docker compose up --build
```

### 4. Run database migrations

```bash
docker compose run --rm api alembic upgrade head
```

### 5. Access the application

| Service | URL |
| :--- | :--- |
| Frontend | http://localhost:3000 |
| Backend Swagger UI | http://localhost:8000/docs |
| Health check | http://localhost:8000/health |

---

## Example Usage

### Upload and parse a resume

```bash
curl -X POST http://localhost:8000/resumes/upload-and-parse \
  -F "file=@your_resume.pdf"
```

### Seed demo jobs for immediate testing

```bash
curl -X POST http://localhost:8000/jobs/seed-demo
```

### Generate matches

```bash
curl -X POST http://localhost:8000/matches/{resume_id}
```

### Search live jobs

```bash
curl -X POST http://localhost:8000/jobs/search-external \
  -H "Content-Type: application/json" \
  -d '{"keyword": "python developer", "country": "de", "source": "arbeitnow"}'
```

---

## Known Limitations

| Limitation | Notes |
| :--- | :--- |
| PDF only | DOCX and scanned/image-based PDFs are not supported. OCR integration is a planned improvement. |
| Adzuna enrichment | Many Adzuna source URLs redirect to interstitial pages. The system gracefully falls back to the preview description with a `redirect_fallback` status rather than marking enrichment as failed. |
| Rule-based matching | The current engine scores on skill overlap, role alignment, seniority, language, and experience. Semantic similarity (vector embeddings) would improve results for non-exact skill name matches. |
| No authentication | The app is guest-first. IP-based rate limiting and file hash caching provide basic abuse protection without requiring accounts. |
| In-memory rate limiting | The `slowapi` rate limiter uses in-memory storage. Restarting the server resets counters. Redis-backed storage is the production upgrade. |

---

## Roadmap

- [ ] Vector embeddings and semantic job matching (cosine similarity over skill vectors)
- [ ] User authentication with guest-vs-registered capability split
- [ ] Background job queue (Celery + Redis) for async source enrichment
- [ ] OCR support for scanned/image-based PDF resumes
- [ ] AI provider abstraction layer (swap Claude for Ollama for fully offline operation)
- [ ] Saved search history and job alerts
- [ ] Automated CI/CD pipeline with test coverage reporting

---

## Running Tests

```bash
docker compose run --rm api pytest
```

Tests cover: health check, job CRUD, resume upload, validation pipeline, matching logic, and deduplication behaviour

---

## Author

Built by **Ehsan Emamian** — Vienna-based backend developer specialising in Python, FastAPI, PostgreSQL, and AI integration

- GitHub: [@EhsanEmamian](https://github.com/EhsanEmamian)
- LinkedIn: [Ehsan Emamian](https://linkedin.com/in/ehsan-emamian)

---

## License

This project is open-source and available under the [MIT License](LICENSE).
