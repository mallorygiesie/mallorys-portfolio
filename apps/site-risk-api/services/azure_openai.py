from __future__ import annotations

from typing import AsyncIterator, Optional

from openai import AsyncAzureOpenAI

from config import settings

_client: Optional[AsyncAzureOpenAI] = None


def get_client() -> AsyncAzureOpenAI:
    global _client
    if _client is None:
        if settings.azure_openai_api_key:
            _client = AsyncAzureOpenAI(
                azure_endpoint=settings.azure_openai_endpoint,
                api_key=settings.azure_openai_api_key,
                api_version=settings.azure_openai_api_version,
            )
        else:
            from azure.identity import DefaultAzureCredential, get_bearer_token_provider
            token_provider = get_bearer_token_provider(
                DefaultAzureCredential(),
                "https://cognitiveservices.azure.com/.default",
            )
            _client = AsyncAzureOpenAI(
                azure_endpoint=settings.azure_openai_endpoint,
                azure_ad_token_provider=token_provider,
                api_version=settings.azure_openai_api_version,
            )
    return _client


async def chat(
    system_prompt: str,
    user_message: str,
    max_tokens: int = 800,
    temperature: float = 0.2,
) -> str:
    client = get_client()
    response = await client.chat.completions.create(
        model=settings.azure_openai_chat_deployment,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=temperature,
        max_completion_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


async def chat_stream(
    system_prompt: str,
    user_message: str,
    max_tokens: int = 800,
) -> AsyncIterator[str]:
    client = get_client()
    stream = await client.chat.completions.create(
        model=settings.azure_openai_chat_deployment,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.3,
        max_completion_tokens=max_tokens,
        stream=True,
    )
    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
