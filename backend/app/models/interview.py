from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class InterviewStartRequest(BaseModel):
    """Request to start a new mock interview."""
    mode: str = Field(..., description="Interview type: 'HR', 'Technical', or 'Mixed'")
    role: str = Field(..., description="Target job role, e.g., 'Software Engineer'")
    experience_level: str = Field(..., description="Experience level: 'Junior', 'Mid', or 'Senior'")

class InterviewStartResponse(BaseModel):
    """Response containing the first question and initial state."""
    first_question: str = Field(..., description="The very first question of the interview")
    history: List[Dict[str, str]] = Field(..., description="Conversational history state")

class InterviewAnswerRequest(BaseModel):
    """Request to submit an answer and get evaluated."""
    mode: str = Field(..., description="Interview mode")
    role: str = Field(..., description="Target job role")
    experience_level: str = Field(..., description="Experience level")
    answer: str = Field(..., description="The user's answer")
    history: List[Dict[str, str]] = Field(..., description="Current history")

class InterviewAnswerResponse(BaseModel):
    """Response containing evaluation, feedback, and the next question."""
    score: int = Field(..., description="Overall answer score (1-10)")
    feedback: str = Field(..., description="Detailed feedback")
    suggestions: str = Field(..., description="Suggestions to improve")
    next_question: Optional[str] = Field(None, description="The next question, or null if interview ends")
    history: List[Dict[str, str]] = Field(..., description="Updated history")

class SaveInterviewRequest(BaseModel):
    """Request to save the completed interview session evaluation to MongoDB."""
    role: str
    mode: str
    experience_level: str
    overall_score: int = Field(..., description="Final overall score")
    technical_score: int = Field(..., description="Technical rating (0-100)")
    communication_score: int = Field(..., description="Communication rating (0-100)")
    confidence_score: int = Field(..., description="Confidence rating (0-100)")
    strengths: List[str] = []
    weaknesses: List[str] = []
    suggestions: List[str] = []
    history: List[Dict[str, str]] = []

class SavedInterviewResponse(SaveInterviewRequest):
    """Response model for retrieving interview history."""
    id: str = Field(..., alias="_id")
    created_at: str
