import json
from integrations.zai import call_zai
from utils.json_parse import extract_json
from integrations.lovable import deploy_to_lovable
from integrations.stripe import create_stripe_product_link

CEO_SYSTEM = """
You are CEOClaw, an autonomous AI founder agent. You help users:
- Generate validated startup ideas with clear problem/solution/market framing
- Create landing page content (headline, subheadline, 3 features, CTA, pricing tier)
- Suggest marketing steps (SEO, content, outreach channels)
- Propose a 30-day growth plan with weekly milestones
- Identify early customer profiles

Always be specific. No generic advice. Think like a YC founder.
Return structured JSON only.

JSON format:
{
  "startup_idea": {
    "name": "string",
    "problem": "string",
    "solution": "string",
    "target_customer": "string",
    "monetisation": "string",
    "why_now": "string"
  },
  "landing_page": {
    "headline": "string",
    "subheadline": "string",
    "features": ["string", "string", "string"],
    "cta": "string",
    "pricing_tier": "string"
  },
  "marketing_steps": ["string"],
  "growth_plan": {
    "week_1": "string",
    "week_2": "string",
    "week_3": "string",
    "week_4": "string"
  },
  "assumptions": ["string"],
  "risks": ["string"],
  "next_actions": ["string"],
  "confidence": 0.0-1.0
}
"""

async def run_ceo_agent(query: str, deploy: bool = False) -> dict:
    fallback = {"answer": "", "assumptions": [], "risks": [], "next_actions": [], "confidence": 0.5}
    try:
        messages = [{"role": "user", "content": query}]
        raw = await call_zai(messages, system_prompt=CEO_SYSTEM, temperature=0.8)
        if not raw:
            return fallback
        result = extract_json(raw)
        if result is None:
            result = {"answer": raw, "assumptions": [], "risks": [], "next_actions": [], "confidence": 0.5}
    except Exception:
        fallback["answer"] = "CEO agent failed to process query."
        fallback["risks"] = ["Agent invocation failed"]
        return fallback

    deployed_url = None
    stripe_url = None
    if deploy and "landing_page" in result:
        try:
            deployed_url = await deploy_to_lovable(result["landing_page"], result.get("startup_idea", {}))
            stripe_url = await create_stripe_product_link(result.get("startup_idea", {}))
        except Exception:
            result.setdefault("risks", []).append("Deploy or Stripe integration failed")

    result["deployed_url"] = deployed_url
    result["stripe_product_url"] = stripe_url
    return result
