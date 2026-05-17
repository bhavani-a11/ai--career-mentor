from pathlib import Path

from fastapi import HTTPException, status
from google import genai
from google.genai.types import GenerateContentConfig

from app.config import settings

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
SYSTEM_PROMPT_PATH = PROMPTS_DIR / "career_mentor_system.txt"

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client

    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GEMINI_API_KEY is not set. Add it to backend/.env and restart the server.",
        )

    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)

    return _client


def _load_system_prompt() -> str:
    if SYSTEM_PROMPT_PATH.is_file():
        return SYSTEM_PROMPT_PATH.read_text(encoding="utf-8").strip()
    return "You are a helpful AI career mentor."


def generate_reply(user_message: str) -> str:
    """Send the user message to Gemini and return the assistant's text."""
    client = _get_client()

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=user_message,
            config=GenerateContentConfig(system_instruction=_load_system_prompt()),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API request failed: {exc}",
        ) from exc

    reply = getattr(response, "text", None)
    if not reply or not reply.strip():
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini returned an empty response. Try again or rephrase your message.",
        )

    return reply.strip()
