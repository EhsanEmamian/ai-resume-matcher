from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.core.logging_config import setup_logging
from app.core.limiter import limiter
from app.exceptions import AppError
from app.jobs.router import router as jobs_router
from app.matching.router import router as matching_router
from app.resume.router import router as resume_router


def create_app() -> FastAPI:
    setup_logging(settings.DEBUG)
    
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)
    
    # تنظیمات CORS آپدیت شد
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_exceeded_handler(
        request: Request,
        exc: RateLimitExceeded,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=429,
            content={
                "error": "RateLimitExceeded",
                "detail": (
                    "Upload limit exceeded. You may parse up to 3 resumes per day."
                ),
            },
        )

    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": type(exc).__name__,
                "detail": exc.message,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={
                "error": "InternalServerError",
                "detail": "An unexpected error occurred.",
            },
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