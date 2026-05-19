from pydantic import BaseModel, Field


class PdfUploadResponse(BaseModel):
    """JSON returned after a successful PDF upload, indexing, and text extraction."""

    filename: str = Field(..., description="Original name of the uploaded file")
    page_count: int = Field(..., description="Number of pages in the PDF")
    char_count: int = Field(..., description="Total characters extracted")
    chunk_count: int = Field(..., description="Number of text chunks stored in FAISS")
    text: str = Field(..., description="Plain text extracted from all pages")
    indexed: bool = Field(..., description="Whether vectors were saved to FAISS")
