from typing import List
from pydantic import BaseModel, Field

class SkillAnalyzeRequest(BaseModel):
    """Request to analyze skill gaps."""
    target_role: str = Field(..., description="The target job role to analyze skills for")
    current_skills: List[str] = Field(..., description="List of current skills the user has")

class SkillAnalyzeResponse(BaseModel):
    """Response containing skill gap analysis."""
    missing_skills: List[str] = Field(..., description="Skills that are missing for the target role")
    skill_level: str = Field(..., description="Overall skill level assessment (Beginner, Intermediate, Advanced)")
    suggestions: List[str] = Field(..., description="Suggestions to improve skills")
    learning_resources: List[str] = Field(..., description="Recommended learning resources")
