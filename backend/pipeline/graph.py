from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional
from integrations.zai import set_fallback_used, get_fallback_used
from agents.orchestrator import run_orchestrator, run_orchestrator_assess
from agents.operations_agent import run_operations_agent
from agents.adoption_agent import run_adoption_agent
from agents.hr_agent import run_hr_agent
from agents.market_intelligence_agent import run_market_intelligence_agent
from agents.reviewer import run_reviewer
from integrations.anyway import trace
import json
import uuid

class PipelineState(TypedDict):
    query: str
    query_id: str
    context: dict
    orchestrator_result: Optional[dict]
    specialist_result: Optional[dict]
    final_result: Optional[dict]
    pipeline_trace: list
    deploy: bool

async def orchestrator_node(state: PipelineState) -> PipelineState:
    result = await run_orchestrator(state["query"], state.get("context", {}))
    state["orchestrator_result"] = result
    state["pipeline_trace"].append("orchestrator")
    await trace("orchestrator", state["query_id"], result)
    return state

VALID_SPECIALISTS = frozenset({"operations_agent", "hr_agent", "adoption_agent", "market_intelligence_agent"})


async def route_to_specialist(state: PipelineState) -> str:
    """Route to exactly one of operations_agent, hr_agent, adoption_agent, market_intelligence_agent."""
    orch = state.get("orchestrator_result") or {}
    agent = orch.get("selected_agent", "operations_agent")
    return agent if agent in VALID_SPECIALISTS else "operations_agent"

async def operations_node(state: PipelineState) -> PipelineState:
    result = await run_operations_agent(state["query"])
    state["specialist_result"] = result
    state["pipeline_trace"].append("operations_agent")
    await trace("operations_agent", state["query_id"], result)
    return state

async def adoption_node(state: PipelineState) -> PipelineState:
    result = await run_adoption_agent(state["query"])
    state["specialist_result"] = result
    state["pipeline_trace"].append("adoption_agent")
    await trace("adoption_agent", state["query_id"], result)
    return state

async def hr_node(state: PipelineState) -> PipelineState:
    result = await run_hr_agent(state["query"])
    state["specialist_result"] = result
    state["pipeline_trace"].append("hr_agent")
    await trace("hr_agent", state["query_id"], result)
    return state

async def market_intelligence_node(state: PipelineState) -> PipelineState:
    result = await run_market_intelligence_agent(state["query"])
    state["specialist_result"] = result
    state["pipeline_trace"].append("market_intelligence_agent")
    await trace("market_intelligence_agent", state["query_id"], result)
    return state

async def reviewer_node(state: PipelineState) -> PipelineState:
    reviewed = await run_reviewer(state["specialist_result"], state["query"])
    state["final_result"] = reviewed
    state["pipeline_trace"].append("reviewer")
    await trace("reviewer", state["query_id"], reviewed)
    return state

def build_pipeline():
    graph = StateGraph(PipelineState)
    
    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("operations_agent", operations_node)
    graph.add_node("adoption_agent", adoption_node)
    graph.add_node("hr_agent", hr_node)
    graph.add_node("market_intelligence_agent", market_intelligence_node)
    graph.add_node("reviewer", reviewer_node)
    
    graph.set_entry_point("orchestrator")
    
    graph.add_conditional_edges(
        "orchestrator",
        route_to_specialist,
        {
            "operations_agent": "operations_agent",
            "hr_agent": "hr_agent",
            "adoption_agent": "adoption_agent",
            "market_intelligence_agent": "market_intelligence_agent"
        }
    )
    
    graph.add_edge("operations_agent", "reviewer")
    graph.add_edge("adoption_agent", "reviewer")
    graph.add_edge("hr_agent", "reviewer")
    graph.add_edge("market_intelligence_agent", "reviewer")
    graph.add_edge("reviewer", END)
    
    return graph.compile()


