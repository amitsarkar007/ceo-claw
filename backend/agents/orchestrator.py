import json
from integrations.zai import call_zai
from registry import AGENT_REGISTRY

ORCHESTRATOR_SYSTEM = """
You are an intelligent routing agent. Given a user query, you must:
1. Detect the user's role from context clues (founder/ceo, hr_manager, ops_lead, employee)
2. Classify the query intent using one of: generate_idea, deploy_product, check_adoption, 
   hr_query, wellbeing, marketing, growth, automation, training, general
3. Select the best specialist agent from: ceo_agent, adoption_agent, hr_agent
4. Return ONLY valid JSON, no markdown, no explanation.

JSON format:
{
  "detected_role": "string",
  "intent": "string", 
  "selected_agent": "string",
  "reasoning": "string",
  "confidence": 0.0-1.0
}
"""

async def run_orchestrator(query: str, context: dict = {}) -> dict:
    fallback = {
        "detected_role": "founder",
        "intent": "general",
        "selected_agent": "ceo_agent",
        "reasoning": "JSON parse failed, defaulting to CEO agent",
        "confidence": 0.4
    }
    try:
        messages = [{"role": "user", "content": f"Query: {query}\nContext: {json.dumps(context)}"}]
        raw = await call_zai(messages, system_prompt=ORCHESTRATOR_SYSTEM, temperature=0.3)
        if not raw:
            return fallback
        clean = raw.strip().replace("```json", "").replace("```", "").strip()
        result = json.loads(clean)
        return result
    except json.JSONDecodeError:
        return fallback
    except Exception:
        fallback["reasoning"] = "Orchestrator failed, defaulting to CEO agent"
        return fallback
