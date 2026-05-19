from fastapi import APIRouter
from app.models.roadmap import RoadmapRequest, RoadmapResponse
from app.services import roadmap_service

router = APIRouter(tags=["roadmap"])

@router.post("/roadmap/generate", response_model=RoadmapResponse)
async def generate_roadmap(request: RoadmapRequest) -> RoadmapResponse:
    """
    Generate a step-by-step learning roadmap to achieve a target role.
    """
    return roadmap_service.generate_roadmap(
        request.target_role,
        request.current_experience,
        request.timeline
    )
