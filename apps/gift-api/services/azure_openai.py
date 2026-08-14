from __future__ import annotations

import json
from typing import AsyncIterator, Optional

from openai import AsyncAzureOpenAI

from config import settings

_WEB_SEARCH_TOOL = {
    "type": "function",
    "function": {
        "name": "web_search",
        "description": (
            "Search the internet for gift ideas, specific products, or items that fit Mallory's taste. "
            "Use this when the user wants real, purchasable recommendations — not just taste analysis."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "A specific search query, e.g. 'minimalist ceramic mug gift ideas'",
                }
            },
            "required": ["query"],
        },
    },
}

_client: Optional[AsyncAzureOpenAI] = None


def get_client() -> AsyncAzureOpenAI:
    global _client
    if _client is None:
        if settings.azure_openai_api_key:
            # Local dev / fallback: API key auth.
            _client = AsyncAzureOpenAI(
                azure_endpoint=settings.azure_openai_endpoint,
                api_key=settings.azure_openai_api_key,
                api_version=settings.azure_openai_api_version,
            )
        else:
            # Production: Managed Identity (Entra ID) — no stored key.
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


async def embed(text: str) -> list[float]:
    client = get_client()
    response = await client.embeddings.create(
        model=settings.azure_openai_embedding_deployment,
        input=text,
    )
    return response.data[0].embedding


async def chat(
    system_prompt: str,
    user_message: str,
    max_tokens: int = 600,
    history: Optional[list[dict]] = None,
) -> str:
    client = get_client()
    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_message})
    response = await client.chat.completions.create(
        model=settings.azure_openai_chat_deployment,
        messages=messages,
        temperature=0.3,
        max_completion_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


async def chat_stream(
    system_prompt: str,
    user_message: str,
    max_tokens: int = 600,
    history: Optional[list[dict]] = None,
) -> AsyncIterator[str]:
    from openai import BadRequestError

    client = get_client()

    async def _stream(msgs: list[dict]) -> AsyncIterator[str]:
        stream = await client.chat.completions.create(
            model=settings.azure_openai_chat_deployment,
            messages=msgs,
            temperature=0.3,
            max_completion_tokens=max_tokens,
            stream=True,
        )
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    try:
        async for token in _stream(messages):
            yield token
    except BadRequestError as exc:
        # Azure content filter false-positive (common with beauty/skincare topics).
        # Retry by inlining history as text inside the user message rather than as
        # separate role-based messages — the filter is triggered by multi-turn
        # beauty/skincare conversation patterns, not the content itself.
        if getattr(exc, "code", None) == "content_filter" and history:
            prior = "\n".join(
                f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
                for m in history
            )
            inlined_message = (
                f"[Prior conversation for context:]\n{prior}\n\n"
                f"[Current question:]\n{user_message}"
            )
            flat_messages: list[dict] = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": inlined_message},
            ]
            try:
                async for token in _stream(flat_messages):
                    yield token
                return
            except BadRequestError:
                pass
        raise


async def chat_with_tools(system_prompt: str, user_message: str, force_search: bool = False) -> str:
    """Chat completion with a web_search tool available. Runs up to 3 tool-call rounds.

    force_search=True forces the first call to use the tool (for recommendation queries).
    """
    from services.web_search import search as web_search

    client = get_client()
    messages: list = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    for i in range(3):
        tool_choice = {"type": "function", "function": {"name": "web_search"}} if (force_search and i == 0) else "auto"
        response = await client.chat.completions.create(
            model=settings.azure_openai_chat_deployment,
            messages=messages,
            tools=[_WEB_SEARCH_TOOL],
            tool_choice=tool_choice,
            temperature=0.3,
            max_completion_tokens=800,
        )
        choice = response.choices[0]

        if choice.finish_reason != "tool_calls":
            return choice.message.content or ""

        messages.append(choice.message)
        for tc in choice.message.tool_calls:
            args = json.loads(tc.function.arguments)
            result = await web_search(args.get("query", ""))
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": result,
            })

    # Max rounds reached — get final answer without tools
    response = await client.chat.completions.create(
        model=settings.azure_openai_chat_deployment,
        messages=messages,
        temperature=0.3,
        max_completion_tokens=800,
    )
    return response.choices[0].message.content or ""
