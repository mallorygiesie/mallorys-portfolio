from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Environment: "development" or "production".
    # In production, API keys are optional (managed identity is used) and the
    # expensive endpoints are gated behind ADMIN_TOKEN.
    environment: str = "development"

    # Azure OpenAI
    azure_openai_endpoint: str
    # Optional: leave unset in prod to authenticate via Managed Identity (Entra ID).
    azure_openai_api_key: Optional[str] = None
    azure_openai_api_version: str = "2024-08-01-preview"
    azure_openai_embedding_deployment: str = "text-embedding-3-small"
    azure_openai_chat_deployment: str = "gpt-4o"

    # Azure AI Search
    azure_search_endpoint: str
    # Optional: leave unset in prod to authenticate via Managed Identity (Entra ID).
    azure_search_api_key: Optional[str] = None
    azure_search_index_name: str = "mallory-items"

    # Raindrop.io (not an Azure service — keep as a secret in App Settings / Key Vault)
    raindrop_token: str = ""

    # Tavily web search (https://tavily.com — free tier: 1,000 searches/month)
    tavily_api_key: str = ""

    # Image generation (Azure DALL-E 3 deployment)
    azure_openai_image_deployment: str = ""

    # CORS
    frontend_origin: str = "http://localhost:5173"

    # --- Abuse / cost controls (see HARDENING_SPEC.md) -------------------------
    # Admin token required to call expensive endpoints (/sync, /generate) in prod.
    admin_token: str = ""

    # Chat usage caps, per UTC day.
    chat_limit_per_ip_per_day: int = 5
    chat_limit_global_per_day: int = 200

    @property
    def is_prod(self) -> bool:
        return self.environment.lower() in {"production", "prod"}


settings = Settings()
