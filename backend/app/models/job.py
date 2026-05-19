from typing import List
from pydantic import BaseModel, Field

class JobMatchRequest(BaseModel):
    """Request to match resume to a job description."""
    resume_text: str = Field(..., description="The full text of the resume")
    job_description: str = Field(..., description="The full text of the job description")

class JobMatchResponse(BaseModel):
    """Response containing job match analysis."""
    match_score: int = Field(..., description="Match score out of 100")
    strengths: List[str] = Field(..., description="Strengths that match the job requirements")
    gaps: List[str] = Field(..., description="Gaps between resume and job requirements")
    recommendations: List[str] = Field(..., description="Recommendations to improve the match")
    keyword_matches: List[str] = Field(..., description="Important keywords from the job description found in the resume")
