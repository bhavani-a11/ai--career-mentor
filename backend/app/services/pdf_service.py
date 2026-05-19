"""
PDF processing logic — read bytes, extract text, optionally save to disk.

Routes should stay thin; all PDF work happens here.
"""

from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from pypdf import PdfReader

from app.config import settings

# Only accept PDF uploads (MIME type or .pdf extension)
ALLOWED_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}
MAX_PDF_BYTES = 10 * 1024 * 1024  # 10 MB — adjust via env later if needed


def _validate_pdf_file(file: UploadFile) -> None:
    """Reject files that are clearly not PDFs before we read the body."""
    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()

    is_pdf_extension = filename.endswith(".pdf")
    is_pdf_mime = content_type in ALLOWED_CONTENT_TYPES or content_type == ""

    if not is_pdf_extension and not is_pdf_mime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed. Upload a file ending in .pdf",
        )


def extract_text_from_bytes(pdf_bytes: bytes) -> tuple[str, int]:
    """
    Parse PDF bytes and return (extracted_text, page_count).

    Uses pypdf: opens the PDF in memory (BytesIO), loops each page,
    and calls extract_text() on every page.
    """
    try:
        reader = PdfReader(BytesIO(pdf_bytes))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read PDF file. It may be corrupted or password-protected: {exc}",
        ) from exc

    page_count = len(reader.pages)
    page_texts: list[str] = []

    for index, page in enumerate(reader.pages, start=1):
        # extract_text() returns None for some scanned/image-only pages
        raw = page.extract_text()
        if raw and raw.strip():
            page_texts.append(raw.strip())

    full_text = "\n\n".join(page_texts)

    if not full_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "No text could be extracted. The PDF may be scanned images only "
                "(OCR is not enabled yet)."
            ),
        )

    return full_text, page_count


def save_pdf_copy(pdf_bytes: bytes, original_filename: str) -> Path:
    """
    Save a copy under backend/uploads/ with a unique name to avoid overwrites.
    Returns the path where the file was stored.
    """
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)

    safe_stem = Path(original_filename or "document.pdf").stem[:80]
    unique_name = f"{safe_stem}_{uuid4().hex[:8]}.pdf"
    destination = settings.uploads_dir / unique_name

    destination.write_bytes(pdf_bytes)
    return destination


async def process_pdf_upload(file: UploadFile) -> tuple[str, int, str]:
    """
    Full pipeline: validate → read bytes → extract text → save copy.

    Returns (extracted_text, page_count, original_filename).
    """
    _validate_pdf_file(file)

    # Read the entire file into memory (fine for small PDFs like resumes)
    pdf_bytes = await file.read()

    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"PDF is too large. Maximum size is {MAX_PDF_BYTES // (1024 * 1024)} MB.",
        )

    text, page_count = extract_text_from_bytes(pdf_bytes)

    # Keep a copy on disk for future features (embeddings, resume review)
    save_pdf_copy(pdf_bytes, file.filename or "document.pdf")

    return text, page_count, file.filename or "document.pdf"
