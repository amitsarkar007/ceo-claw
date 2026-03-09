"""Structured logging with correlation IDs for end-to-end traceability."""

import json
import logging
import os
import uuid
from contextvars import ContextVar
from datetime import datetime
from pathlib import Path

LOG_DIR = Path(os.getenv("LOG_DIR", "./logs"))
LOG_DIR.mkdir(exist_ok=True)

# Context vars for correlation IDs — set at request entry, propagated through pipeline
request_id_var: ContextVar[str] = ContextVar("request_id", default="")
conversation_id_var: ContextVar[str] = ContextVar("conversation_id", default="")


def set_correlation_ids(request_id: str | None = None, conversation_id: str | None = None) -> str:
    """Set correlation IDs for the current context. Returns the request_id."""
    rid = request_id or str(uuid.uuid4())
    if request_id is not None or not request_id_var.get():
        request_id_var.set(rid)
    conversation_id_var.set(conversation_id or "")
    return rid


def get_correlation_ids() -> dict:
    """Get current correlation IDs for logging."""
    return {
        "request_id": request_id_var.get() or "",
        "conversation_id": conversation_id_var.get() or "",
    }


def _log_extra() -> dict:
    return {
        "request_id": request_id_var.get() or "",
        "conversation_id": conversation_id_var.get() or "",
    }


def get_logger(name: str) -> logging.Logger:
    """Return a logger that includes correlation IDs in every record."""
    logger = logging.getLogger(name)

    class CorrelationFilter(logging.Filter):
        def filter(self, record: logging.LogRecord) -> bool:
            record.request_id = request_id_var.get() or ""
            record.conversation_id = conversation_id_var.get() or ""
            return True

    if not any(isinstance(f, CorrelationFilter) for f in logger.filters):
        logger.addFilter(CorrelationFilter())

    return logger


def log_run(query: str, result: dict) -> None:
    """
    Append each pipeline run to a daily JSON log file.
    Includes correlation IDs when set.
    """
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": request_id_var.get() or "",
        "conversation_id": conversation_id_var.get() or "",
        "query": query,
        "query_id": result.get("query_id"),
        "detected_role": result.get("detected_role"),
        "selected_agent": result.get("selected_agent"),
        "intent": result.get("intent"),
        "pipeline_trace": result.get("pipeline_trace"),
        "confidence": result.get("confidence"),
        "adoption_score": result.get("adoption_score"),
        "deployed_url": result.get("deployed_url"),
        "stripe_product_url": result.get("stripe_product_url"),
        "model": "glm-4-plus",
        "provider": "z.ai",
        "fallback_used": result.get("fallback_used", False),
    }

    log_file = LOG_DIR / f"{datetime.utcnow().strftime('%Y-%m-%d')}.json"

    existing = []
    if log_file.exists():
        with open(log_file) as f:
            try:
                existing = json.load(f)
            except Exception:
                existing = []

    existing.append(log_entry)

    with open(log_file, "w") as f:
        json.dump(existing, f, indent=2)
