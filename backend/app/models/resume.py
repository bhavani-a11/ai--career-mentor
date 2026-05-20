from typing import List, Optional
from pydantic import BaseModel, Field

class ResumeAnalyzeResponse(BaseModel):
    """Response model for resume analysis from the AI."""
    ats_score: int = Field(..., description="ATS score out of 100")
    missing_skills: List[str] = Field(..., description="List of important skills missing from the resume")
    suggestions: List[str] = Field(..., description="Actionable suggestions to improve the resume")
    weak_sections: List[str] = Field(..., description="Sections of the resume that need improvement")
    recommended_tech: List[str] = Field(..., description="Recommended technologies or tools to learn")

class ExperienceModel(BaseModel):
    company: str = ""
    position: str = ""
    startDate: str = ""
    endDate: str = ""
    description: str = ""

class EducationModel(BaseModel):
    school: str = ""
    degree: str = ""
    startDate: str = ""
    endDate: str = ""

class ResumeSaveRequest(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str = "My Resume"
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    summary: str = ""
    skills: List[str] = []
    experience: List[ExperienceModel] = []
    education: List[EducationModel] = []

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }

class ResumeResponse(ResumeSaveRequest):
    id: str = Field(..., alias="_id")

class ImproveSummaryRequest(BaseModel):
    experience: List[ExperienceModel] = []
    skills: List[str] = []

class SuggestSkillsRequest(BaseModel):
    experience: List[ExperienceModel] = []
    skills: List[str] = []

class ImproveDescriptionRequest(BaseModel):
    description: str

class GenerateFromJDRequest(BaseModel):
    resume: ResumeSaveRequest
    jd: str

class ResumeScoreRequest(BaseModel):
    resume: ResumeSaveRequest
