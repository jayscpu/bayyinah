from openai import OpenAI

from app.config import settings

_client = None


def get_llm_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL,
        )
    return _client


def chat_completion(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 500,
) -> str:
    """Send a chat completion request to OpenRouter and return the response text."""
    client = get_llm_client()
    response = client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""
