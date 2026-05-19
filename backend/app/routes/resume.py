from fastapi import APIRouter, File, UploadFile
from app.models.resume import ResumeAnalyzeResponse
from app.services import pdf_service, resume_service

router = APIRouter(tags=["resume"])

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
    # Extract text from the PDF using the existing service
    text, _, _ = await pdf_service.process_pdf_upload(file)
    
    # Analyze the text using the new resume service
    analysis_result = resume_service.analyze_resume(text)
    
    return analysis_result
