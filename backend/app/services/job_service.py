import json
from fastapi import HTTPException, status
from app.services import github_llm
from app.models.job import JobMatchResponse

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

def match_job(resume_text: str, job_description: str) -> JobMatchResponse:
    """Matches a resume to a job description and provides a match score."""
    system_prompt = (
        "You are an expert HR Recruiter and Job Matching Specialist.\n"
        "Your task is to compare a resume to a job description and evaluate the match.\n"
        "You MUST return your response as a valid JSON object matching the following structure exactly:\n"
        "{\n"
        '  "match_score": 75,\n'
        '  "strengths": ["strength1", "strength2"],\n'
        '  "gaps": ["gap1", "gap2"],\n'
        '  "recommendations": ["recommendation1", "recommendation2"],\n'
        '  "keyword_matches": ["keyword1", "keyword2"]\n'
        "}\n"
        "Do NOT include any text outside the JSON object."
    )
    
    user_prompt = f"""
    Resume Text:
    {resume_text}
    
    Job Description:
    {job_description}
    
    Please analyze the match between the resume and the job description.
    """
    
    raw_response = github_llm.complete(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.3
    )
    
    cleaned_json = _clean_json_string(raw_response)
    
    try:
        data = json.loads(cleaned_json)
        return JobMatchResponse(**data)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to parse AI response as JSON: {exc}. Raw response: {raw_response}"
        ) from exc
