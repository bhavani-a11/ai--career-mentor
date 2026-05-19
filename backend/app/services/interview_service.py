import json
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

def start_interview(mode: str, role: str) -> InterviewStartResponse:
    """Starts a new mock interview by asking the very first question."""
    prompt = f"You are an expert {mode} interviewer interviewing a candidate for a {role} position. Ask the very first interview question. Do not include any pleasantries, just the question itself."
    
    first_question = github_llm.complete(
        system_prompt="You are an expert interviewer.",
        user_prompt=prompt,
        temperature=0.7
    )
    
    # Initialize conversational memory
    history = [
        {"role": "assistant", "content": first_question}
    ]
    
    return InterviewStartResponse(first_question=first_question, history=history)

def evaluate_answer_and_next(mode: str, role: str, answer: str, history: list) -> InterviewAnswerResponse:
    """Evaluates the candidate's answer and generates the next question."""
    # Build conversation context from memory
    context = ""
    for msg in history:
        prefix = "Interviewer" if msg["role"] == "assistant" else "Candidate"
        context += f"{prefix}: {msg['content']}\n"
    
    context += f"Candidate: {answer}\n"
    
    system_prompt = (
        f"You are an expert {mode} interviewer interviewing a candidate for a {role} position.\n"
        "You must evaluate the candidate's latest answer, provide feedback, and ask the next question.\n"
        "You MUST return your response as a valid JSON object matching the following structure exactly:\n"
        "{\n"
        '  "score": 8,\n'
        '  "feedback": "Your feedback here",\n'
        '  "suggestions": "Your suggestions here",\n'
        '  "next_question": "The next question here"\n'
        "}\n"
        "Do NOT include any text outside the JSON object."
    )
    
    user_prompt = f"Here is the conversation so far:\n\n{context}\n\nEvaluate the latest answer and generate the next question."
    
    raw_response = github_llm.complete(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.3 # Lower temperature for valid JSON structure
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
