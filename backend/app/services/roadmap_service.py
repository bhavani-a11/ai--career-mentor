import json
from fastapi import HTTPException, status
from app.services import github_llm
from app.models.roadmap import RoadmapResponse

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

def generate_roadmap(target_role: str, current_experience: str, timeline: str) -> RoadmapResponse:
    """Generates a step-by-step learning roadmap to achieve the target role."""
    system_prompt = (
        "You are an expert Career Coach and Learning Path Designer.\n"
        "Your task is to create a detailed learning roadmap for someone to achieve a specific job role.\n"
        "You MUST return your response as a valid JSON object matching the following structure exactly:\n"
        "{\n"
        '  "target_role": "Software Engineer",\n'
        '  "timeline": "6 months",\n'
        '  "steps": [\n'
        '    {\n'
        '      "phase": "Foundation",\n'
        '      "duration": "2 months",\n'
        '      "goals": ["Learn basic programming concepts", "Set up development environment"],\n'
        '      "topics": ["Python/JavaScript", "Version Control", "Basic Algorithms"],\n'
        '      "resources": ["Coursera Course", "FreeCodeCamp", "Official Documentation"]\n'
        '    }\n'
        '  ]\n'
        "}\n"
        "Create at least 3 phases (steps). Do NOT include any text outside the JSON object."
    )
    
    user_prompt = f"""
    Target Job Role: {target_role}
    Current Experience Level: {current_experience}
    Desired Timeline: {timeline}
    
    Please create a detailed learning roadmap.
    """
    
    raw_response = github_llm.complete(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.3
    )
    
    cleaned_json = _clean_json_string(raw_response)
    
    try:
        data = json.loads(cleaned_json)
        return RoadmapResponse(**data)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to parse AI response as JSON: {exc}. Raw response: {raw_response}"
        ) from exc
