"""
Chat service — plain chat or RAG-augmented chat (both use GitHub Models only).
"""

from app.ai import rag_pipeline
from app.services import github_llm


def generate_reply(user_message: str) -> str:
    """Simple chat: no document context, only the system prompt + user message."""
    return github_llm.complete(
        github_llm.load_system_prompt(),
        user_message,
    )


def generate_rag_reply(user_message: str) -> tuple[str, int]:
    """
    RAG chat: retrieve PDF chunks, then ask GitHub Models with context.

    Returns (reply, chunks_used).
    """
    return rag_pipeline.generate_rag_answer(user_message)
