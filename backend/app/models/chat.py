from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="The user's message to the career mentor",
        examples=["What skills are listed on my resume?"],
    )
    use_rag: bool = Field(
        default=True,
        description=(
            "If true, search the uploaded PDF chunks before answering. "
            "Requires a PDF uploaded via POST /api/upload/pdf first."
        ),
    )


class ChatResponse(BaseModel):
    reply: str = Field(..., description="The AI mentor's reply")
    chunks_used: int | None = Field(
        default=None,
        description="How many document chunks were retrieved (RAG only)",
    )
