from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="The user's message to the career mentor",
        examples=["What skills do I need for a data analyst role?"],
    )


class ChatResponse(BaseModel):
    reply: str = Field(..., description="The AI mentor's reply")
