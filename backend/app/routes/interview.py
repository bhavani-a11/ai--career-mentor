from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime

from app.models.interview import (
    InterviewStartRequest,
    InterviewStartResponse,
    InterviewAnswerRequest,
    InterviewAnswerResponse,
    SaveInterviewRequest,
    SavedInterviewResponse
)
from app.services import interview_service, auth_service
from app.db.mongodb import get_database

router = APIRouter(prefix="/interview", tags=["interview"])

# 1. Start Mock Interview (Customized by Experience Level & Mode)
@router.post("/start", response_model=InterviewStartResponse)
async def start_interview(
    req: InterviewStartRequest,
    current_user: dict = Depends(auth_service.get_current_user)
) -> InterviewStartResponse:
    """
    Start a new mock interview by selecting the mode, role, and experience level. Returns the first question.
    """
    return interview_service.start_interview(req.mode, req.role, req.experience_level)


# 2. Answer Current Question & Retrieve Next Question
@router.post("/answer", response_model=InterviewAnswerResponse)
async def answer_interview(
    req: InterviewAnswerRequest,
    current_user: dict = Depends(auth_service.get_current_user)
) -> InterviewAnswerResponse:
    """
    Submit an answer to the current interview question. Returns score, feedback, and next question.
    """
    return interview_service.evaluate_answer_and_next(
        req.mode, req.role, req.experience_level, req.answer, req.history
    )


# 3. Generate Full Final Evaluation Debrief Report
@router.post("/report")
async def generate_report(
    req: Dict[str, Any],
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Generates a full evaluation debrief report of the completed interview.
    """
    role = req.get("role", "Candidate")
    mode = req.get("mode", "HR")
    experience_level = req.get("experience_level", "Junior")
    history = req.get("history", [])
    
    if not history:
        raise HTTPException(status_code=400, detail="Cannot generate report for empty interview history.")
        
    report = interview_service.generate_final_report(role, mode, experience_level, history)
    return report


# 4. Save Completed Interview to MongoDB History
@router.post("/save")
async def save_interview(
    req: SaveInterviewRequest,
    current_user: dict = Depends(auth_service.get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Saves a completed interview session scorecard and history to MongoDB.
    """
    doc = req.model_dump()
    doc["user_id"] = current_user["_id"]
    doc["created_at"] = datetime.utcnow().isoformat()
    
    result = await db["mock_interviews"].insert_one(doc)
    return {"status": "success", "id": str(result.inserted_id)}


# 5. List Interview History for Logged-In User
@router.get("/history")
async def get_interview_history(
    current_user: dict = Depends(auth_service.get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Retrieves previous interview scorecards saved by the authenticated user.
    """
    cursor = db["mock_interviews"].find({"user_id": current_user["_id"]}).sort("created_at", -1)
    interviews = await cursor.to_list(length=100)
    for idx in range(len(interviews)):
        interviews[idx]["_id"] = str(interviews[idx]["_id"])
    return interviews
