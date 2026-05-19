"""
PDF upload endpoint — extract text, chunk, embed, store in FAISS.
"""

import asyncio

from fastapi import APIRouter, File, UploadFile

from app.ai import rag_pipeline
from app.models.upload import PdfUploadResponse
from app.services import pdf_service

router = APIRouter(tags=["upload"])


@router.post("/upload/pdf", response_model=PdfUploadResponse)
async def upload_pdf(
    file: UploadFile = File(
        ...,
        description="A PDF file (e.g. resume). Max 10 MB. Text is indexed for RAG chat.",
    ),
) -> PdfUploadResponse:
    text, page_count, filename = await pdf_service.process_pdf_upload(file)

    # Index in background thread (embeddings can take a few seconds on first run)
    chunk_count = await asyncio.to_thread(rag_pipeline.index_text, text, filename)

    return PdfUploadResponse(
        filename=filename,
        page_count=page_count,
        char_count=len(text),
        chunk_count=chunk_count,
        text=text,
        indexed=True,
    )
