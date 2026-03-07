import asyncio
import httpx
import os
from contextvars import ContextVar
from typing import List, Dict, Any

# Z.AI API: https://docs.z.ai/api-reference/introduction
# General endpoint (not /v1 - that returns 404)
ZAI_BASE_URL = os.getenv("ZAI_BASE_URL", "https://api.z.ai/api/paas/v4")
ZAI_API_KEY = os.getenv("ZAI_API_KEY")
ZAI_MODEL = os.getenv("ZAI_MODEL", "glm-4-plus")
FLOCK_MODEL = os.getenv("FLOCK_MODEL", "deepseek-v3")

_fallback_used: ContextVar[bool] = ContextVar("zai_fallback_used", default=False)


def get_fallback_used() -> bool:
    return _fallback_used.get()


def set_fallback_used(value: bool) -> None:
    _fallback_used.set(value)


async def call_zai(
    messages: List[Dict[str, str]],
    system_prompt: str = "",
    temperature: float = 0.7,
    max_tokens: int = 4096
) -> str:
    """
    Core Z.AI GLM call. All agents route through here.
    Falls back to FLock if Z.AI unavailable after 3 attempts.
    """
    payload = {
        "model": ZAI_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            *messages
        ],
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{ZAI_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {ZAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            if attempt == 2:
                print(f"Z.AI failed after 3 attempts: {e}, falling back to FLock with model: {FLOCK_MODEL}")
                set_fallback_used(True)
                return await call_flock(messages, system_prompt, temperature, max_tokens)
            await asyncio.sleep(1)


async def call_flock(
    messages: List[Dict[str, str]],
    system_prompt: str,
    temperature: float,
    max_tokens: int
) -> str:
    """FLock fallback using open-source models."""
    flock_url = os.getenv("FLOCK_BASE_URL")
    flock_key = os.getenv("FLOCK_API_KEY")

    payload = {
        "model": FLOCK_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            *messages
        ],
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{flock_url}/chat/completions",
            headers={
                "x-litellm-api-key": flock_key,
                "Content-Type": "application/json",
                "accept": "application/json",
            },
            json=payload
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
