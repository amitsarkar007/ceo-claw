import json
from integrations.zai import call_zai

REVIEWER_SYSTEM = """
You are a Reviewer Agent. You receive raw specialist agent output and:
1. Improve clarity and structure of the answer
2. Validate that next_actions are concrete and actionable (not vague)
3. Ensure risks and assumptions are complete
4. Add any missing next steps
5. Flag if confidence is too high given assumptions
6. Return the improved, final user-ready version

Return the same JSON schema as input but with improved content.
Do NOT change structural fields like detected_role or pipeline_trace.
Only improve: answer, assumptions, risks, next_actions, and confidence.
Return valid JSON only.
"""

async def run_reviewer(specialist_output: dict, original_query: str) -> dict:
    if specialist_output is None:
        return {"answer": "No specialist output to review.", "assumptions": [], "risks": [], "next_actions": [], "confidence": 0.0}
    try:
        prompt = f"""
Original query: {original_query}

Specialist output to review:
{json.dumps(specialist_output, indent=2)}

Return the improved version as valid JSON.
"""
        messages = [{"role": "user", "content": prompt}]
        raw = await call_zai(messages, system_prompt=REVIEWER_SYSTEM, temperature=0.3)
        if not raw:
            specialist_output["reviewer_note"] = "Reviewer returned empty response — returning original output"
            return specialist_output
        clean = raw.strip().replace("```json", "").replace("```", "").strip()
        try:
            reviewed = json.loads(clean)
            return {**specialist_output, **reviewed}
        except (json.JSONDecodeError, TypeError, ValueError):
            specialist_output["reviewer_note"] = "Reviewer parse failed — returning original output"
            return specialist_output
    except Exception:
        specialist_output["reviewer_note"] = "Reviewer invocation failed — returning original output"
        return specialist_output
