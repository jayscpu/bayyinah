import asyncio
from typing import Optional

from openai import OpenAI, RateLimitError

from app.config import settings

_client = None


def get_llm_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL,
            timeout=30.0,
        )
    return _client


def _sync_chat_completion(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 500,
    model: Optional[str] = None,
) -> str:
    """Synchronous chat completion call."""
    client = get_llm_client()
    response = client.chat.completions.create(
        model=model or settings.LLM_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


async def chat_completion(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 500,
) -> str:
    """Send a chat completion request to OpenRouter without blocking the event loop.

    Falls back to LLM_FALLBACK_MODEL if the primary model hits a rate limit.
    """
    try:
        return await asyncio.to_thread(
            _sync_chat_completion, messages, temperature, max_tokens, settings.LLM_MODEL
        )
    except RateLimitError:
        print(f"Rate limit hit on {settings.LLM_MODEL}, retrying with fallback model {settings.LLM_FALLBACK_MODEL}")
        return await asyncio.to_thread(
            _sync_chat_completion, messages, temperature, max_tokens, settings.LLM_FALLBACK_MODEL
        )
