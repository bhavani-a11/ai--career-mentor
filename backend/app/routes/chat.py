import asyncio

from fastapi import APIRouter

from app.ai import rag_pipeline
from app.models.chat import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Chat with the career mentor.

    - use_rag=true (default): answer using uploaded PDF context + GitHub Models
    - use_rag=false: general chat without document retrieval
    """
    if request.use_rag:
        if not rag_pipeline.vectorstore_exists():
            # No PDF indexed yet — fall back to plain chat
            reply = await asyncio.to_thread(chat_service.generate_reply, request.message)
            return ChatResponse(reply=reply, chunks_used=None)

        reply, chunks_used = await asyncio.to_thread(
            chat_service.generate_rag_reply,
            request.message,
        )
        return ChatResponse(reply=reply, chunks_used=chunks_used)

    reply = await asyncio.to_thread(chat_service.generate_reply, request.message)
    return ChatResponse(reply=reply, chunks_used=None)
