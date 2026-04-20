from fastapi import FastAPI

from app.config import settings
from app.jobs.router import router as jobs_router
from app.matching.router import router as matching_router
from app.resume.router import router as resume_router


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.include_router(jobs_router, prefix="/jobs", tags=["Jobs"])
    app.include_router(resume_router, prefix="/resumes", tags=["Resumes"])
    app.include_router(matching_router, prefix="/matches", tags=["Matches"])

    @app.get("/health", tags=["Health"])
    def health_check() -> dict:
        return {
            "status": "ok",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
        }

    return app


app = create_app()