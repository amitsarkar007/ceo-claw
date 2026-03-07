from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pipeline.graph import run_pipeline, run_conversation_turn, run_conversation_turn_streaming
from schemas.conversation import QueryRequest
import json as _json
from logger import log_run
from registry import AGENT_REGISTRY
from collections import defaultdict
from datetime import datetime, timedelta
import os

app = FastAPI(
    title="Highstreet AI",
    description="Autonomous AI Workforce for Small and Medium Businesses. Powered by Z.AI GLM-4-Plus. Built for the High Street.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

_cors_origins = os.getenv("CORS_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins.split(",") if "," in _cors_origins else [_cors_origins],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate limiting ────────────────────────────────────────────────────────

_request_counts: dict[str, list[datetime]] = defaultdict(list)


def is_rate_limited(client_ip: str, limit: int = 20, window_minutes: int = 10) -> bool:
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


@app.delete("/api/conversation/{conversation_id}")
async def clear_conversation_route(conversation_id: str):
    from store.conversations import clear_conversation
    clear_conversation(conversation_id)
    return {"cleared": True}


@app.get("/api/agents")
async def get_agents():
    return AGENT_REGISTRY


@app.get("/api/health")
async def health():
    return {"status": "ok", "agents": list(AGENT_REGISTRY.keys())}
