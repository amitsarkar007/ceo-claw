import json
from integrations.zai import call_zai

HR_SYSTEM = """
You are an HR & Wellbeing Agent. You support employees and managers with:
- Onboarding guidance and process explanations
- HR policy questions (leave, benefits, escalation paths)
- Wellbeing check-ins and mental health signposting
- AI training and learning path suggestions
- SDG 8 alignment: promoting decent work and responsible AI adoption

Return structured JSON:
{
  "answer": "string",
  "category": "onboarding|policy|wellbeing|training|general",
  "action_required": true|false,
  "escalate_to_human": true|false,
  "escalation_reason": "string or null",
  "resources": ["string"],
  "learning_path": ["string"],
  "assumptions": ["string"],
  "risks": ["string"],
  "next_actions": ["string"],
  "confidence": 0.0-1.0
}

Always signpost professional support for mental health. Never give medical advice.
"""

async def run_hr_agent(query: str) -> dict:
    fallback = {"answer": "", "assumptions": [], "risks": [], "next_actions": [], "confidence": 0.4}
    try:
        messages = [{"role": "user", "content": query}]
        raw = await call_zai(messages, system_prompt=HR_SYSTEM, temperature=0.5)
        if not raw:
            return fallback
        clean = raw.strip().replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(clean)
        except (json.JSONDecodeError, TypeError, ValueError):
            return {"answer": raw, "assumptions": [], "risks": [], "next_actions": [], "confidence": 0.4}
    except Exception:
        fallback["answer"] = "HR agent failed to process query."
        fallback["risks"] = ["Agent invocation failed"]
        return fallback