async def run_conversation_turn(
    message: str,
    conversation_id: str | None,
    context: dict = {},
) -> "QueryResponse":
    from store.conversations import (
        create_conversation, get_conversation, update_conversation,
    )
    from schemas.conversation import Message, QueryResponse
    from agents.guardrails import check_guardrails

    if conversation_id:
        conv = get_conversation(conversation_id)
        if not conv:
            conv = create_conversation()
    else:
        conv = create_conversation()

    conv.messages.append(Message(role="user", content=message))
    conv.turn_count += 1
    conv.context.update(context)

    # STEP 1: Guardrails — before anything else
    guardrail_result = await check_guardrails(message, conv.messages)

    if guardrail_result["triggered"]:
        conv.status = "guardrail_triggered"
        update_conversation(conv)
        return QueryResponse(
            conversation_id=conv.conversation_id,
            status="guardrail_triggered",
            guardrail_message=guardrail_result["safe_response"],
            guardrail_type=guardrail_result["type"],
        )

    # STEP 2: Orchestrator assesses context sufficiency
    history = [{"role": m.role, "content": m.content} for m in conv.messages[:-1]]
    assessment = await run_orchestrator_assess(message, history, conv.context)

    if assessment.get("detected_sector"):
        conv.context["sector"] = assessment["detected_sector"]
    if assessment.get("detected_role"):
        conv.context["role"] = assessment["detected_role"]

    # STEP 3A: Need clarification — return questions without running pipeline
    # Skip clarification if there's already a specialist response in history
    has_prior_assistant_response = any(
        m.role == "assistant" and getattr(m, "agent", None) != "orchestrator"
        for m in conv.messages[:-1]
    )
    if assessment["mode"] == "needs_clarification" and conv.turn_count <= 2 and not has_prior_assistant_response:
        conv.status = "clarifying"

        questions = assessment.get("clarifying_questions", [])
        assistant_msg = (
            "To give you the most relevant advice, "
            "I have a couple of quick questions:\n\n"
        )
        for i, q in enumerate(questions, 1):
            assistant_msg += f"{i}. {q['question']}\n"

        conv.messages.append(Message(
            role="assistant",
            content=assistant_msg,
            agent="orchestrator",
        ))
        update_conversation(conv)

        return QueryResponse(
            conversation_id=conv.conversation_id,
            status="clarifying",
            clarifying_questions=questions,
        )

    # Build conversation history for multi-turn continuity
    conversation_history = [
        {"role": m.role, "content": m.content}
        for m in conv.messages[:-1]
    ]
    last_agent = None
    for m in reversed(conv.messages[:-1]):
        if m.role == "assistant" and getattr(m, "agent", None):
            last_agent = m.agent
            break

    # STEP 3B: Sufficient context — run full pipeline with history
    conv.status = "processing"
    result = await run_pipeline(
        query=message,
        context=conv.context,
        deploy=False,
        conversation_history=conversation_history,
        last_agent=last_agent,
    )

    summary = result.get("summary", result.get("answer", ""))
    conv.messages.append(Message(
        role="assistant",
        content=summary,
        agent=result.get("selected_agent"),
    ))
    conv.status = "complete"
    update_conversation(conv)

    return QueryResponse(
        conversation_id=conv.conversation_id,
        status="complete",
        result=result,
    )


AGENT_LABELS = {
    "operations_agent": "Operations Agent",
    "hr_agent": "HR & Wellbeing Agent",
    "adoption_agent": "AI Adoption Optimizer",
    "market_intelligence_agent": "Market Intelligence Agent",
}

AGENT_VERBS = {
    "operations_agent": "Analysing operations & workflows",
    "hr_agent": "Reviewing HR & employment context",
    "adoption_agent": "Evaluating AI adoption readiness",
    "market_intelligence_agent": "Researching market signals & trends",
}

SPECIALIST_RUNNERS = {
    "operations_agent": run_operations_agent,
    "hr_agent": run_hr_agent,
    "adoption_agent": run_adoption_agent,
    "market_intelligence_agent": run_market_intelligence_agent,
}


