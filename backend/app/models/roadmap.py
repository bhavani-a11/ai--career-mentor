from typing import List
from pydantic import BaseModel, Field

class RoadmapRequest(BaseModel):
    """Request to generate a learning roadmap."""
    target_role: str = Field(..., description="The target job role to generate a roadmap for")
    current_experience: str = Field(..., description="Current experience level (e.g., Beginner, 1-2 years, etc.)")
    timeline: str = Field(..., description="Desired timeline to achieve the role (e.g., 3 months, 6 months, 1 year)")

class RoadmapStep(BaseModel):
    """A single step in the learning roadmap."""
    phase: str = Field(..., description="Phase name (e.g., Foundation, Intermediate, Advanced)")
    duration: str = Field(..., description="Estimated duration for this phase")
    goals: List[str] = Field(..., description="Goals to achieve in this phase")
    topics: List[str] = Field(..., description="Topics to learn in this phase")
    resources: List[str] = Field(..., description="Recommended resources for this phase")

class RoadmapResponse(BaseModel):
    """Response containing the full learning roadmap."""
    target_role: str = Field(..., description="The target job role")
    timeline: str = Field(..., description="Total timeline to achieve the role")
    steps: List[RoadmapStep] = Field(..., description="Ordered list of roadmap steps")
