# AI Resume Matcher

A backend-focused project that processes resumes, parses structured data, and matches candidates with job postings using a transparent, rule-based scoring system.

---

## 🚀 Main Workflow

1. Upload a resume PDF
2. Extract raw text from the PDF
3. Store the resume and extracted text
4. Parse the resume into a structured profile
5. Create job postings
6. Generate match results between a resume profile and stored jobs
7. Retrieve ranked matches with full job information

---

## 📡 API Endpoints

### Health
- GET /health

### Jobs
- POST /jobs
- GET /jobs
- GET /jobs/{job_id}
- DELETE /jobs/{job_id}

### Resumes
- POST /resumes/upload
- GET /resumes/{resume_id}
- POST /resumes/{resume_id}/parse

### Matches
- POST /matches/{resume_id}
- GET /matches/{resume_id}

---

## ⚙️ Environment Variables

Create a `.env` file based on `.env.example`.

DATABASE_URL=postgresql://postgres:postgres@db:5432/resume_matcher
DEBUG=True
ANTHROPIC_API_KEY=

### Notes
- DATABASE_URL uses db as hostname because the API runs inside Docker Compose
- ANTHROPIC_API_KEY is optional for local development (fallback parser is used if missing)

---

## 🐳 Run Locally with Docker

### 1. Clone the repository
git clone https://github.com/EhsanEmamian/ai-resume-matcher.git
cd ai-resume-matcher

### 2. Create .env
Copy .env.example to .env and adjust values if needed.

### 3. Start the application
docker compose up --build

### 4. Run migrations
docker compose run --rm api alembic upgrade head

### 5. Open the docs
Swagger UI: http://localhost:8000/docs
Health check: http://localhost:8000/health

---

## 🔄 Example Usage Flow

### 1. Create job postings
POST /jobs

### 2. Upload a resume
POST /resumes/upload

### 3. Parse the resume
POST /resumes/{resume_id}/parse

If Anthropic API access is unavailable, the fallback parser is used.

### 4. Generate matches
POST /matches/{resume_id}

### 5. List matches
GET /matches/{resume_id}?min_score=0&sort_by=score

---

## 🧠 Matching Logic

The matching engine is rule-based and explainable.

### Scoring Factors
- Skill and technology overlap
- Suggested role vs. job title overlap
- Remote-friendly job bonus

### Why rule-based (v1)?
- Easier to debug
- Easier to explain in interviews
- Deterministic
- Cheaper and more reliable than LLM-based scoring

---

## 🤖 AI Parsing Strategy

### 1. Anthropic-based parsing
If a valid ANTHROPIC_API_KEY is available, the resume is sent to Claude for structured parsing.

### 2. Fallback parser
Used when AI parsing fails due to:
- Missing API key
- Invalid API key
- Insufficient credits
- Malformed response
- Provider errors

This ensures the pipeline always works end-to-end.

---

## ⚠️ Known Limitations

- Only PDF resumes are supported
- Scanned/image PDFs may fail text extraction
- No authentication
- Files are stored locally
- Matching is rule-based (not semantic)
- No frontend
- No background jobs
- No production deployment setup

---

## 🚧 Future Improvements

- Add authentication
- Add DOCX support
- Add job update endpoint
- Improve matching algorithm
- Add semantic search / embeddings
- Add AI-based job scoring (optional)
- Add tests for services and endpoints
- Add pagination improvements
- Add deployment configuration
- Add frontend dashboard

---

## 💡 Why This Project Matters

This project demonstrates practical backend engineering skills:

- API design
- Database modeling
- Migrations
- File handling
- PDF processing
- External AI integration
- Graceful fallback design
- Rule-based scoring
- Modular architecture

Designed as a portfolio project for junior backend / AI integration roles.

---

## 👤 Author

Ehsan Emamian

GitHub: https://github.com/EhsanEmamian
LinkedIn: https://linkedin.com/in/ehsan-emamian