# AI Resume Matcher

AI Resume Matcher is a full-stack portfolio project that parses resume PDFs, validates whether a document is actually a CV/resume, discovers relevant live jobs, enriches imported job postings from their original source pages, and generates explainable job match results.

## What it does

This project helps turn a raw resume into a structured candidate profile and connect it to real job opportunities through a practical two-stage workflow:

- **Discovery mode** for fast live job browsing
- **Analysis mode** for enriched imported jobs and explainable matching

## Why this project exists

Most job-matching tools feel like black boxes. This project was built to make the process more transparent:

- validate uploaded documents before parsing
- avoid hallucinated extraction from unrelated PDFs
- show how a profile connects to real job searches
- enrich incomplete job previews with full source-page analysis
- make match reasoning visible instead of hidden

## Core features

- Resume PDF upload
- Resume/CV validation before profile extraction
- AI-based structured profile extraction
- Live Adzuna job search
- Country and city based job search UX
- Job title autocomplete
- Profile-based live job search suggestions
- Save & Analyze workflow for richer job enrichment
- Imported job enrichment from original source pages
- Explainable match scoring with score breakdowns
- Job management: delete single job / clear imported source jobs
- Loading skeletons and product-style UI states

## Product flow

### 1. Upload and validate a resume

The user uploads a PDF.

Before any profile extraction happens, the backend checks whether the file actually looks like a resume/CV.

If the file is not a resume, it is rejected with a clear message instead of generating hallucinated profile data.

### 2. Extract a structured candidate profile

For valid resumes, the system extracts:

- skills
- technologies
- languages
- seniority
- years of experience
- suggested roles

### 3. Discover live jobs

Based on the parsed profile, the UI suggests live job searches such as:

- Backend Engineer
- Python Developer
- Junior Software Developer

The live jobs page is intentionally lightweight and optimized for scanning.

### 4. Save and enrich a job

When the user saves a live job, the backend attempts to fetch the original job page and enrich the posting with deeper information such as:

- fuller description text
- additional technologies
- required languages
- experience requirement
- salary text

### 5. Analyze match results

Saved jobs can then be matched against the parsed resume profile.

The result is an explainable scoring view with:

- final match score
- matched skills
- score breakdown
- job detail analysis

## Tech stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

### Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic

### AI / Data Processing

- Anthropic Claude API
- PDF text extraction
- Rule-based pre-validation
- Rule-based job enrichment helpers

### Job data

- Adzuna live job search API
- Source-page enrichment on imported jobs

## Architecture overview

### Frontend

The frontend is built with Next.js App Router and separates server page wrappers from client-side interactive components.

Main product views:

- Home / resume upload
- Resume profile
- Live jobs
- Saved jobs
- Job detail
- Match results

### Backend

The FastAPI backend is responsible for:

- file upload
- PDF text extraction
- resume validation
- profile parsing
- job ingestion
- source enrichment
- job matching
- persistence

### Database

PostgreSQL stores:

- uploaded resumes
- parsed profiles
- imported jobs
- enriched source text
- match results

### Two-tier job model

The product intentionally separates jobs into two different states:

- **Live jobs** → lightweight discovery previews
- **Saved jobs** → enriched analysis objects

This was a deliberate product and engineering decision to keep live search fast while making saved jobs more trustworthy and detailed.

## Key design decisions

### 1. Resume validation before extraction

The system validates whether an uploaded PDF is actually a resume/CV before extracting profile fields.

This prevents hallucinated profile generation from unrelated documents such as housing notices, invoices, or letters.

### 2. Rule-based pre-validation before AI validation

Obvious non-resume files are rejected earlier using lightweight rule-based checks before calling the AI model.

This reduces unnecessary API cost and improves reliability.

### 3. Discovery mode vs analysis mode

Live jobs are intentionally lightweight.

Imported jobs are enriched and analyzed in more depth.

This avoids misleading users with incomplete metadata inside live search results.

### 4. Source enrichment only after save

The app does not try to deeply scrape every live result.

Instead, enrichment happens when the user explicitly saves a job.

This keeps live browsing fast and makes saved jobs much richer.

### 5. Explainable matching instead of black-box ranking

Match results are presented with score breakdowns and visible matched skills rather than opaque scoring only.

## Run locally

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ai-resume-matcher
```

### 2. Configure environment variables

Create the required environment files for frontend and backend.

Typical backend configuration includes:

- database connection settings
- Anthropic API key
- Adzuna API credentials

### 3. Start the application

```bash
docker compose up --build
```

### 4. Open the apps

- Frontend: <http://localhost:3000>
- Backend API docs: <http://localhost:8000/docs>

## Main pages

- `/` → Upload and parse a resume
- `/profile/[resumeId]` → Parsed profile overview
- `/live-jobs` → Lightweight live job discovery
- `/jobs` → Saved/imported jobs
- `/jobs/[jobId]` → Full job detail analysis
- `/matches/[resumeId]` → Explainable job match results

## Future improvements

Planned or possible next steps:

- stronger profile-aware rationale in live jobs
- richer extracted job requirements
- better enrichment support for difficult job sources
- user accounts / guest vs registered user flows
- saved search history
- job alerting
- deployment and public demo environment

## Author

Built by **Ehsan Emamian** as a full-stack portfolio project focused on backend engineering, AI integration, and product-oriented system design.
