from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "AI Resume Job Matcher"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    DATABASE_URL: str
    ANTHROPIC_API_KEY: str = ""

    RESUME_VALIDATION_MODEL: str = "claude-3-haiku-20240307"
    RESUME_PARSING_MODEL: str = "claude-3-5-sonnet-latest"

    ADZUNA_APP_ID: str = ""
    ADZUNA_APP_KEY: str = ""
    ADZUNA_BASE_URL: str = "https://api.adzuna.com/v1/api/jobs"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()