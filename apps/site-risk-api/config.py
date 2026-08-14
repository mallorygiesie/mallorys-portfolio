from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"

    # Azure OpenAI — reuse the same deployment as the gift app
    azure_openai_endpoint: str
    azure_openai_api_key: Optional[str] = None
    azure_openai_api_version: str = "2024-08-01-preview"
    azure_openai_chat_deployment: str = "gpt-4o"

    # NASA FIRMS — free key at firms.modaps.eosdis.nasa.gov
    firms_api_key: str = ""

    # EPA AirNow — free key at airnowapi.org
    airnow_api_key: str = ""

    frontend_origin: str = "http://localhost:5173"

    @property
    def is_prod(self) -> bool:
        return self.environment.lower() in {"production", "prod"}


settings = Settings()
