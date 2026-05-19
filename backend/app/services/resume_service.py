import json
import re

from fastapi import HTTPException, status
from app.services import github_llm
from app.models.resume import ResumeAnalyzeResponse

def _clean_json_string(raw_text: str) -> str:
    """Removes markdown code blocks if the AI returns them."""
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    
    if text.endswith("```"):
        text = text[:-3]
        
    return text.strip()

def analyze_resume(resume_text: str) -> ResumeAnalyzeResponse:
    """
    Analyzes the extracted resume text using GitHub Models AI.
    Returns a structured ResumeAnalyzeResponse.
    """
    
    system_prompt = (
        "You are an expert HR Recruiter and ATS (Applicant Tracking System) Analyzer.\n"
        "Your task is to analyze the provided resume text and evaluate its quality.\n"
        "You MUST return your response as a valid JSON object matching the following structure exactly:\n"
        "{\n"
        '  "ats_score": 75,\n'
        '  "missing_skills": ["skill1", "skill2"],\n'
        '  "suggestions": ["suggestion1", "suggestion2"],\n'
        '  "weak_sections": ["section1", "section2"],\n'
        '  "recommended_tech": ["tech1", "tech2"]\n'
        "}\n"
        "Do NOT include any text outside the JSON object."
    )
    
    user_prompt = f"Here is the resume text to analyze:\n\n{resume_text}"
    
    # Call the AI model
    raw_response = github_llm.complete(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.3  # Lower temperature for more deterministic/structured output
    )
    
    # Clean and parse the JSON
    cleaned_json = _clean_json_string(raw_response)
    
    try:
        data = json.loads(cleaned_json)
        return ResumeAnalyzeResponse(**data)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to parse AI response as JSON: {exc}. Raw response: {raw_response}"
        ) from exc
