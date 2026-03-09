"""Application configuration via pydantic-settings."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env from project root (parent of backend/)
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    """Load from environment with sensible defaults."""

    model_config = SettingsConfigDict(
        env_file=str(_ENV_PATH) if _ENV_PATH.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Z.AI
    ZAI_API_KEY: str = ""
    ZAI_BASE_URL: str = "https://api.z.ai/api/paas/v4"
    ZAI_MODEL: str = "glm-4-plus"

    # FLock fallback
    FLOCK_API_KEY: str = ""
    FLOCK_BASE_URL: str = "https://api.flock.io/v1"
    FLOCK_MODEL: str = "deepseek-v3"

    # LLM defaults (used by agents)
    DEFAULT_TEMPERATURE: float = 0.4
    DEFAULT_MAX_TOKENS: int = 4096
    ORCHESTRATOR_TEMPERATURE: float = 0.3
    ORCHESTRATOR_ASSESS_TEMPERATURE: float = 0.2
    OPERATIONS_TEMPERATURE: float = 0.4
    HR_TEMPERATURE: float = 0.5
    ADOPTION_TEMPERATURE: float = 0.4
    MARKET_INTELLIGENCE_TEMPERATURE: float = 0.4
    REVIEWER_TEMPERATURE: float = 0.3
    GUARDRAILS_TEMPERATURE: float = 0.1

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 20
    RATE_LIMIT_WINDOW_MINUTES: int = 10

    # App
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"
    LOG_DIR: str = "./logs"
    CORS_ORIGINS: str = "*"

    # SQLite store
    CONVERSATIONS_DB_PATH: str = "./data/conversations.db"


settings = Settings()
