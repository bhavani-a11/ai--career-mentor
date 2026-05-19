from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class InterviewStartRequest(BaseModel):
    """Request to start a new mock interview."""
    mode: str = Field(..., description="Interview mode: 'HR' or 'Technical'")
    role: str = Field(..., description="Target job role, e.g., 'Software Engineer'")

class InterviewStartResponse(BaseModel):
    """Response containing the first question and initial state."""
    first_question: str = Field(..., description="The very first question of the interview")
    history: List[Dict[str, str]] = Field(..., description="Conversational history state to pass back on next request")

class InterviewAnswerRequest(BaseModel):
    """Request to submit an answer and get evaluated."""
    mode: str = Field(..., description="Interview mode: 'HR' or 'Technical'")
    role: str = Field(..., description="Target job role")
    answer: str = Field(..., description="The user's answer to the current question")
    history: List[Dict[str, str]] = Field(..., description="Current conversational history state")

class InterviewAnswerResponse(BaseModel):
    """Response containing evaluation, feedback, and the next question."""
    score: int = Field(..., description="Score out of 10 for the answer")
    feedback: str = Field(..., description="Feedback on the answer")
    suggestions: str = Field(..., description="Suggestions to improve")
    next_question: Optional[str] = Field(None, description="The next interview question, or null if interview ends")
    history: List[Dict[str, str]] = Field(..., description="Updated conversational history state")
