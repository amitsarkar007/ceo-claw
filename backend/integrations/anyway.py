import httpx
import os
from datetime import datetime

ANYWAY_API_KEY = os.getenv("ANYWAY_API_KEY")
ANYWAY_PROJECT_ID = os.getenv("ANYWAY_PROJECT_ID")
ANYWAY_BASE_URL = os.getenv("ANYWAY_BASE_URL", "https://api.anyway.so/v1")

# Set to "false" to disable tracing (e.g. when endpoint has SSL issues)
ANYWAY_ENABLED = os.getenv("ANYWAY_ENABLED", "true").lower() != "false"

_anyway_warned = False


async def trace(agent_name: str, run_id: str, payload: dict):
    """
    Send agent trace event to Anyway SDK.
    Called after every node in the pipeline.
    Non-blocking: failures logged once, then silently skipped.
    """
    if not ANYWAY_API_KEY or not ANYWAY_ENABLED:
        return

    event = {
        "project_id": ANYWAY_PROJECT_ID,
        "run_id": run_id,
        "agent": agent_name,
        "timestamp": datetime.utcnow().isoformat(),
        "payload": payload
    }

    global _anyway_warned
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(
                f"{ANYWAY_BASE_URL.rstrip('/')}/traces",
                headers={"Authorization": f"Bearer {ANYWAY_API_KEY}"},
                json=event
            )
    except Exception:
        if not _anyway_warned:
            _anyway_warned = True
            print("Anyway trace skipped (endpoint unavailable). Set ANYWAY_ENABLED=false in .env to silence.")
