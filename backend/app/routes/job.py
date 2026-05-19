from fastapi import APIRouter
from app.models.job import JobMatchRequest, JobMatchResponse
from app.services import job_service

router = APIRouter(tags=["job"])

@router.post("/job/match", response_model=JobMatchResponse)
async def match_job(request: JobMatchRequest) -> JobMatchResponse:
    """
    Match a resume to a job description and get a match score.
    """
    return job_service.match_job(request.resume_text, request.job_description)
