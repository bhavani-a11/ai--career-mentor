from fastapi import APIRouter
from app.models.skill import SkillAnalyzeRequest, SkillAnalyzeResponse
from app.services import skill_service

router = APIRouter(tags=["skill"])

@router.post("/skill/analyze", response_model=SkillAnalyzeResponse)
async def analyze_skills(request: SkillAnalyzeRequest) -> SkillAnalyzeResponse:
    """
    Analyze current skills against a target role and get recommendations.
    """
    return skill_service.analyze_skills(request.target_role, request.current_skills)