async def run_pipeline_streaming(
    query: str,
    context: dict = {},
    deploy: bool = False,
    conversation_history: list | None = None,
    last_agent: str | None = None,
):
    """Async generator that yields SSE pipeline events then the final result."""
    from integrations.zai import set_fallback_used, get_fallback_used

    set_fallback_used(False)
    query_id = str(uuid.uuid4())
    pipeline_trace: list[str] = []
    history = conversation_history or []

    yield {"type": "step", "agent": "orchestrator", "status": "started",
           "message": "Classifying your query & detecting business type"}

    orch_result = await run_orchestrator(query, context, conversation_history=history, last_agent=last_agent)
    pipeline_trace.append("orchestrator")
    await trace("orchestrator", query_id, orch_result)

    selected = orch_result.get("selected_agent", "operations_agent")
    if selected not in VALID_SPECIALISTS:
        selected = "operations_agent"
    biz = (orch_result.get("detected_business_type") or "business").replace("_", " ")

    is_followup = orch_result.get("is_followup", False)
    followup_label = " (continuing)" if is_followup else ""
    yield {"type": "step", "agent": "orchestrator", "status": "complete",
           "message": f"Detected {biz} · routing to {AGENT_LABELS.get(selected, selected)}{followup_label}"}

    agent_label = AGENT_LABELS.get(selected, selected)
    yield {"type": "step", "agent": selected, "status": "started",
           "message": AGENT_VERBS.get(selected, f"{agent_label} working")}

    runner = SPECIALIST_RUNNERS.get(selected, run_operations_agent)
    specialist_result = await runner(query, conversation_history=history)
    pipeline_trace.append(selected)
    await trace(selected, query_id, specialist_result)

    yield {"type": "step", "agent": selected, "status": "complete",
           "message": f"{agent_label} recommendations ready"}

    yield {"type": "step", "agent": "reviewer", "status": "started",
           "message": "Validating numbers, UK compliance & plain English"}

    reviewed = await run_reviewer(specialist_result, query, conversation_history=history)
    pipeline_trace.append("reviewer")
    await trace("reviewer", query_id, reviewed)

    yield {"type": "step", "agent": "reviewer", "status": "complete",
           "message": "Quality gate passed"}

    result = reviewed or {}
    result["query_id"] = query_id
    result["detected_business_type"] = orch_result.get("detected_business_type")
    result["detected_sector_context"] = orch_result.get("detected_sector_context", "")
    result["urgency"] = orch_result.get("urgency", "")
    result["detected_role"] = orch_result.get("detected_role")
    result["intent"] = orch_result.get("intent")
    result["selected_agent"] = orch_result.get("selected_agent")
    result["is_followup"] = is_followup
    result["pipeline_trace"] = pipeline_trace
    result["fallback_used"] = get_fallback_used()

    yield {"type": "result", "data": result}


