import json
from fastapi import HTTPException, status
from app.services import github_llm
from app.models.skill import SkillAnalyzeResponse

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

def analyze_skills(target_role: str, current_skills: list) -> SkillAnalyzeResponse:
    """Analyzes current skills against target role and provides recommendations."""
    system_prompt = (
        "You are an expert Career Coach and Skill Assessment Specialist.\n"
        "Your task is to analyze a user's current skills and compare them to what's needed for a target job role.\n"
        "You MUST return your response as a valid JSON object matching the following structure exactly:\n"
        "{\n"
        '  "missing_skills": ["skill1", "skill2", "skill3"],\n'
        '  "skill_level": "Beginner",\n'
        '  "suggestions": ["suggestion1", "suggestion2"],\n'
        '  "learning_resources": ["resource1", "resource2"]\n'
        "}\n"
        "skill_level must be one of: Beginner, Intermediate, Advanced\n"
        "Do NOT include any text outside the JSON object."
    )
    
    user_prompt = f"""
    Target Job Role: {target_role}
    Current Skills: {', '.join(current_skills)}
    
    Please analyze the skill gaps and provide recommendations.
    """
    
    raw_response = github_llm.complete(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.3
    )
    
    cleaned_json = _clean_json_string(raw_response)
    
    try:
        data = json.loads(cleaned_json)
        return SkillAnalyzeResponse(**data)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to parse AI response as JSON: {exc}. Raw response: {raw_response}"
        ) from exc
