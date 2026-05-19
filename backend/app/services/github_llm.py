"""
GitHub Models API — single place for all LLM calls (chat + RAG).

Uses OpenAI SDK pointed at https://models.github.ai/inference
"""

from pathlib import Path

from openai import OpenAI
from fastapi import HTTPException, status

from app.config import settings

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
SYSTEM_PROMPT_PATH = PROMPTS_DIR / "career_mentor_system.txt"

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    """Create (once) and reuse the OpenAI client for GitHub Models."""
    global _client

    if not settings.github_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GITHUB_TOKEN is not set. Add it to backend/.env and restart the server.",
        )

    if _client is None:
        _client = OpenAI(
            base_url="https://models.github.ai/inference",
            api_key=settings.github_token,
        )

    return _client


def load_system_prompt() -> str:
    if SYSTEM_PROMPT_PATH.is_file():
        return SYSTEM_PROMPT_PATH.read_text(encoding="utf-8").strip()
    return "You are a helpful AI career mentor."


def complete(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
    """Send system + user messages to GitHub Models and return assistant text."""
    client = _get_client()

    try:
        response = client.chat.completions.create(
            model=settings.github_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"GitHub Models API request failed: {exc}",
        ) from exc

    if not response.choices:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="GitHub Models returned an empty response.",
        )

    reply = response.choices[0].message.content
    if not reply or not reply.strip():
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="GitHub Models returned empty text.",
        )

    return reply.strip()
