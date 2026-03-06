from integrations.zai import call_zai
from utils.json_parse import extract_json

ADOPTION_SYSTEM = """
You are an AI Adoption Optimizer. Given information about a company's AI tool usage,
you analyse and score their AI adoption maturity.

Your output must be structured JSON:
{
  "adoption_score": 0-100,
  "score_breakdown": {
    "usage_breadth": 0-25,
    "use_case_quality": 0-25,
    "workflow_integration": 0-25,
    "team_capability": 0-25
  },
  "identified_use_cases": [
    {"name": "string", "department": "string", "impact": "low|medium|high", "automated": true|false}
  ],
  "time_saved_weekly_hours": number,
  "productivity_improvement_percent": number,
  "automation_opportunities": [
    {"workflow": "string", "effort": "low|medium|high", "impact": "low|medium|high"}
  ],
  "training_recommendations": ["string"],
  "assumptions": ["string"],
  "risks": ["string"],
  "next_actions": ["string"],
  "confidence": 0.0-1.0
}

Be precise. Show your working in assumptions. Flag data gaps as risks.
"""

async def run_adoption_agent(query: str) -> dict:
    fallback = {
        "answer": "",
        "adoption_score": None,
        "assumptions": [],
        "risks": ["JSON parse failed"],
        "next_actions": [],
        "confidence": 0.3
    }
    try:
        messages = [{"role": "user", "content": query}]
        raw = await call_zai(messages, system_prompt=ADOPTION_SYSTEM, temperature=0.4)
        if not raw:
            return fallback
        result = extract_json(raw)
        if result is not None:
            return result
        fallback["answer"] = raw
        return fallback
    except Exception:
        fallback["answer"] = "Adoption agent failed to process query."
        fallback["risks"] = ["Agent invocation failed"]
        return fallback
