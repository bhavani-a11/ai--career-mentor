from typing import List
from pydantic import BaseModel, Field

class ResumeAnalyzeResponse(BaseModel):
    """Response model for resume analysis from the AI."""
    ats_score: int = Field(..., description="ATS score out of 100")
    missing_skills: List[str] = Field(..., description="List of important skills missing from the resume")
    suggestions: List[str] = Field(..., description="Actionable suggestions to improve the resume")
    weak_sections: List[str] = Field(..., description="Sections of the resume that need improvement")
    recommended_tech: List[str] = Field(..., description="Recommended technologies or tools to learn")
