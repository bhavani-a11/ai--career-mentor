import asyncio

from fastapi import APIRouter

from app.models.chat import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    reply = await asyncio.to_thread(chat_service.generate_reply, request.message)
    return ChatResponse(reply=reply)