async def run_conversation_turn_streaming(
    message: str,
    conversation_id: str | None,
    context: dict = {},
):
    """Async generator yielding SSE events for the full conversation turn."""
    from store.conversations import (
        create_conversation, get_conversation, update_conversation,
    )
    from schemas.conversation import Message as Msg
    from agents.guardrails import check_guardrails

    if conversation_id:
        conv = get_conversation(conversation_id)
        if not conv:
            conv = create_conversation()
    else:
        conv = create_conversation()

    from logger import set_correlation_ids
    set_correlation_ids(conversation_id=conv.conversation_id)

    conv.messages.append(Msg(role="user", content=message))
    conv.turn_count += 1
    conv.context.update(context)

    yield {"type": "conversation", "conversation_id": conv.conversation_id}

    import time
    pipeline_events: list = []

    # Guardrails
    yield {"type": "step", "agent": "guardrails", "status": "started",
           "message": "Running safety checks"}
    pipeline_events.append({"type": "step", "agent": "guardrails", "status": "started",
                            "message": "Running safety checks", "timestamp": time.time() * 1000})
    guardrail_result = await check_guardrails(message, conv.messages)

    if guardrail_result["triggered"]:
        yield {"type": "step", "agent": "guardrails", "status": "complete",
               "message": "Safety concern detected"}
        pipeline_events.append({"type": "step", "agent": "guardrails", "status": "complete",
                                "message": "Safety concern detected", "timestamp": time.time() * 1000})
        conv.pipeline_events = pipeline_events
        conv.status = "guardrail_triggered"
        update_conversation(conv)
        yield {"type": "guardrail",
               "guardrail_message": guardrail_result["safe_response"],
               "guardrail_type": guardrail_result["type"],
               "conversation_id": conv.conversation_id}
        return

    yield {"type": "step", "agent": "guardrails", "status": "complete",
           "message": "Safety checks passed"}
    pipeline_events.append({"type": "step", "agent": "guardrails", "status": "complete",
                            "message": "Safety checks passed", "timestamp": time.time() * 1000})

    # Orchestrator assess
    yield {"type": "step", "agent": "orchestrator_assess", "status": "started",
           "message": "Understanding your question"}
    pipeline_events.append({"type": "step", "agent": "orchestrator_assess", "status": "started",
                            "message": "Understanding your question", "timestamp": time.time() * 1000})
    history = [{"role": m.role, "content": m.content} for m in conv.messages[:-1]]
    assessment = await run_orchestrator_assess(message, history, conv.context)

    if assessment.get("detected_sector"):
        conv.context["sector"] = assessment["detected_sector"]
    if assessment.get("detected_role"):
        conv.context["role"] = assessment["detected_role"]

    yield {"type": "step", "agent": "orchestrator_assess", "status": "complete",
           "message": "Context analysed"}
    pipeline_events.append({"type": "step", "agent": "orchestrator_assess", "status": "complete",
                            "message": "Context analysed", "timestamp": time.time() * 1000})

    # Clarification needed? Only on the first turn — follow-ups already have context.
    has_prior_assistant_response = any(
        m.role == "assistant" and getattr(m, "agent", None) != "orchestrator"
        for m in conv.messages[:-1]
    )
    if (
        assessment["mode"] == "needs_clarification"
        and conv.turn_count <= 2
        and not has_prior_assistant_response
    ):
        conv.status = "clarifying"
        conv.pipeline_events = pipeline_events
        questions = assessment.get("clarifying_questions", [])
        assistant_msg = "To give you the most relevant advice, I have a couple of quick questions:\n\n"
        for i, q in enumerate(questions, 1):
            assistant_msg += f"{i}. {q['question']}\n"
        conv.messages.append(Msg(role="assistant", content=assistant_msg, agent="orchestrator"))
        update_conversation(conv)
        yield {"type": "clarifying", "conversation_id": conv.conversation_id,
               "questions": questions}
        return

    # Build conversation history (all messages BEFORE the current user message)
    conversation_history = [
        {"role": m.role, "content": m.content}
        for m in conv.messages[:-1]
    ]

    # Detect the last agent that responded (for follow-up routing)
    last_agent = None
    for m in reversed(conv.messages[:-1]):
        if m.role == "assistant" and getattr(m, "agent", None):
            last_agent = m.agent
            break

    # Full pipeline — pass history + last_agent for multi-turn continuity
    conv.status = "processing"
    final_result = None
    async for event in run_pipeline_streaming(
        message, conv.context,
        conversation_history=conversation_history,
        last_agent=last_agent,
    ):
        if event["type"] == "step":
            pipeline_events.append({**event, "timestamp": time.time() * 1000})
        elif event["type"] == "result":
            final_result = event["data"]
        yield event

    conv.pipeline_events = pipeline_events
    if final_result:
        summary = final_result.get("summary", final_result.get("answer", ""))
        conv.messages.append(Msg(
            role="assistant", content=summary,
            agent=final_result.get("selected_agent"),
        ))
        conv.status = "complete"
        update_conversation(conv)


async def run_pipeline(query: str, context: dict = {}, deploy: bool = False, conversation_history: list | None = None, last_agent: str | None = None) -> dict:
    set_fallback_used(False)
    pipeline = build_pipeline()
    
    initial_state: PipelineState = {
        "query": query,
        "query_id": str(uuid.uuid4()),
        "context": context,
        "orchestrator_result": None,
        "specialist_result": None,
        "final_result": None,
        "pipeline_trace": [],
        "deploy": deploy
    }
    
    final_state = await pipeline.ainvoke(initial_state)
    
    orch = final_state.get("orchestrator_result") or {}
    result = final_state["final_result"] or {}
    result["query_id"] = final_state["query_id"]
    result["detected_business_type"] = orch.get("detected_business_type")
    result["detected_sector_context"] = orch.get("detected_sector_context", "")
    result["urgency"] = orch.get("urgency", "")
    result["detected_role"] = orch.get("detected_role")
    result["intent"] = orch.get("intent")
    result["selected_agent"] = orch.get("selected_agent")
    result["pipeline_trace"] = final_state["pipeline_trace"]
    result["fallback_used"] = get_fallback_used()
    
    return result
