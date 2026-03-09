from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import time
from fastapi import FastAPI, HTTPException, Request
from logger import set_correlation_ids
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pipeline.graph import run_pipeline, run_conversation_turn, run_conversation_turn_streaming
from schemas.conversation import QueryRequest
import json as _json
from logger import log_run
from registry import AGENT_REGISTRY
from collections import defaultdict
from datetime import datetime, timedelta

from config import settings
from version import VERSION

app = FastAPI(
    title="Highstreet AI",
    description="Autonomous AI Workforce for Small and Medium Businesses. Powered by Z.AI GLM-4-Plus. Built for the High Street.",
    version=VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(",") if "," in settings.CORS_ORIGINS else [settings.CORS_ORIGINS],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Set request_id (UUID) for every request for traceability."""
    set_correlation_ids()
    response = await call_next(request)
    return response

# ── Startup time for uptime ───────────────────────────────────────────────

_start_time = time.time()


# ── Rate limiting ────────────────────────────────────────────────────────

_request_counts: dict[str, list[datetime]] = defaultdict(list)


def is_rate_limited(
    client_ip: str,
    limit: int | None = None,
    window_minutes: int | None = None,
) -> bool:
    limit = limit if limit is not None else settings.RATE_LIMIT_REQUESTS
    window_minutes = window_minutes if window_minutes is not None else settings.RATE_LIMIT_WINDOW_MINUTES
    now = datetime.utcnow()
    window_start = now - timedelta(minutes=window_minutes)

    _request_counts[client_ip] = [
        t for t in _request_counts[client_ip] if t > window_start
    ]

    if len(_request_counts[client_ip]) >= limit:
        return True

    _request_counts[client_ip].append(now)
    return False


# ── Routes ───────────────────────────────────────────────────────────────

@app.post("/api/query")
async def handle_query(request_body: QueryRequest, request: Request):
    set_correlation_ids(conversation_id=request_body.conversation_id)
    client_ip = request.client.host
    if is_rate_limited(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a moment before trying again.",
        )

    try:
        response = await run_conversation_turn(
            message=request_body.message,
            conversation_id=request_body.conversation_id,
            context=request_body.context,
        )

        if response.result:
            log_run(request_body.message, response.result)

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/query/stream")
async def handle_query_stream(request_body: QueryRequest, request: Request):
    """SSE endpoint streaming real-time pipeline progress events."""
    set_correlation_ids(conversation_id=request_body.conversation_id)
    client_ip = request.client.host
    if is_rate_limited(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a moment before trying again.",
        )

    async def event_stream():
        try:
            async for event in run_conversation_turn_streaming(
                message=request_body.message,
                conversation_id=request_body.conversation_id,
                context=request_body.context,
            ):
                yield f"data: {_json.dumps(event)}\n\n"

                if event.get("type") == "result" and event.get("data"):
                    log_run(request_body.message, event["data"])

        except Exception as exc:
            yield f"data: {_json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/conversation/{conversation_id}")
async def get_conversation_route(conversation_id: str):
    from store.conversations import get_conversation
    conv = get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {
        "conversation_id": conv.conversation_id,
        "messages": [m.model_dump() for m in conv.messages],
        "pipeline_events": conv.pipeline_events or [],
        "context": conv.context,
        "status": conv.status,
        "turn_count": conv.turn_count,
        "detected_sector": conv.detected_sector,
        "detected_role": conv.detected_role,
    }


@app.delete("/api/conversation/{conversation_id}")
async def clear_conversation_route(conversation_id: str):
    from store.conversations import clear_conversation
    clear_conversation(conversation_id)
    return {"cleared": True}


@app.get("/api/agents")
async def get_agents():
    return AGENT_REGISTRY


async def _check_zai_connectivity() -> bool:
    """Ping Z.AI with a minimal request."""
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.post(
                f"{settings.ZAI_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.ZAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.ZAI_MODEL,
                    "messages": [{"role": "user", "content": "ping"}],
                    "max_tokens": 2,
                },
            )
            return r.status_code == 200
    except Exception:
        return False


async def _check_flock_connectivity() -> bool:
    """Ping FLock with a minimal request."""
    if not settings.FLOCK_API_KEY or not settings.FLOCK_BASE_URL:
        return False
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.post(
                f"{settings.FLOCK_BASE_URL}/chat/completions",
                headers={
                    "x-litellm-api-key": settings.FLOCK_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.FLOCK_MODEL,
                    "messages": [{"role": "user", "content": "ping"}],
                    "max_tokens": 2,
                },
            )
            return r.status_code == 200
    except Exception:
        return False


@app.get("/api/health")
async def health():
    from store.conversations import count_conversations
    zai_ok = await _check_zai_connectivity()
    flock_ok = await _check_flock_connectivity()
    return {
        "status": "ok",
        "version": VERSION,
        "agents": list(AGENT_REGISTRY.keys()),
        "uptime_seconds": round(time.time() - _start_time),
        "zai_connectivity": "ok" if zai_ok else "unavailable",
        "flock_connectivity": "ok" if flock_ok else "unavailable",
        "conversation_count": count_conversations(),
        "rate_limit": {
            "requests_per_window": settings.RATE_LIMIT_REQUESTS,
            "window_minutes": settings.RATE_LIMIT_WINDOW_MINUTES,
        },
    }
