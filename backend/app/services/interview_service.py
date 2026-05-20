import json
from typing import Dict, Any, List
from fastapi import HTTPException, status
from app.services import github_llm
from app.models.interview import InterviewStartResponse, InterviewAnswerResponse

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

def start_interview(mode: str, role: str, experience_level: str) -> InterviewStartResponse:
    """Starts a new mock interview by asking the very first customized question."""
    system_prompt = (
        f"You are an elite corporate interviewer conducting a {mode} interview for a {experience_level}-level {role} role.\n"
        "Your task is to ask a highly realistic, professional starting question appropriate for this candidate's level.\n"
        "Output ONLY the question text itself. Do NOT include any introductory greetings, welcome notes, or pleasantries."
    )
    
    user_prompt = f"Conducting a {mode} interview for a {experience_level}-level {role}. Ask the first question."
    
    first_question = github_llm.complete(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.7
    )
    
    # Initialize conversational memory
    history = [
        {"role": "assistant", "content": first_question}
    ]
    
    return InterviewStartResponse(first_question=first_question, history=history)

def evaluate_answer_and_next(
    mode: str, 
    role: str, 
    experience_level: str, 
    answer: str, 
    history: list
) -> InterviewAnswerResponse:
    """Evaluates the candidate's answer and generates the next question (max 4 questions total)."""
    # Build conversational history context
    context = ""
    question_count = 0
    for msg in history:
        prefix = "Interviewer" if msg["role"] == "assistant" else "Candidate"
        context += f"{prefix}: {msg['content']}\n"
        if msg["role"] == "assistant":
            question_count += 1
            
    context += f"Candidate: {answer}\n"
    
    # Cap the interview at 4 questions to prevent long, expensive sessions
    is_last_question = (question_count >= 4)
    
    system_prompt = (
        f"You are an expert corporate recruiter conducting a {mode} interview for a {experience_level}-level {role} role.\n"
        "Evaluate the candidate's latest answer, provide specific coaching feedback, score their response from 1 to 10,\n"
        "and generate the next question.\n"
    )
    
    if is_last_question:
        system_prompt += (
            "Since this is the end of the interview session, set \"next_question\" to null.\n"
            "You MUST return your response as a valid JSON object matching the following structure exactly:\n"
            "{\n"
            '  "score": 8,\n'
            '  "feedback": "Praise or critique of current answer...",\n'
            '  "suggestions": "Actionable ways they could have structured it better...",\n'
            '  "next_question": null\n'
            "}\n"
        )
    else:
        system_prompt += (
            "Draft a realistic next question based on the ongoing conversation context.\n"
            "You MUST return your response as a valid JSON object matching the following structure exactly:\n"
            "{\n"
            '  "score": 8,\n'
            '  "feedback": "Praise or critique of current answer...",\n'
            '  "suggestions": "Actionable ways they could have structured it better...",\n'
            '  "next_question": "Your next tailored interview question..."\n'
            "}\n"
        )
        
    system_prompt += "Do NOT include any text outside the JSON object."
    user_prompt = f"Conversation history:\n\n{context}\n\nEvaluate the latest answer and proceed."
    
    raw_response = github_llm.complete(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.3
    )
    
    cleaned_json = _clean_json_string(raw_response)
    
    try:
        data = json.loads(cleaned_json)
        
        # Update conversational memory
        new_history = list(history)
        new_history.append({"role": "user", "content": answer})
        
        next_q = data.get("next_question")
        if next_q:
            new_history.append({"role": "assistant", "content": next_q})
            
        return InterviewAnswerResponse(
            score=data.get("score", 0),
            feedback=data.get("feedback", ""),
            suggestions=data.get("suggestions", ""),
            next_question=next_q,
            history=new_history
        )
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to parse AI response as JSON: {exc}. Raw response: {raw_response}"
        ) from exc

def generate_final_report(
    role: str,
    mode: str,
    experience_level: str,
    history: List[Dict[str, str]]
) -> Dict[str, Any]:
    """Generates a complete performance report evaluating technical skills, confidence, and communication."""
    context = ""
    for msg in history:
        prefix = "Interviewer" if msg["role"] == "assistant" else "Candidate"
        context += f"{prefix}: {msg['content']}\n"
        
    system_prompt = (
        "You are an Executive Recruiter conducting a final post-interview debrief.\n"
        "Your task is to analyze the complete conversation history and output a comprehensive candidate evaluation scorecard.\n"
        "Calculate rating scores (0 to 100) for communication, confidence, and technical/HR proficiency.\n"
        "Identify strengths, weaknesses, and actionable tips for future improvement.\n"
        "You MUST return your response as a valid JSON object matching the following structure exactly:\n"
        "{\n"
        '  "overall_score": 85,\n'
        '  "technical_score": 80,\n'
        '  "communication_score": 90,\n'
        '  "confidence_score": 85,\n'
        '  "strengths": ["Clear articulation of tech concepts", "Strong problem-solving framework"],\n'
        '  "weaknesses": ["Missed edge cases in coding questions", "Slightly passive pacing"],\n'
        '  "suggestions": ["Practice explaining algorithms using structural steps", "Vary pitch for dynamic engagement"]\n'
        "}\n"
        "Do NOT include any text outside the JSON object."
    )
    
    user_prompt = f"Interview Dialogue History:\n\n{context}\n\nGenerate the complete debrief report."
    
    raw_response = github_llm.complete(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.3
    )
    cleaned_json = _clean_json_string(raw_response)
    try:
        return json.loads(cleaned_json)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to parse AI evaluation report: {exc}"
        )
