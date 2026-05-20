from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, status
from typing import List, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime

from app.models.resume import (
    ResumeAnalyzeResponse,
    ResumeSaveRequest,
    ResumeResponse,
    ImproveSummaryRequest,
    SuggestSkillsRequest,
    ImproveDescriptionRequest,
    GenerateFromJDRequest,
    ResumeScoreRequest
)
from app.services import pdf_service, resume_service, auth_service
from app.db.mongodb import get_database

router = APIRouter(tags=["resume"])

# 1. Existing PDF Upload & AI Analysis Route (Preserved Exactly)
@router.post("/resume/analyze", response_model=ResumeAnalyzeResponse)
async def analyze_resume(
    file: UploadFile = File(
        ...,
        description="A PDF resume file. Max 10 MB.",
    ),
) -> ResumeAnalyzeResponse:
    """
    Upload a resume PDF, extract its text, and analyze it using AI to get an ATS score and feedback.
    """
    text, _, _ = await pdf_service.process_pdf_upload(file)
    analysis_result = resume_service.analyze_resume(text)
    return analysis_result


# 2. Get All Saved Resumes for the Logged-In User
@router.get("/resumes", response_model=List[ResumeResponse])
async def list_resumes(
    current_user: dict = Depends(auth_service.get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Retrieves all resume documents belonging to the authenticated user.
    """
    cursor = db["resumes"].find({"user_id": current_user["_id"]}).sort("updated_at", -1)
    resumes = await cursor.to_list(length=100)
    
    # Format MongoDB _id into string field for Pydantic schema validation
    for r in resumes:
        r["_id"] = str(r["_id"])
    return resumes


# 3. Get a Specific Saved Resume
@router.get("/resumes/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: str,
    current_user: dict = Depends(auth_service.get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Retrieves a single resume document by ID, checking ownership.
    """
    if not ObjectId.is_valid(resume_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Resume ID format.")
        
    resume = await db["resumes"].find_one({"_id": ObjectId(resume_id), "user_id": current_user["_id"]})
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")
        
    resume["_id"] = str(resume["_id"])
    return resume


# 4. Save (Create or Update) a Resume
@router.post("/resumes", response_model=ResumeResponse)
async def save_resume(
    resume_data: ResumeSaveRequest,
    current_user: dict = Depends(auth_service.get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Saves a resume. If a valid _id is supplied, it performs an update.
    Otherwise, a new resume document is created.
    """
    doc = resume_data.model_dump(by_alias=True, exclude_none=True)
    doc["user_id"] = current_user["_id"]
    doc["updated_at"] = datetime.utcnow().isoformat()
    
    resume_id = doc.get("_id")
    if resume_id and ObjectId.is_valid(resume_id):
        # Update existing
        doc_id = ObjectId(resume_id)
        del doc["_id"] # Prevent mutating immutable field
        await db["resumes"].update_one(
            {"_id": doc_id, "user_id": current_user["_id"]},
            {"$set": doc}
        )
        saved_doc = await db["resumes"].find_one({"_id": doc_id})
    else:
        # Create new
        if "_id" in doc:
            del doc["_id"]
        result = await db["resumes"].insert_one(doc)
        saved_doc = await db["resumes"].find_one({"_id": result.inserted_id})
        
    saved_doc["_id"] = str(saved_doc["_id"])
    return saved_doc


# 5. Delete a Saved Resume
@router.delete("/resumes/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user: dict = Depends(auth_service.get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Deletes a specific resume document from MongoDB, checking ownership.
    """
    if not ObjectId.is_valid(resume_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Resume ID format.")
        
    result = await db["resumes"].delete_one({"_id": ObjectId(resume_id), "user_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found or unauthorized.")
        
    return {"status": "success", "message": "Resume deleted successfully."}


# 6. AI Summary Improver Route
@router.post("/resumes/improve-summary")
async def improve_summary(
    body: ImproveSummaryRequest,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Generates an optimized professional summary based on active work history and skills.
    """
    improved = resume_service.improve_summary(body.experience, body.skills)
    return {"summary": improved}


# 7. AI Skill Suggester Route
@router.post("/resumes/suggest-skills")
async def suggest_skills(
    body: SuggestSkillsRequest,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Analyzes current resume experience and skills to suggest additions to pass ATS check.
    """
    skills = resume_service.suggest_skills(body.experience, body.skills)
    return {"suggested_skills": skills}


# 8. AI Bullet Description Improver Route
@router.post("/resumes/improve-description")
async def improve_description(
    body: ImproveDescriptionRequest,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Polishes work experience description bullet using action verbs and STAR methodology.
    """
    improved = resume_service.improve_description(body.description)
    return {"description": improved}


# 9. AI Resume ATS Scoring Route
@router.post("/resumes/score")
async def score_resume(
    body: ResumeScoreRequest,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Rates the completeness and impact of a resume and displays actionable improvement pointers.
    """
    score_details = resume_service.calculate_resume_score(body.resume)
    return score_details


# 10. AI Tailored Resume Generator (based on Job Description)
@router.post("/resumes/generate-from-jd")
async def generate_from_jd(
    body: GenerateFromJDRequest,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Restructures skills, experience descriptions, and summarizes work accomplishments to match target Job Description.
    """
    tailored_resume = resume_service.generate_tailored_resume(body.resume, body.jd)
    return tailored_resume
