from fastapi import APIRouter
from app.models.interview import InterviewStartRequest, InterviewStartResponse, InterviewAnswerRequest, InterviewAnswerResponse
from app.services import interview_service

router = APIRouter(tags=["interview"])

@router.post("/interview/start", response_model=InterviewStartResponse)
def start_interview(req: InterviewStartRequest) -> InterviewStartResponse:
    """
    Start a new mock interview by selecting the mode and role. Returns the first question.
    """
    return interview_service.start_interview(req.mode, req.role)

@router.post("/interview/answer", response_model=InterviewAnswerResponse)
def answer_interview(req: InterviewAnswerRequest) -> InterviewAnswerResponse:
    """
    Submit an answer to the current interview question. Returns an evaluation score, feedback, and the next question.
    """
    return interview_service.evaluate_answer_and_next(req.mode, req.role, req.answer, req.history)
