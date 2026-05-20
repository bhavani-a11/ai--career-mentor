import json
import re
from typing import List, Dict, Any
from fastapi import HTTPException, status
from app.services import github_llm
from app.models.resume import ResumeAnalyzeResponse, ExperienceModel, ResumeSaveRequest

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
    
    raw_response = github_llm.complete(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.3
    )
    
    cleaned_json = _clean_json_string(raw_response)
    
    try:
        data = json.loads(cleaned_json)
        return ResumeAnalyzeResponse(**data)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to parse AI response as JSON: {exc}. Raw response: {raw_response}"
        ) from exc

def improve_summary(experience: List[ExperienceModel], skills: List[str]) -> str:
    """Generates a professional 2-3 sentence summary based on experience and skills."""
    system_prompt = (
        "You are an expert resume writer. Write a compelling, results-oriented professional summary (2-3 sentences) "
        "tailored for a resume. Use active, high-impact language and focus on value added. "
        "Do not include any placeholders, conversational text, or markdown code blocks. Output ONLY the raw paragraph."
    )
    
    exp_details = "\n".join([f"- {e.position} at {e.company}: {e.description}" for e in experience])
    skills_details = ", ".join(skills)
    user_prompt = f"Experience:\n{exp_details}\n\nSkills:\n{skills_details}"
    
    response = github_llm.complete(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.7
    )
    return response.strip()

def suggest_skills(experience: List[ExperienceModel], current_skills: List[str]) -> List[str]:
    """Suggests 5-8 relevant skills based on experience and current skills."""
    system_prompt = (
        "You are an ATS optimization specialist. Suggest 5-8 high-value skills to add to a resume based on the "
        "provided work experiences and current skill list. Focus on in-demand technical terms, languages, frameworks, or tools.\n"
        "You MUST return your response as a valid JSON list of strings, like this: [\"React\", \"AWS\"].\n"
        "Do NOT include any text outside the JSON list."
    )
    
    exp_details = "\n".join([f"- {e.position} at {e.company}: {e.description}" for e in experience])
    skills_details = ", ".join(current_skills)
    user_prompt = f"Work Experience:\n{exp_details}\n\nCurrent Skills:\n{skills_details}"
    
    raw_response = github_llm.complete(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.4
    )
    cleaned_json = _clean_json_string(raw_response)
    try:
        return json.loads(cleaned_json)
    except Exception:
        # Fallback in case of parsing error: attempt regex extraction
        matches = re.findall(r'"([^"]*)"', cleaned_json)
        return matches[:8] if matches else ["API Design", "Cloud Computing", "System Design"]

def improve_description(description: str) -> str:
    """Polishes a job description bullet point using the STAR method and strong action verbs."""
    system_prompt = (
        "You are a professional resume writer. Rewrite the following work/project description to make it highly impactful. "
        "Structure it using action-oriented bullets, implementing the STAR method (Action + Context + Quantifiable Result if possible). "
        "Output ONLY the improved description (1-2 sentences/bullets max). Do not include introductory notes, conversational filler, or quotes."
    )
    
    response = github_llm.complete(
        system_prompt=system_prompt,
        user_prompt=description,
        temperature=0.7
    )
    return response.strip()

def calculate_resume_score(resume: ResumeSaveRequest) -> Dict[str, Any]:
    """Scores a full resume and returns ATS rating plus recommendations."""
    system_prompt = (
        "You are an ATS Scoring Algorithm. Rate the provided resume on a scale of 0 to 100 based on structural completeness, "
        "impact of language, summary quality, and skills layout.\n"
        "You MUST return your response as a valid JSON object matching this structure exactly:\n"
        "{\n"
        '  "score": 85,\n'
        '  "suggestions": ["suggestion1", "suggestion2"]\n'
        "}\n"
        "Do NOT include any text outside the JSON object."
    )
    
    user_prompt = f"Resume Details:\n{resume.model_dump_json()}"
    raw_response = github_llm.complete(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.3
    )
    cleaned_json = _clean_json_string(raw_response)
    try:
        return json.loads(cleaned_json)
    except Exception:
        return {"score": 70, "suggestions": ["Add more quantifiable achievements.", "Highlight relevant tools in your skills section."]}

def generate_tailored_resume(resume: ResumeSaveRequest, jd: str) -> Dict[str, Any]:
    """Tailors and regenerates professional summary, experience descriptions, and skills to align with a Job Description."""
    system_prompt = (
        "You are a professional resume tailorer and career coach. Your task is to modify the professional summary, "
        "skills list, and experience descriptions in the provided resume to align perfectly with the given Job Description (JD).\n"
        "Keep contact info, names, companies, schools, and degrees exactly as they are. Improve experience description bullets "
        "to highlight matching accomplishments, optimize summaries, and inject relevant skills from the JD.\n"
        "You MUST return the modified resume matching the provided JSON schema exactly:\n"
        "{\n"
        '  "title": "Tailored Resume",\n'
        '  "name": "Original Name",\n'
        '  "email": "Original Email",\n'
        '  "phone": "Original Phone",\n'
        '  "location": "Original Location",\n'
        '  "linkedin": "Original LinkedIn",\n'
        '  "summary": "AI tailored summary...",\n'
        '  "skills": ["tailored_skill1", "tailored_skill2"],\n'
        '  "experience": [{"company": "...", "position": "...", "startDate": "...", "endDate": "...", "description": "tailored description..."}],\n'
        '  "education": [{"school": "...", "degree": "...", "startDate": "...", "endDate": "..."}]\n'
        "}\n"
        "Ensure your response is valid JSON. Do NOT include any text outside the JSON object."
    )
    
    user_prompt = f"Original Resume JSON:\n{resume.model_dump_json()}\n\nTarget Job Description:\n{jd}"
    raw_response = github_llm.complete(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.5
    )
    cleaned_json = _clean_json_string(raw_response)
    try:
        return json.loads(cleaned_json)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate tailored JSON resume: {exc}."
        )
