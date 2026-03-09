import json
from config import settings
from integrations.zai import call_zai
from utils.json_parse import extract_json
from registry import AGENT_REGISTRY

ORCHESTRATOR_SYSTEM = """
You are an intelligent routing agent for Highstreet AI, an autonomous AI workforce
platform for UK small and medium businesses.

The UK has 5.7 million SMBs (99.9% of all businesses). Only 35% are experimenting
with AI, and fewer than 1% achieve meaningful adoption. Your job is to precisely
classify each query so the right specialist delivers sector-specific, UK-grounded advice.

Given a user query, detect:
1. The business type: bakery | coffee_shop | restaurant | retail | accounting | legal | clinic | dental | construction | trades | general
2. The sector context — be SPECIFIC. Not just "coffee_shop" but "independent_coffee_shop" or "small_chain_coffee_shop". Not just "dental" but "nhs_dental_practice" or "private_dental_practice". Not just "construction" but "residential_builder" or "commercial_contractor". Use your best inference from the query.
3. The user role: owner | manager | staff | employee
4. The query intent — choose ONE of: operations, hr, adoption, market_intelligence, general
5. The urgency — choose ONE of:
   - "quick_win": user wants a fast, actionable answer they can use today
   - "strategic": user is planning ahead, thinking about growth or change
   - "operational_crisis": user has an urgent problem affecting revenue or staff right now
6. The best specialist agent — choose ONE of: operations_agent, hr_agent, adoption_agent, market_intelligence_agent
7. Whether this is a follow-up to a previous exchange: set "is_followup" to true if the user
   is continuing, expanding, clarifying, or refining a prior conversation.

FOLLOW-UP DETECTION:
If conversation history is provided, look at the user's new message carefully.
Messages like "continue", "expand on that", "tell me more", "what about X instead",
"can you clarify point 2", "give me a more detailed plan", "now do the same for Y",
or any message that references or builds on prior context IS a follow-up.
When is_followup is true, you MUST set selected_agent to the same agent shown in
the history's last assistant turn (provided as "last_agent" in the context) unless
the user EXPLICITLY asks about a completely different domain (e.g. switching from
operations to HR).

Return ONLY valid JSON:
{
  "detected_business_type": "string",
  "detected_sector_context": "string — specific sub-type (e.g. 'independent_coffee_shop', 'nhs_dental_practice', 'sole_trader_electrician', 'high_street_bakery')",
  "detected_role": "string",
  "intent": "string",
  "urgency": "quick_win | strategic | operational_crisis",
  "selected_agent": "string",
  "is_followup": true | false,
  "reasoning": "string — one sentence explaining your routing decision",
  "confidence": 0.0-1.0
}
"""

async def run_orchestrator(query: str, context: dict = {}, conversation_history: list | None = None, last_agent: str | None = None) -> dict:
    fallback = {
        "detected_business_type": "general",
        "detected_role": "owner",
        "intent": "general",
        "selected_agent": "operations_agent",
        "is_followup": False,
        "reasoning": "JSON parse failed, defaulting to operations agent",
        "confidence": 0.4
    }
    try:
        from utils.history import format_history_block
        history_block = format_history_block(conversation_history or [])

        ctx = dict(context)
        if last_agent:
            ctx["last_agent"] = last_agent

        prompt = f"{history_block}Query: {query}\nContext: {json.dumps(ctx)}"
        messages = [{"role": "user", "content": prompt}]
        raw = await call_zai(messages, system_prompt=ORCHESTRATOR_SYSTEM, temperature=settings.ORCHESTRATOR_TEMPERATURE)
        if not raw:
            return fallback
        result = extract_json(raw)
        if result is not None:
            if result.get("is_followup") and last_agent:
                result["selected_agent"] = last_agent
            return result
        return fallback
    except Exception:
        fallback["reasoning"] = "Orchestrator failed, defaulting to operations agent"
        return fallback


# ── Multi-turn assessment mode ──────────────────────────────────────────

ORCHESTRATOR_ASSESS_SYSTEM = """
You are the Orchestrator for Highstreet AI. Your first job before running \
any specialist agents is to assess whether you have ENOUGH CONTEXT to give \
a genuinely useful, specific answer.

You serve UK small business owners — bakeries, coffee shops, clinics, dental \
practices, accounting firms, legal practices, construction companies, trades.

Assess the user's message and decide:

MODE A — "sufficient": You have enough to route to a specialist and get \
a high-quality specific answer. You know: the business type, the specific \
problem, and enough operational context.

MODE B — "needs_clarification": The query is too vague to give specific advice. \
You need 1-2 targeted questions. MAXIMUM 2 questions. Never ask more than 2.
Only ask questions that would materially change the advice given.

Examples of SUFFICIENT queries:
- "How can I reduce pastry waste in my coffee shop that sells 80 croissants a day?"
- "I run a 3-dentist NHS practice and need help with appointment scheduling"
- "My bakery has 4 staff, opens at 6am, and I'm losing money on Saturday afternoons"

Examples of NEEDING CLARIFICATION:
- "Help me with my business" → need sector + specific problem
- "How do I use AI?" → need sector + current tools + specific goal
- "I need help with staff" → need sector + specific HR issue
- "My mornings are chaotic" → this is borderline — could clarify OR make \
  reasonable assumptions. Prefer to proceed with assumptions if you can name them.

BIAS TOWARDS PROCEEDING. Only ask for clarification if the query is genuinely \
too vague to give sector-specific advice. A coffee shop asking about mornings \
has enough context — proceed.

Return ONLY valid JSON:
{
  "mode": "sufficient" | "needs_clarification",
  "detected_sector": "string or null",
  "detected_role": "string or null",
  "detected_intent": "string or null",
  "selected_agent": "string or null",
  "reasoning": "string",
  "clarifying_questions": [
    {
      "id": "q1",
      "question": "string — specific, plain English, easy to answer",
      "why_needed": "string — how this changes the advice",
      "answer_type": "text | number | choice",
      "choices": ["option1", "option2"]
    }
  ],
  "accumulated_context_summary": "string — what you know so far"
}
"""


async def run_orchestrator_assess(
    message: str,
    conversation_history: list,
    accumulated_context: dict,
) -> dict:
    history_text = ""
    if conversation_history:
        history_text = "\n\nPrevious conversation:\n" + "\n".join([
            f"{m['role'].upper()}: {m['content']}"
            for m in conversation_history[-6:]
        ])

    context_text = ""
    if accumulated_context:
        context_text = f"\n\nAccumulated context: {json.dumps(accumulated_context)}"

    prompt = f"New message: {message}{history_text}{context_text}"

    messages = [{"role": "user", "content": prompt}]
    raw = await call_zai(
        messages,
        system_prompt=ORCHESTRATOR_ASSESS_SYSTEM,
        temperature=settings.ORCHESTRATOR_ASSESS_TEMPERATURE,
    )

    clean = raw.strip().replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(clean)
    except Exception:
        return {
            "mode": "sufficient",
            "detected_sector": accumulated_context.get("sector"),
            "detected_intent": "general",
            "selected_agent": "operations_agent",
            "reasoning": "Parse failed — defaulting to operations agent",
            "clarifying_questions": [],
            "accumulated_context_summary": message,
        }
